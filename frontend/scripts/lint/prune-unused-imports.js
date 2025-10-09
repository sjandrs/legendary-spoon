#!/usr/bin/env node
/*
 * prune-unused-imports.js
 * Phase 1 codemod: identifies unused imported specifiers and prints a diff or rewrites file.
 * Current implementation: ANALYSIS ONLY (no write) unless --write flag passed.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '../../src');
const WRITE = process.argv.includes('--write');

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full, acc);
    } else if (/\.jsx?$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

function parseImports(code) {
  const importRegex = /import\s+([^'";]+)from\s+['"]([^'"]+)['"];?/g;
  const matches = [];
  let m;
  while ((m = importRegex.exec(code))) {
    matches.push({ raw: m[0], clause: m[1].trim(), source: m[2] });
  }
  return matches;
}

function collectUsage(code) {
  // Very naive token-based usage detection.
  const tokens = new Set(code.split(/[^A-Za-z0-9_]+/g).filter(Boolean));
  return tokens;
}

function processFile(file) {
  const code = fs.readFileSync(file, 'utf8');
  const imports = parseImports(code);
  if (!imports.length) return null;
  const usage = collectUsage(code.replace(/import[^;]+;?/g, ''));
  const removals = [];
  const replacements = [];

  for (const imp of imports) {
    if (imp.clause.startsWith('{')) {
      // Named specifiers
      const inner = imp.clause.replace(/[{}]/g, '').split(',').map(s => s.trim()).filter(Boolean);
      const unused = inner.filter(name => !usage.has(name));
      if (unused.length && unused.length === inner.length) {
        // Entire import removable
        removals.push(imp.raw);
      } else if (unused.length) {
        const kept = inner.filter(n => !unused.includes(n));
        const newRaw = imp.raw.replace(/\{[^}]+\}/, '{ ' + kept.join(', ') + ' }');
        replacements.push({ old: imp.raw, next: newRaw });
      }
    } else if (/^\w+(\s*,\s*\{)/.test(imp.clause)) {
      // default + named
      const [defaultPart, namedPart] = imp.clause.split(/,/);
      const namedInner = namedPart.replace(/[{}]/g, '').split(',').map(s => s.trim()).filter(Boolean);
      const unusedNamed = namedInner.filter(n => !usage.has(n));
      if (!usage.has(defaultPart.trim()) && unusedNamed.length === namedInner.length) {
        removals.push(imp.raw);
      } else if (unusedNamed.length) {
        const kept = namedInner.filter(n => !unusedNamed.includes(n));
        const newRaw = imp.raw.replace(/\{[^}]+\}/, '{ ' + kept.join(', ') + ' }');
        replacements.push({ old: imp.raw, next: newRaw });
      }
    }
  }

  if (!removals.length && !replacements.length) return null;

  let newCode = code;
  for (const r of removals) newCode = newCode.replace(r + '\n', '');
  for (const rep of replacements) newCode = newCode.replace(rep.old, rep.next);

  if (WRITE) fs.writeFileSync(file, newCode, 'utf8');

  return { file, removals, replacements };
}

function main() {
  const files = walk(ROOT);
  const report = [];
  for (const f of files) {
    const res = processFile(f);
    if (res) report.push(res);
  }
  if (!report.length) {
    console.log('No unused imports detected (heuristic).');
    return;
  }
  console.log(JSON.stringify(report, null, 2));
  if (!WRITE) {
    console.log('\nRun with --write to apply changes.');
  }
}

main();
