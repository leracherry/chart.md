import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { URL, URLSearchParams } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Markdown from 'react-markdown';
import { chartComponents, remarkChart } from '../../dist/index.js';

const root = new URL('../../', import.meta.url);
const source = await readFile(new URL('examples/chart-page.md', root), 'utf8');
const template = await readFile(
  new URL('examples/demo/page.html', root),
  'utf8',
);
const chartCss = await readFile(new URL('style.css', root), 'utf8');
const escape = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
function page(markdown, error = '') {
  const content = error
    ? `<p role="alert">${escape(error)}</p>`
    : renderToStaticMarkup(
        createElement(
          Markdown,
          { remarkPlugins: [remarkChart], components: chartComponents },
          markdown,
        ),
      );
  return template
    .replace('/*CHART_CSS*/', () => chartCss)
    .replace('<!--SOURCE-->', () => escape(markdown))
    .replace('<!--CONTENT-->', () => content);
}
const server = createServer(async (req, res) => {
  if (req.url !== '/') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  if (!['GET', 'POST'].includes(req.method)) {
    res.writeHead(405);
    res.end();
    return;
  }
  let markdown = source;
  try {
    if (req.method === 'POST') {
      let body = '';
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 100_000) {
          res.writeHead(413);
          res.end('Document too large');
          return;
        }
        body += chunk.toString();
      }
      markdown = new URLSearchParams(body).get('source') ?? source;
    }
    const html = page(markdown);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(
      page(
        markdown,
        error instanceof Error ? error.message : 'Unable to render document',
      ),
    );
  }
});
const port = Number(process.env.PORT ?? 4173);
server.listen(port, '127.0.0.1', () =>
  process.stdout.write(`Chart demo: http://127.0.0.1:${port}\n`),
);
