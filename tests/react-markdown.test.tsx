import { renderToStaticMarkup } from 'react-dom/server';
import Markdown from 'react-markdown';
import { describe, expect, it } from 'vitest';
import {
  Chart,
  chartComponents,
  parseChart,
  remarkChart,
} from '../src/index.js';

const markdown = `Before

\`\`\`chart
type: line
title: Response time

| Release | API | Worker |
| --- | ---: | ---: |
| 1.0 | 182 | 240 |
| 1.1 | 151 | 205 |
\`\`\`

After`;

describe('React integration', () => {
  it('renders a chart fence through react-markdown', () => {
    const html = renderToStaticMarkup(
      <Markdown remarkPlugins={[remarkChart]} components={chartComponents}>
        {markdown}
      </Markdown>,
    );

    expect(html).toContain('<p>Before</p>');
    expect(html).toContain('class="chartmd"');
    expect(html).toContain('Response time');
    expect(html).toContain('stroke="currentColor"');
    expect(html).not.toContain('language-chart');
    expect(html).toContain('<p>After</p>');
  });

  it('renders the component directly', () => {
    const definition = parseChart(`type: bar
| Item | Value |
| --- | ---: |
| A | 2 |`);
    const html = renderToStaticMarkup(<Chart definition={definition} />);

    expect(html).toContain('<svg');
    expect(html).toContain('role="img"');
    expect(html).toContain('A, Value: 2');
  });
});
