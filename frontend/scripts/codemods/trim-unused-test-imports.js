#!/usr/bin/env node
/*
  Codemod: trim-unused-test-imports
  Purpose: Remove unused imported bindings in test files to reduce lint noise.
  Status: Draft (dry-run by default)

  Strategy (heuristic, non-AST):
    1. Discover test files (*.test.js / *.test.jsx under src/).
    2. Parse simple import lines; capture default + named specifiers.
    3. Regex search for each specifier usage in body (word boundary).
    4. Remove unused specifiers; drop import line if empty.
    5. Output JSON summary. Use --write to apply.

  Limitations:
    - May false-positive if identifier only appears inside dynamic strings/comments.
    - Keeps React default even if unused (JSX transform safety).
    - Skips namespace imports (import * as X) for simplicity.

  Future Enhancements:
    - AST mode (Babel / @typescript-eslint) for precise scope analysis.
    - Option to prefix unused function args with `_`.
*/

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

function findTestFiles(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'coverage' || e.name === 'dist') continue;
      out.push(...findTestFiles(full));
    } else if (/\.test\.jsx?$/.test(e.name)) {
      out.push(full);
    }
  }
  return out;
}

function parseImport(line) {
  // Matches: import { a, b as c } from 'module'; OR import React, { useState } from 'react';
  if (!line.startsWith('import')) return null;
  const fromMatch = line.match(/from\s+['"].+['"];?$/);
  if (!fromMatch) return null;
  // Extract inside of curly braces
  const named = [];
  const defaultMatch = line.match(/^import\s+([A-Za-z_$][\w$]*)\s*(,|from)/);
  const defaultImport = defaultMatch ? defaultMatch[1] : null;
  const namedSection = line.match(/\{([^}]+)\}/);
  if (namedSection) {
    namedSection[1].split(',').forEach(part => {
      const seg = part.trim();
      if (!seg) return;
      // support alias `x as y`
      const alias = seg.split(/\s+as\s+/i).pop().trim();
      named.push(alias);
    });
  }
  return { defaultImport, named, original: line };
}

function findUnused(spec, body, options = {}) {
  const unused = [];
  const { preserveReact = true } = options;
  if (spec.defaultImport) {
    if (!(preserveReact && spec.defaultImport === 'React')) {
      const re = new RegExp(`\\b${spec.defaultImport}\\b`, 'g');
      if (!re.test(body)) unused.push({ type: 'default', name: spec.defaultImport });
    }
  }
  for (const n of spec.named) {
    const re = new RegExp(`\\b${n}\\b`, 'g');
    if (!re.test(body)) unused.push({ type: 'named', name: n });
  }
  return unused;
}

function applyRemovals(spec, unused) {
  if (!unused.length) return spec.original; // unchanged
  const unusedSet = new Set(unused.filter(u => u.type === 'named').map(u => u.name));
  const removeDefault = unused.some(u => u.type === 'default');

  // Rebuild line
  let line = spec.original;
  if (removeDefault) {
    // Remove default import token
    line = line.replace(/import\s+[A-Za-z_$][\w$]*\s*(,\s*)?/, 'import ');
  }
  if (unusedSet.size) {
    line = line.replace(/\{([^}]+)\}/, (m, inner) => {
      const kept = inner.split(',').map(s => s.trim()).filter(Boolean).filter(part => {
        const alias = part.split(/\s+as\s+/i).pop().trim();
        return !unusedSet.has(alias);
      });
      return kept.length ? `{ ${kept.join(', ')} }` : '';
    });
  }
  // Cleanup leftover syntax artifacts
  line = line.replace(/import\s+from/, 'import'); // edge case
  line = line.replace(/,{2,}/g, ',');
  line = line.replace(/\{\s*\}\s*,?\s*/g, '');
  line = line.replace(/import\s+;?/,'');
  // If nothing remains between import and from, remove entire line
  if (/^import\s+from/.test(line) || /^import\s*$/.test(line) || /^import\s*;?$/.test(line)) {
    return ''; // drop line
  }
  return line;
}

function processFile(file, write = false) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const body = lines.join('\n');
  const edits = [];
  const newLines = [...lines];
  lines.forEach((line, idx) => {
    if (!line.startsWith('import')) return;
    const spec = parseImport(line);
    if (!spec) return;
    const unused = findUnused(spec, body);
    if (!unused.length) return;
    const updated = applyRemovals(spec, unused);
    if (updated !== line) {
      edits.push({ line: idx + 1, original: line, updated, unused });
      newLines[idx] = updated;
    }
  });
  if (write && edits.length) {
    const finalText = newLines.filter(l => l.trim() !== '').join('\n');
    fs.writeFileSync(file, finalText + '\n', 'utf8');
  }
  return { file, edits };
}

function main() {
  const write = process.argv.includes('--write');
  const rootSrc = path.join(ROOT, 'src');
  const testFiles = findTestFiles(rootSrc);
  const results = testFiles.map(f => processFile(f, write)).filter(r => r.edits.length);
  const summary = {
    writeMode: write,
    filesTouched: results.length,
    symbolsRemoved: results.reduce((acc, r) => acc + r.edits.reduce((a, e) => a + e.unused.length, 0), 0),
    results,
  };
  console.log(JSON.stringify(summary, null, 2));
}

main();
