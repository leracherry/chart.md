import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';

const { name, version } = JSON.parse(readFileSync('package.json', 'utf8'));
const tag = `v${version}`;
const archive = JSON.parse(readFileSync('release/pack.json', 'utf8'))[0]
  .filename;
const notes = readFileSync('CHANGELOG.md', 'utf8')
  .split(`## ${version}\n`)[1]
  ?.split('\n## ')[0];
if (!notes) throw new Error(`Missing changelog for ${version}`);
writeFileSync(
  'release/notes.md',
  `${notes.trim()}\n\nInstall from npm:\n\n\`\`\`sh\nnpm install ${name}@${version}\n\`\`\`\n\nAlso published to GitHub Packages.\n`,
);
const existing = spawnSync(
  'gh',
  ['release', 'view', tag, '--repo', process.env.GITHUB_REPOSITORY],
  { encoding: 'utf8' },
);
if (existing.status === 0) {
  process.stdout.write(
    `Release ${tag} already exists; preserving its notes and assets.\n`,
  );
} else {
  if (!/not found/i.test(existing.stderr)) throw new Error(existing.stderr);
  const result = spawnSync(
    'gh',
    [
      'release',
      'create',
      tag,
      `release/${archive}`,
      '--repo',
      process.env.GITHUB_REPOSITORY,
      '--target',
      process.env.GITHUB_SHA,
      '--title',
      `${name} ${tag}`,
      '--notes-file',
      'release/notes.md',
    ],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}
