#!/usr/bin/env node
/* eslint-env node */
/* fix-catch-param-references.js
 * Normalizes catch parameter names to `_err` and updates references within the catch block accordingly.
 */
import fs from 'fs';
import path from 'path';
import process from 'node:process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../../src');
const WRITE = process.argv.includes('--write');
const TESTS_ONLY = process.argv.includes('--tests-only');

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, acc);
    else if (/\.jsx?$/.test(entry)) {
      const isTest = /__tests__/.test(full) || /\.test\.[jt]sx?$/.test(entry);
      if (!TESTS_ONLY || isTest) acc.push(full);
    }
  }
  return acc;
}

function replaceInCatchBlocks(code) {
  const catchRegex = /catch\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)\s*\{/g;
  let out = '';
  let lastIndex = 0;
  let changed = false;
  let match;
  while ((match = catchRegex.exec(code)) !== null) {
    const paramName = match[1];
    out += code.slice(lastIndex, match.index);
    const braceStart = match.index + match[0].lastIndexOf('{');
    // find block end
    let i = braceStart;
    let depth = 0;
    let end = -1;
    while (i < code.length) {
      const ch = code[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) { end = i; break; }
      }
      i++;
    }
    if (end === -1) {
      // give up, append remainder
      out += code.slice(match.index);
      lastIndex = code.length;
      break;
    }
    const beforeBlock = code.slice(match.index, braceStart + 1)
      .replace(/catch\s*\(\s*[A-Za-z_][A-Za-z0-9_]*\s*\)/, 'catch (_err)');
    const block = code.slice(braceStart + 1, end);
    let replacedBlock = block.replace(new RegExp(`\\b${paramName}\\b`, 'g'), '_err');
    // If the parameter is already _err (from prior codemod), also normalize any stray 'err' identifiers in-block
    if (paramName === '_err') {
      replacedBlock = replacedBlock.replace(/\berr\b/g, '_err');
    }
    if (replacedBlock !== block || beforeBlock.indexOf('_err') !== -1) changed = true;
    out += beforeBlock + replacedBlock + '}';
    lastIndex = end + 1;
  }
  if (lastIndex < code.length) out += code.slice(lastIndex);
  return { code: out || code, changed };
}

function transform(file) {
  const code = fs.readFileSync(file, 'utf8');
  if (!/catch\s*\(/.test(code)) return null;
  const { code: newCode, changed } = replaceInCatchBlocks(code);
  if (!changed || newCode === code) return null;
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
