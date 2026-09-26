import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const cli = fileURLToPath(
  new URL('../packages/cli/dist/index.js', import.meta.url),
);

function run(...args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
}

describe('built workspace', () => {
  it('resolves the core package through the CLI workspace dependency', () => {
    const result = spawnSync(
      process.execPath,
      ['--input-type=module', '-e', "await import('@chartmd/core')"],
      {
        cwd: fileURLToPath(new URL('../packages/cli', import.meta.url)),
        encoding: 'utf8',
      },
    );
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });

  it.each([[], ['--help'], ['-h']])('shows help for %j', (...args) => {
    const result = run(...args);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('Usage: chartmd render');
  });

  it('fails clearly for commands that are not implemented', () => {
    const result = run('watch', 'example.md');
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('unsupported command');
  });
});
