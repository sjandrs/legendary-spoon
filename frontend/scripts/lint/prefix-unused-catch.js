#!/usr/bin/env node
/* eslint-env node */
/* prefix-unused-catch.js
 * Renames unused catch parameters (err) to _err for clarity.
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

function walk(dir, acc=[]) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full, acc);
    } else if (/\.jsx?$/.test(entry)) {
      const isTest = /__tests__/.test(full) || /\.test\.[jt]sx?$/.test(entry);
      if (!TESTS_ONLY || isTest) acc.push(full);
    }
  }
  return acc;
}

function transform(file) {
  const code = fs.readFileSync(file, 'utf8');
  const catchRegex = /catch\s*\(\s*err\s*\)\s*\{/g;
  let match;
  let changed = false;
  let result = '';
  let lastIndex = 0;

  while ((match = catchRegex.exec(code)) !== null) {
    // Append content up to the catch block
    result += code.slice(lastIndex, match.index);

    // Start of the block is the index of the '{'
    const braceStart = match.index + match[0].lastIndexOf('{');
    // Find matching closing brace
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
      // Fallback: cannot find matching brace; copy remainder and break
      result += code.slice(match.index);
      lastIndex = code.length;
      break;
    }

    // Replace parameter name in the catch signature
    const catchSig = code.slice(match.index, braceStart + 1).replace(/catch\s*\(\s*err\s*\)/, 'catch (_err)');

    // Replace references to err inside the catch block only (token-aware)
    const blockContent = code.slice(braceStart + 1, end);
    const replacedBlock = blockContent.replace(/\berr\b/g, '_err');

    result += catchSig + replacedBlock + '}';
    lastIndex = end + 1;
    changed = changed || blockContent !== replacedBlock;
  }

  if (lastIndex < code.length) result += code.slice(lastIndex);

  if (!changed && result === '') return null;
  const newCode = result || code;
  if (newCode !== code && WRITE) fs.writeFileSync(file, newCode, 'utf8');
  return newCode !== code ? { file, changed: true } : null;
}

function main() {
  const files = walk(ROOT);
  const changed = files.map(transform).filter(Boolean);
  console.log(JSON.stringify(changed, null, 2));
  if (!WRITE) console.log('\nRun with --write to apply changes.');
}

main();
