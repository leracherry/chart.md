import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import process from 'node:process';

const registry = process.argv[2];
if (
  !['https://registry.npmjs.org/', 'https://npm.pkg.github.com/'].includes(
    registry,
  )
) {
  throw new Error('An explicit supported registry is required');
}
const { name, version } = JSON.parse(readFileSync('package.json', 'utf8'));
const result = spawnSync(
  'npm',
  ['view', `${name}@${version}`, 'version', '--json', '--registry', registry],
  { encoding: 'utf8' },
);
if (result.status === 0) {
  if (JSON.parse(result.stdout) !== version)
    throw new Error('Unexpected registry version');
  process.stdout.write(`${name}@${version} already exists on ${registry}\n`);
} else {
  // Only a missing version permits publication. Authentication/network failures must stop the run.
  if (!/E404/.test(result.stdout + result.stderr)) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
  const archive = JSON.parse(readFileSync('release/pack.json', 'utf8'))[0]
    .filename;
  const published = spawnSync(
    'npm',
    [
      'publish',
      `./release/${archive}`,
      '--registry',
      registry,
      '--access',
      'public',
      '--ignore-scripts',
    ],
    { stdio: 'inherit' },
  );
  if (published.status !== 0) process.exit(published.status ?? 1);
}
