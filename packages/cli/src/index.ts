#!/usr/bin/env node
const args = process.argv.slice(2);

if (
  args.length === 0 ||
  (args.length === 1 && ['--help', '-h'].includes(args[0]!))
) {
  console.log(`chartmd — Charts for README.md.

Usage: chartmd --help

Repository foundation only. Chart rendering is planned for the next milestone.`);
} else {
  console.error(
    'chartmd: unsupported command. Run chartmd --help for available options.',
  );
  process.exitCode = 1;
}
