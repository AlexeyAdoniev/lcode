const { spawnSync } = require('node:child_process');
const { readFileSync, writeFileSync } = require('node:fs');

const SOURCE_PATH = '/tmp/solution.cjs';

function main() {
  const { code, args } = JSON.parse(readFileSync(0, 'utf8'));

  if (typeof code !== 'string') {
    throw new Error('code must be a string');
  }
  if (!Array.isArray(args) || !args.every((arg) => typeof arg === 'string')) {
    throw new Error('args must be a list of strings');
  }

  writeFileSync(SOURCE_PATH, code);
  const result = spawnSync(process.execPath, [SOURCE_PATH, ...args], {
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  if (result.error) {
    throw result.error;
  }
  if (result.signal) {
    process.kill(process.pid, result.signal);
    return;
  }
  process.exitCode = result.status ?? 1;
}

main();
