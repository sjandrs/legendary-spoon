#!/usr/bin/env node
/* audit-hooks.js
 * Scans for HOOK-JUSTIFY annotations and outstanding react-hooks/exhaustive-deps comments.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../../src');

function walk(dir, acc=[]) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, acc); else if (/\.jsx?$/.test(entry)) acc.push(full);
  }
  return acc;
}

function analyze(file) {
  const code = fs.readFileSync(file, 'utf8');
  const justifications = [...code.matchAll(/HOOK-JUSTIFY\(([^)]+)\)/g)].map(m => m[1]);
  const hookWarnings = [...code.matchAll(/react-hooks\/exhaustive-deps/g)].length; // heuristic placeholder
  if (!justifications.length && !hookWarnings) return null;
  return { file, justifications, hookWarnings };
}

function main() {
  const files = walk(ROOT);
  const report = files.map(analyze).filter(Boolean);
  console.log(JSON.stringify(report, null, 2));
}

main();
