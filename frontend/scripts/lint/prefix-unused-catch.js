#!/usr/bin/env node
/* prefix-unused-catch.js
 * Renames unused catch parameters (err) to _err for clarity.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../../src');
const WRITE = process.argv.includes('--write');

function walk(dir, acc=[]) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, acc); else if (/\.jsx?$/.test(entry)) acc.push(full);
  }
  return acc;
}

function transform(file) {
  const code = fs.readFileSync(file, 'utf8');
  const re = /catch\s*\((\s*err)\s*\)\s*\{/g;
  if (!re.test(code)) return null;
  const newCode = code.replace(re, match => match.replace('err', '_err'));
  if (newCode === code) return null;
  if (WRITE) fs.writeFileSync(file, newCode, 'utf8');
  return { file, changed: true };
}

function main() {
  const files = walk(ROOT);
  const changed = files.map(transform).filter(Boolean);
  console.log(JSON.stringify(changed, null, 2));
  if (!WRITE) console.log('\nRun with --write to apply changes.');
}

main();
