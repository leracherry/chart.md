import { validate, type ChartDefinition } from './model.js';

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
const round = (value: number): string => String(Number(value.toFixed(3)));
const format = (value: number): string => {
  if (value === 0) return '0';
  return Math.abs(value) >= 1e6 || Math.abs(value) < 0.001
    ? value.toExponential(1)
    : String(Number(value.toPrecision(5)));
};

/** Return a zero-inclusive, non-degenerate numeric domain. */
export function numericDomain(values: readonly number[]): [number, number] {
  if (!values.length || values.some((value) => !Number.isFinite(value)))
    throw new Error('Domain requires finite numeric values.');
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  return min === max ? [0, 1] : [min, max];
}

/** Render deterministic standalone SVG without browser or runtime dependencies. */
export function render(chart: ChartDefinition): string {
  validate(chart);
  const width = Math.max(640, chart.labels.length * 96 + 112);
  const height = 400;
  const left = 88;
  const right = width - 24;
  const top = 84;
  const bottom = 324;
  const [min, max] = numericDomain(chart.series.values);
  const y = (value: number): number =>
    bottom - ((value - min) / (max - min)) * (bottom - top);
  const baseline = y(0);
  const title = chart.title ?? chart.series.name;
  const unit = chart.unit ? ` ${chart.unit}` : '';
  const description = chart.labels
    .map((label, i) => `${label}: ${chart.series.values[i]}${unit}`)
    .join('; ');
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="chart-title chart-description">`,
    `  <title id="chart-title">${escape(title)}</title>`,
    `  <desc id="chart-description">${escape(description)}</desc>`,
    '  <rect width="100%" height="100%" fill="#ffffff"/>',
    '  <g font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="12" fill="#24292f">',
    `    <text x="${left}" y="32" font-size="20" font-weight="600">${escape(title.slice(0, 70))}</text>`,
    `    <text x="${left}" y="56" fill="#57606a">${escape((chart.series.name + (chart.unit ? ` (${chart.unit})` : '')).slice(0, 90))}</text>`,
  ];
  for (let i = 0; i <= 4; i++) {
    const value = min + ((max - min) * i) / 4;
    const position = round(y(value));
    parts.push(
      `    <path d="M ${left} ${position} H ${right}" stroke="#d8dee4"/>`,
      `    <text x="${left - 12}" y="${position}" dy="4" text-anchor="end" fill="#57606a">${format(value)}</text>`,
    );
  }
  parts.push(
    `    <path d="M ${left} ${round(baseline)} H ${right}" stroke="#57606a"/>`,
  );
  const step = (right - left) / chart.labels.length;
  chart.labels.forEach((label, i) => {
    const value = chart.series.values[i]!;
    const center = left + step * (i + 0.5);
    const barWidth = Math.min(56, step * 0.6);
    const barY = Math.min(y(value), baseline);
    const barHeight = Math.abs(y(value) - baseline);
    parts.push(
      `    <rect x="${round(center - barWidth / 2)}" y="${round(barY)}" width="${round(barWidth)}" height="${round(barHeight)}" fill="#0969da"><title>${escape(`${label}: ${value}${unit}`)}</title></rect>`,
      `    <text x="${round(center)}" y="${round(value < 0 ? y(value) + 18 : y(value) - 10)}" text-anchor="middle">${format(value)}</text>`,
      `    <text x="${round(center)}" y="370" text-anchor="middle"><title>${escape(label)}</title>${escape(label.length > 12 ? label.slice(0, 11) + '…' : label)}</text>`,
    );
  });
  parts.push('  </g>', '</svg>');
  return parts.join('\n') + '\n';
}
