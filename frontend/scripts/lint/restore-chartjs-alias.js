#!/usr/bin/env node
/* eslint-env node */
/* restore-chartjs-alias.js
 * Ensures files that call ChartJS.register have a ChartJS import alias from 'chart.js'.
 * If missing, changes imports like `import { CategoryScale, ... } from 'chart.js'` to
 * `import { Chart as ChartJS, CategoryScale, ... } from 'chart.js'`.
 */
import fs from 'fs';
import path from 'path';
import process from 'node:process';
import { fileURLToPath } from 'url';

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

function needsAliasFix(code) {
  if (!/ChartJS\.register\s*\(/.test(code)) return false;
  // If ChartJS is already imported as alias, skip
  if (/import\s+\{[^}]*Chart\s+as\s+ChartJS[^}]*\}\s+from\s+['"]chart\.js['"]\s*;/.test(code)) return false;
  // Ensure there is an import from chart.js to modify
  if (!/import\s+\{[^}]+\}\s+from\s+['"]chart\.js['"]\s*;/.test(code)) return false;
  return true;
}

function applyAliasFix(code) {
  return code.replace(
    /import\s+\{([^}]+)\}\s+from\s+['"]chart\.js['"]\s*;/,
    (m, inner) => {
      // Avoid duplicating Chart alias if already exists
      if (/Chart\s+as\s+ChartJS/.test(inner)) return m;
      const cleaned = inner
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .join(', ');
      return `import { Chart as ChartJS, ${cleaned} } from 'chart.js';`;
    }
  );
}

function main() {
  const files = walk(ROOT);
  const changed = [];
  for (const f of files) {
    const code = fs.readFileSync(f, 'utf8');
    if (!needsAliasFix(code)) continue;
    const newCode = applyAliasFix(code);
    if (newCode && newCode !== code) {
      if (WRITE) fs.writeFileSync(f, newCode, 'utf8');
      changed.push({ file: f, changed: true });
    }
  }
  console.log(JSON.stringify(changed, null, 2));
  if (!WRITE) console.log('\nRun with --write to apply changes.');
}

main();
