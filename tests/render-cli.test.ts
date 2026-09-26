import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  rmSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { afterEach, beforeEach, expect, it } from 'vitest';

const cli = fileURLToPath(
  new URL('../packages/cli/dist/index.js', import.meta.url),
);
const example = readFileSync(
  new URL('../examples/basic/example.md', import.meta.url),
  'utf8',
);
let cwd: string;
beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), 'chartmd-'));
  writeFileSync(join(cwd, 'example.md'), example);
});
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});
const run = (...args: string[]) =>
  spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8' });

it('renders the example to chart.svg by default', () => {
  const result = run('render', 'example.md');
  expect(result.status).toBe(0);
  expect(result.stderr).toBe('');
  expect(readFileSync(join(cwd, 'chart.svg'), 'utf8')).toBe(
    readFileSync(
      new URL('../examples/basic/chart.svg', import.meta.url),
      'utf8',
    ),
  );
  expect(readFileSync(join(cwd, 'chart.svg'), 'utf8')).toContain(
    '<title id="chart-title">Bundle size</title>',
  );
});
it('supports explicit output paths with spaces', () => {
  expect(
    run('render', 'example.md', '--output', 'bundle size.svg').status,
  ).toBe(0);
  expect(existsSync(join(cwd, 'bundle size.svg'))).toBe(true);
});
it('preserves existing files including source', () => {
  writeFileSync(join(cwd, 'chart.svg'), 'existing');
  expect(run('render', 'example.md').status).toBe(1);
  expect(readFileSync(join(cwd, 'chart.svg'), 'utf8')).toBe('existing');
  expect(
    run('render', 'example.md', '--output', 'example.md').stderr,
  ).toContain('different files');
  expect(readFileSync(join(cwd, 'example.md'), 'utf8')).toBe(example);
});
it.each([
  ['render'],
  ['render', 'missing.md'],
  ['render', 'example.md', '--unknown', 'x'],
  ['render', 'example.md', '--output'],
])('reports argument and file errors: %j', (...args) => {
  const result = run(...args);
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('chartmd:');
  expect(result.stderr).not.toContain('at main');
  expect(existsSync(join(cwd, 'chart.svg'))).toBe(false);
});
it('does not write output when parsing fails', () => {
  writeFileSync(
    join(cwd, 'example.md'),
    example.replace('| Core | 18 |', '| Core | bad |'),
  );
  const result = run('render', 'example.md');
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('Line 8:');
  expect(existsSync(join(cwd, 'chart.svg'))).toBe(false);
});
