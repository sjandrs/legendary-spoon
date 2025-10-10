#!/usr/bin/env node
/* eslint-env node */
/* repair-console-and-strings.js
 * Fixes unintended replacements from catch param normalization:
 * - Replaces console._err( with console.error(
 * - Replaces `_err` back to `error` inside string literals ('', "") but not in code.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../../src');
const WRITE = process.argv.includes('--write');

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, acc); else if (/\.jsx?$/.test(entry)) acc.push(full);
  }
  return acc;
}

function replaceInStrings(code) {
  let out = '';
  let i = 0;
  while (i < code.length) {
    const ch = code[i];
    if (ch === '"' || ch === '\'') {
      const quote = ch;
      let j = i + 1;
      let str = '';
      while (j < code.length) {
        const c = code[j];
        if (c === '\\') { // escape
          str += c + (code[j + 1] || '');
          j += 2;
          continue;
        }
        if (c === quote) { break; }
        str += c;
        j++;
      }
      const replaced = str.replace(/_err/g, 'error');
      out += quote + replaced + quote;
      i = j + 1;
    } else {
      out += ch;
      i++;
    }
  }
  return out;
}

function transform(file) {
  const code = fs.readFileSync(file, 'utf8');
  let newCode = code.replace(/console\._err\s*\(/g, 'console.error(');
  // Only replace _err -> error inside string literals
  newCode = replaceInStrings(newCode);
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
