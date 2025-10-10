#!/usr/bin/env node
/**
 * AST-based unused import remover.
 * Conservative: only removes specifiers proven unused; keeps side-effect and namespace imports.
 * Usage: node scripts/codemods/unused-imports-ast.cjs [--write] [--include=glob1,glob2] [--report=json]
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const glob = require('glob');

const argv = process.argv.slice(2);
const write = argv.includes('--write');
const reportJson = argv.includes('--report=json');
const includeArg = argv.find(a => a.startsWith('--include='));
const includeGlobs = includeArg ? includeArg.replace('--include=', '').split(',') : [
  'src/components/**/*.{js,jsx}',
  'src/__tests__/**/*.{js,jsx}',
];

const babelOptions = {
  sourceType: 'module',
  plugins: [
    'jsx',
  ],
};

function collectFiles(patterns) {
  const files = new Set();
  patterns.forEach(p => glob.sync(p, { nodir: true }).forEach(f => files.add(f)));
  return Array.from(files).filter(f => !f.includes('node_modules'));
}

function analyzeFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  let ast;
  try {
    ast = parse(code, babelOptions);
  } catch (e) {
    return { filePath, error: `Parse error: ${e.message}` };
  }

  const imports = []; // { node, source, specifiers: [{local, imported, kind}] }
  const referenced = new Set();

  traverse(ast, {
    ImportDeclaration(path) {
      const { node } = path;
      const specifiers = node.specifiers.map(s => ({
        local: s.local.name,
        imported: s.type === 'ImportSpecifier' ? s.imported.name : null,
        kind: s.type,
        node: s,
      }));
      imports.push({ node, source: node.source.value, specifiers, path });
    },
    Identifier(path) {
      // Skip import specifier definitions
      if (path.parent.type === 'ImportSpecifier' || path.parent.type === 'ImportDefaultSpecifier' || path.parent.type === 'ImportNamespaceSpecifier') return;
      // Skip property keys / object patterns where it's defining not using
      if (path.parent.type === 'ObjectProperty' && path.parent.key === path.node && !path.parent.computed) return;
      if (path.parent.type === 'ObjectMethod' && path.parent.key === path.node && !path.parent.computed) return;
      if (path.parent.type === 'MemberExpression' && path.parent.property === path.node && !path.parent.computed) return;
      referenced.add(path.node.name);
    },
    JSXIdentifier(path) {
      // JSX tags refer to components if capitalized
      const name = path.node.name;
      if (/^[A-Z]/.test(name)) referenced.add(name);
    }
  });

  const changes = [];
  let newCode = code;
  // Process imports in reverse order to keep indexes stable
  for (let i = imports.length - 1; i >= 0; i--) {
    const imp = imports[i];
    // Side-effect only import
    if (imp.specifiers.length === 0) continue;
    // Namespace import: keep unless never referenced at all
    if (imp.specifiers.some(s => s.kind === 'ImportNamespaceSpecifier')) {
      const ns = imp.specifiers.find(s => s.kind === 'ImportNamespaceSpecifier');
      if (ns && !referenced.has(ns.local)) {
        // Remove entire namespace import if unused
        const { start, end } = imp.node;
        newCode = newCode.slice(0, start) + newCode.slice(end);
        changes.push({ action: 'remove-import', target: `${imp.source} (namespace)` });
      }
      continue;
    }

    // Filter unused specifiers
    const unused = imp.specifiers.filter(s => !referenced.has(s.local));
    if (unused.length === 0) continue;

    if (unused.length === imp.specifiers.length) {
      // Remove whole import
      const { start, end } = imp.node;
      newCode = newCode.slice(0, start) + newCode.slice(end);
      changes.push({ action: 'remove-import', target: imp.source });
    } else {
      // Remove only unused specifiers by text surgery inside the import line
      // Re-parse line for safety
      const line = code.slice(imp.node.start, imp.node.end);
      let modified = line;
      unused.forEach(u => {
        // Match patterns like { X, Y } or default/ named combos
        const regex = new RegExp(`\\b${u.local}\\b\s*,?\s*`); // naive but workable
        modified = modified.replace(regex, '');
      });
      // Clean up dangling commas and braces spacing
      modified = modified.replace(/,\s*}/g, ' }').replace(/{\s*,/g, '{ ')
        .replace(/import\s+,{/, 'import {')
        .replace(/\{\s*}/, '');
      newCode = newCode.slice(0, imp.node.start) + modified + newCode.slice(imp.node.end);
      changes.push({ action: 'prune-specifiers', target: imp.source, removed: unused.map(u => u.local) });
    }
  }

  if (!write) {
    return { filePath, changes };
  }

  if (changes.length > 0) {
    fs.writeFileSync(filePath, newCode, 'utf8');
  }
  return { filePath, changes, written: changes.length > 0 };
}

const files = collectFiles(includeGlobs);
const results = files.map(analyzeFile);

if (reportJson) {
  console.log(JSON.stringify(results, null, 2));
} else {
  let totalRemoved = 0; let filesTouched = 0;
  results.forEach(r => {
    if (r.error) {
      console.warn(`Parse skipped: ${r.filePath} -> ${r.error}`);
      return;
    }
    if (r.changes.length) {
      filesTouched++; totalRemoved += r.changes.length;
      console.log(`${write ? '[WRITE]' : '[DRY]'} ${r.filePath}`);
      r.changes.forEach(c => {
        if (c.action === 'remove-import') console.log(`  - removed entire import: ${c.target}`);
        else console.log(`  - pruned from ${c.target}: ${c.removed.join(', ')}`);
      });
    }
  });
  console.log(`\nSummary: ${filesTouched} files with import cleanup, ${totalRemoved} change operations${write ? ' (applied)' : ''}.`);
}
