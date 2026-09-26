import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const registry = process.argv.includes('--registry');
const root = process.cwd();
const archives = resolve('release');
mkdirSync(archives, { recursive: true });
const packages = ['core', 'cli'].map((directory) => {
  const cwd = resolve('packages', directory);
  const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'));
  if (pkg.private || !pkg.license || pkg.version === '0.0.0')
    throw new Error(`Package ${pkg.name} is not ready to publish.`);
  if (!registry)
    execFileSync('pnpm', ['pack', '--pack-destination', archives], {
      cwd,
      stdio: 'inherit',
    });
  return {
    ...pkg,
    archive: join(
      archives,
      `${pkg.name.replace('@', '').replace('/', '-')}-${pkg.version}.tgz`,
    ),
  };
});
const consumer = mkdtempSync(join(tmpdir(), 'chartmd-release-'));
try {
  execFileSync(
    'npm',
    [
      'install',
      '--prefix',
      consumer,
      '--ignore-scripts',
      ...(registry ? [] : ['--offline']),
      '--cache',
      join(consumer, '.npm-cache'),
      '--no-audit',
      '--no-fund',
      ...packages.map((pkg) =>
        registry ? `${pkg.name}@${pkg.version}` : pkg.archive,
      ),
    ],
    { stdio: 'inherit' },
  );
  const bin = join(consumer, 'node_modules/.bin/chartmd');
  execFileSync(bin, ['--help'], { cwd: consumer, stdio: 'inherit' });
  execFileSync(bin, ['build', join(root, 'examples/engine/README.md')], {
    cwd: consumer,
    stdio: 'inherit',
  });
  const svg = readFileSync(
    join(consumer, '.github/charts/latency.svg'),
    'utf8',
  );
  if (!svg.includes('API latency'))
    throw new Error('Packed CLI failed the rendering smoke test.');
  execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import { parse, render } from '@chartmd/core'; if (!render(parse('type: bar\\n| Name | Value |\\n| --- | --- |\\n| A | 2 |')).includes('<svg')) process.exit(1);`,
    ],
    { cwd: consumer, stdio: 'inherit' },
  );
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
