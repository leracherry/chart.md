import { validate, type ChartDefinition } from './model.js';
import { createScale, formatNumber } from './scales.js';

const colors = [
  '#0969da',
  '#bf3989',
  '#1a7f37',
  '#9a6700',
  '#8250df',
  '#b34a00',
];
const dashes = ['', '8 4', '2 3', '10 3 2 3', '5 3', '12 4'];
const escape = (text: string): string =>
  text
    .replace(
      /[&<>"']/g,
      (char) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&apos;',
        })[char]!,
    )
    // XML 1.0 forbids these control characters even when escaped.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '');
const n = (value: number): string => String(Number(value.toFixed(3)));
const shorten = (text: string, limit: number): string => {
  const chars = Array.from(text);
  return chars.length > limit ? chars.slice(0, limit - 1).join('') + '…' : text;
};

/** Standalone deterministic SVG with shared scales and accessible full values. */
export function render(chart: ChartDefinition): string {
  validate(chart);
  const horizontal = chart.type === 'horizontal-bar';
  const line = chart.type === 'line';
  const count = chart.series.length;
  const legendRows = count > 1 ? Math.ceil(count / 3) : 0;
  const width = horizontal
    ? 800
    : Math.max(720, chart.labels.length * Math.max(88, count * 25) + 124);
  const top = 90 + legendRows * 26;
  const height = horizontal
    ? top + chart.labels.length * Math.max(54, count * 24 + 14) + 84
    : top + 320;
  const left = horizontal ? 210 : 94;
  const right = width - 64;
  const bottom = height - 84;
  const scale = createScale(
    chart.series.flatMap(({ values }) => values),
    horizontal ? left : bottom,
    horizontal ? right : top,
  );
  const zero = scale.position(0);
  const title = chart.title ?? (count === 1 ? chart.series[0]!.name : 'Chart');
  const unit = chart.unit ? ` ${chart.unit}` : '';
  const description = chart.series
    .map(
      (series) =>
        `${series.name}: ` +
        chart.labels
          .map((label, i) => `${label}: ${series.values[i]}${unit}`)
          .join('; '),
    )
    .join('. ');
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="chart-title chart-description">`,
    `  <title id="chart-title">${escape(title)}</title>`,
    `  <desc id="chart-description">${escape(description)}</desc>`,
    '  <rect width="100%" height="100%" fill="#ffffff"/>',
    '  <g font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="12" fill="#24292f">',
  ];
  const text = (
    x: number,
    y: number,
    value: string,
    anchor = 'start',
    limit = 70,
    extra = '',
  ) => {
    parts.push(
      `    <text x="${n(x)}" y="${n(y)}" text-anchor="${anchor}"${extra}><title>${escape(value)}</title>${escape(shorten(value, limit))}</text>`,
    );
  };
  const path = (d: string, stroke: string, extra = '') =>
    parts.push(`    <path d="${d}" fill="none" stroke="${stroke}"${extra}/>`);
  text(
    24,
    32,
    title,
    'start',
    Math.floor((width - 48) / 12),
    ' font-size="20" font-weight="600"',
  );
  if (legendRows)
    chart.series.forEach((series, i) => {
      const x = 24 + (i % 3) * ((width - 48) / 3);
      const y = 62 + Math.floor(i / 3) * 26;
      if (line)
        path(
          `M ${n(x)} ${y - 4} h 22`,
          colors[i]!,
          ` stroke-width="2" stroke-dasharray="${dashes[i]}"`,
        );
      else
        parts.push(
          `    <rect x="${n(x)}" y="${y - 13}" width="14" height="14" fill="${colors[i]}"/>`,
        );
      text(
        x + 30,
        y,
        series.name,
        'start',
        Math.floor(((width - 48) / 3 - 40) / 8),
      );
    });
  const valueCaption = horizontal ? chart.x : chart.y;
  const categoryCaption = horizontal ? chart.y : chart.x;
  const valueTitle =
    (valueCaption ?? (count === 1 ? chart.series[0]!.name : 'Value')) +
    (chart.unit ? ` (${chart.unit})` : '');
  text(
    (left + right) / 2,
    height - 22,
    horizontal ? valueTitle : (categoryCaption ?? ''),
    'middle',
    Math.floor((right - left) / 8),
  );
  const verticalCaption = horizontal ? (categoryCaption ?? '') : valueTitle;
  text(
    20,
    (top + bottom) / 2,
    verticalCaption,
    'middle',
    Math.floor((bottom - top) / 8),
    ` transform="rotate(-90 20 ${n((top + bottom) / 2)})"`,
  );
  for (const tick of scale.ticks) {
    const position = scale.position(tick);
    if (horizontal) {
      path(`M ${n(position)} ${top} V ${bottom}`, '#d8dee4');
      text(position, bottom + 24, formatNumber(tick), 'middle');
    } else {
      path(`M ${left} ${n(position)} H ${right}`, '#d8dee4');
      text(left - 12, position + 4, formatNumber(tick), 'end');
    }
  }
  path(
    horizontal
      ? `M ${n(zero)} ${top} V ${bottom}`
      : `M ${left} ${n(zero)} H ${right}`,
    '#57606a',
  );
  const step = (horizontal ? bottom - top : right - left) / chart.labels.length;
  const categoryPosition = (i: number): number =>
    (horizontal ? top : left) + step * (i + 0.5);
  chart.labels.forEach((label, i) => {
    if (horizontal) text(left - 14, categoryPosition(i) + 4, label, 'end', 20);
    else
      text(
        categoryPosition(i),
        bottom + 40,
        label,
        'middle',
        Math.floor(step / 8),
      );
  });
  chart.series.forEach((series, s) => {
    const color = colors[s]!;
    if (line) {
      const points = series.values
        .map(
          (value, i) =>
            `${i ? 'L' : 'M'} ${n(categoryPosition(i))} ${n(scale.position(value))}`,
        )
        .join(' ');
      path(
        points,
        color,
        ` stroke-width="2" stroke-linejoin="round" stroke-dasharray="${dashes[s]}"`,
      );
    }
    series.values.forEach((value, i) => {
      const position = scale.position(value);
      const detail = escape(
        `${series.name} — ${chart.labels[i]}: ${value}${unit}`,
      );
      if (line) {
        const x = categoryPosition(i);
        if (s % 3 === 0)
          parts.push(
            `    <circle cx="${n(x)}" cy="${n(position)}" r="4" fill="${color}"><title>${detail}</title></circle>`,
          );
        else if (s % 3 === 1)
          parts.push(
            `    <rect x="${n(x - 4)}" y="${n(position - 4)}" width="8" height="8" fill="${color}"><title>${detail}</title></rect>`,
          );
        else
          parts.push(
            `    <path d="M ${n(x)} ${n(position - 5)} l 5 5 -5 5 -5 -5 Z" fill="${color}"><title>${detail}</title></path>`,
          );
        return;
      }
      const thickness = Math.min(horizontal ? 20 : 48, (step * 0.72) / count);
      const center = categoryPosition(i) + (s - (count - 1) / 2) * thickness;
      const start = Math.min(zero, position);
      const length = Math.abs(position - zero);
      parts.push(
        horizontal
          ? `    <rect x="${n(start)}" y="${n(center - thickness * 0.44)}" width="${n(length)}" height="${n(thickness * 0.88)}" fill="${color}"><title>${detail}</title></rect>`
          : `    <rect x="${n(center - thickness * 0.44)}" y="${n(start)}" width="${n(thickness * 0.88)}" height="${n(length)}" fill="${color}"><title>${detail}</title></rect>`,
      );
      if (count === 1) {
        if (horizontal)
          text(width - 16, center + 4, formatNumber(value), 'end');
        else
          text(
            center,
            position + (value < 0 ? 18 : -10),
            formatNumber(value),
            'middle',
          );
      }
    });
  });
  parts.push('  </g>', '</svg>');
  return parts.join('\n') + '\n';
}
