#!/usr/bin/env node
/* eslint-env node */
/* cleanup-stray-quotes.js
 * Removes lines that contain only a single quote or double quote from source files.
 */
import fs from 'fs';
import path from 'path';
import process from 'node:process';

const ROOT = path.resolve(process.cwd(), 'src');
const WRITE = process.argv.includes('--write');

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, acc);
    else if (/\.(jsx?|tsx?)$/.test(entry)) acc.push(full);
  }
  return acc;
}

function transform(file) {
  const code = fs.readFileSync(file, 'utf8');
  const lines = code.split(/\r?\n/);
  const cleaned = lines.filter(l => !/^\s*['"]\s*$/.test(l)).join('\n');
  if (cleaned !== code && WRITE) fs.writeFileSync(file, cleaned, 'utf8');
  return cleaned !== code ? { file, changed: true } : null;
}

function main() {
  const files = walk(ROOT);
  const changed = files.map(transform).filter(Boolean);
  console.log(JSON.stringify(changed, null, 2));
}

main();
