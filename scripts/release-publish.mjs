import { createHash } from 'node:crypto';
import console from 'node:console';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

for (const directory of ['core', 'cli']) {
  const pkg = JSON.parse(
    readFileSync(`packages/${directory}/package.json`, 'utf8'),
  );
  const archive = resolve(
    'release',
    `${pkg.name.replace('@', '').replace('/', '-')}-${pkg.version}.tgz`,
  );
  const result = spawnSync(
    'npm',
    ['view', `${pkg.name}@${pkg.version}`, '--json'],
    { encoding: 'utf8' },
  );
  if (result.status === 0) {
    const published = JSON.parse(result.stdout);
    const shasum = createHash('sha1')
      .update(readFileSync(archive))
      .digest('hex');
    if (published.version !== pkg.version || published.dist?.shasum !== shasum)
      throw new Error(
        `Published ${pkg.name}@${pkg.version} differs from the prepared archive; increment the version.`,
      );
    console.log(`${pkg.name}@${pkg.version} is already published; skipping.`);
    continue;
  }
  if (result.status !== 0 && !result.stderr.includes('E404'))
    throw new Error(result.stderr || 'Registry lookup failed.');
  const tag = pkg.version.includes('-') ? 'next' : 'latest';
  execFileSync(
    'npm',
    ['publish', archive, '--access', 'public', '--tag', tag],
    { stdio: 'inherit' },
  );
}
