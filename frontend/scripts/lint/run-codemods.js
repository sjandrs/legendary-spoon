#!/usr/bin/env node
/* run-codemods.js
 * Orchestrates all codemods: prune-unused-imports, prefix-unused-catch.
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DRY = process.argv.includes('--dry-run');

function run(script, args=[]) {
  const full = path.join(__dirname, script);
  const res = spawnSync('node', [full, ...(DRY ? [] : ['--write']), ...args], { stdio: 'inherit' });
  if (res.status !== 0) process.exit(res.status);
}

console.log(`Running codemods (dry=${DRY})...`);
run('prune-unused-imports.js');
run('prefix-unused-catch.js');
console.log('Codemods complete.');
