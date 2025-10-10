#!/usr/bin/env node
/* eslint-env node */
/* run-codemods.js
 * Orchestrates all codemods: prune-unused-imports, prefix-unused-catch.
 */
import { spawnSync } from 'child_process';
import process from 'node:process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Support both --dry and --dry-run flags for convenience
const DRY = process.argv.includes('--dry-run') || process.argv.includes('--dry');
const TESTS_ONLY = process.argv.includes('--tests-only');

function run(script, args = []) {
  const full = path.join(__dirname, script);
  const passThrough = [];
  if (!DRY) passThrough.push('--write');
  if (TESTS_ONLY) passThrough.push('--tests-only');
  const res = spawnSync('node', [full, ...passThrough, ...args], { stdio: 'inherit' });
  if (res.status !== 0) process.exit(res.status);
}

console.log(`Running codemods (dry=${DRY}, testsOnly=${TESTS_ONLY})...`);
run('prune-unused-imports.js');
run('prefix-unused-catch.js');
run('fix-catch-param-references.js');
run('restore-chartjs-alias.js');
run('repair-console-and-strings.js');
run('cleanup-stray-quotes.js');
console.log('Codemods complete.');
