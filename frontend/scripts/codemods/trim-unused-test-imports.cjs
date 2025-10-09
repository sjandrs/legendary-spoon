#!/usr/bin/env node
/* CommonJS variant for project with "type": "module" */
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();

function findTestFiles(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules','coverage','dist'].includes(e.name)) continue;
      out.push(...findTestFiles(full));
    } else if (/\.test\.jsx?$/.test(e.name)) {
      out.push(full);
    }
  }
  return out;
}

function parseImport(line) {
  if (!line.startsWith('import')) return null;
  const fromMatch = line.match(/from\s+['"].+['"];?$/);
  if (!fromMatch) return null;
  const named = [];
  const defaultMatch = line.match(/^import\s+([A-Za-z_$][\w$]*)\s*(,|from)/);
  const defaultImport = defaultMatch ? defaultMatch[1] : null;
  const namedSection = line.match(/\{([^}]+)\}/);
  if (namedSection) {
    namedSection[1].split(',').forEach(part => {
      const seg = part.trim();
      if (!seg) return;
      const alias = seg.split(/\s+as\s+/i).pop().trim();
      named.push(alias);
    });
  }
  return { defaultImport, named, original: line };
}

function findUnused(spec, body) {
  const unused = [];
  if (spec.defaultImport && spec.defaultImport !== 'React') {
    const re = new RegExp(`\\b${spec.defaultImport}\\b`,'g');
    if (!re.test(body)) unused.push({ type:'default', name: spec.defaultImport });
  }
  for (const n of spec.named) {
    const re = new RegExp(`\\b${n}\\b`,'g');
    if (!re.test(body)) unused.push({ type:'named', name:n });
  }
  return unused;
}

function applyRemovals(spec, unused) {
  if (!unused.length) return spec.original;
  const unusedSet = new Set(unused.filter(u=>u.type==='named').map(u=>u.name));
  const removeDefault = unused.some(u=>u.type==='default');
  let line = spec.original;
  if (removeDefault) {
    line = line.replace(/import\s+[A-Za-z_$][\w$]*\s*(,\s*)?/,'import ');
  }
  if (unusedSet.size) {
    line = line.replace(/\{([^}]+)\}/,(m,inner)=>{
      const kept = inner.split(',').map(s=>s.trim()).filter(Boolean).filter(part=>{
        const alias = part.split(/\s+as\s+/i).pop().trim();
        return !unusedSet.has(alias);
      });
      return kept.length ? `{ ${kept.join(', ')} }` : '';
    });
  }
  line = line.replace(/\{\s*\}\s*,?\s*/,'');
  if (/^import\s+from/.test(line) || /^import\s*$/.test(line)) return '';
  return line;
}

function processFile(file, write=false) {
  const text = fs.readFileSync(file,'utf8');
  const lines = text.split(/\r?\n/);
  const body = lines.join('\n');
  const edits = [];
  const newLines = [...lines];
  lines.forEach((line,idx)=>{
    if (!line.startsWith('import')) return;
    const spec = parseImport(line);
    if (!spec) return;
    const unused = findUnused(spec, body);
    if (!unused.length) return;
    const updated = applyRemovals(spec, unused);
    if (updated !== line) {
      edits.push({ line: idx+1, original: line, updated, unused });
      newLines[idx] = updated;
    }
  });
  if (write && edits.length) {
    const finalText = newLines.filter(l=>l.trim()!=='').join('\n');
    fs.writeFileSync(file, finalText+'\n','utf8');
  }
  return { file, edits };
}

function main() {
  const write = process.argv.includes('--write');
  const testFiles = findTestFiles(path.join(ROOT,'src'));
  const results = testFiles.map(f=>processFile(f, write)).filter(r=>r.edits.length);
  console.log(JSON.stringify({ writeMode: write, filesTouched: results.length, symbolsRemoved: results.reduce((a,r)=>a+r.edits.reduce((s,e)=>s+e.unused.length,0),0), results }, null, 2));
}

main();
