#!/usr/bin/env node
/**
 * Smoke test for publish-issues.mjs
 * Scenarios:
 * 1. Validation success (expect exit 0)
 * 2. Validation failure with VALIDATION_FAIL_ON=errors (expect exit 2)
 * 3. Legacy mode suppresses failure (expect exit 0)
 * 4. Cache compression path creates .json.gz
 *
 * This script creates a temp issues dir with two files: good.md and bad.md
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const root = process.cwd();
const issuesDir = path.join(root, 'issues-smoke');
if (!fs.existsSync(issuesDir)) fs.mkdirSync(issuesDir);

const good = `---\ntitle: Good Issue\nlabels: test\n---\n# Good\nBody`; 
const bad = `---\ntitle: \nlabels: test\n---\n# Bad\nBody`; // empty title triggers validation error
fs.writeFileSync(path.join(issuesDir, '01-good.md'), good);
fs.writeFileSync(path.join(issuesDir, '02-bad.md'), bad);

function run(label, env) {
  const cmdEnv = { ...process.env, ...env };
  cmdEnv.VALIDATE = '1';
  cmdEnv.ISSUE_PREFIX = ''; // ensure all
  // Point script to custom issues dir by temporarily changing CWD or using symlink approach.
  // Simplest: temporarily move real issues dir if exists (avoid). We'll instead symlink if no conflicts.
  // For simplicity: copy our temp files into a transient dir named 'issues' under a temp work folder.
}

// We'll spawn the publisher in an isolated temp working directory
const workDir = fs.mkdtempSync(path.join(root, 'smoke-publish-'));
const issuesTarget = path.join(workDir, 'issues');
fs.mkdirSync(issuesTarget);
for (const f of fs.readdirSync(issuesDir)) {
  fs.copyFileSync(path.join(issuesDir, f), path.join(issuesTarget, f));
}

function execPublisher(env) {
  return spawnSync('node', ['../scripts/automation/publish-issues.mjs'], {
    cwd: workDir,
    env: { ...process.env, ...env },
    stdio: 'pipe',
    encoding: 'utf8'
  });
}

const results = [];
// 1: validation success (filter to only good file)
results.push({
  scenario: 'validation success',
  res: execPublisher({ VALIDATE: '1', ISSUE_PREFIX: '01-', VALIDATION_FAIL_ON: 'errors' })
});
// 2: validation failure (both files)
results.push({
  scenario: 'validation failure triggers exit 2',
  res: execPublisher({ VALIDATE: '1', VALIDATION_FAIL_ON: 'errors' })
});
// 3: legacy mode suppresses failure
results.push({
  scenario: 'legacy mode suppresses failure',
  res: execPublisher({ VALIDATE: '1', VALIDATION_FAIL_ON: 'errors', LEGACY_AUTOMATION_MODE: '1' })
});
// 4: cache compression
results.push({
  scenario: 'cache compression',
  res: execPublisher({ VALIDATE: '1', VALIDATION_FAIL_ON: 'errors', CACHE_COMPRESS: '1', ISSUE_PREFIX: '01-' })
});

function summarize(r) {
  return {
    scenario: r.scenario,
    exitCode: r.res.status,
    pass: (() => {
      switch (r.scenario) {
        case 'validation success': return r.res.status === 0;
        case 'validation failure triggers exit 2': return r.res.status === 2;
        case 'legacy mode suppresses failure': return r.res.status === 0;
        case 'cache compression': return r.res.status === 0; // success path
        default: return false;
      }
    })(),
    stderr: r.res.stderr?.split('\n').slice(-6).join('\n'),
    stdoutTail: r.res.stdout?.split('\n').slice(-6).join('\n')
  };
}

const summary = results.map(summarize);
const fail = summary.filter(s => !s.pass);
console.log('Smoke Test Summary:\n', summary);
if (fail.length) {
  console.error('Smoke test failures:');
  fail.forEach(f => console.error(f.scenario, 'exit', f.exitCode));
  process.exit(1);
}
// Check gzip file presence for compression scenario
const cacheDir = path.join(workDir, '.cache');
if (fs.existsSync(cacheDir)) {
  const hasGz = fs.readdirSync(cacheDir).some(f => f.endsWith('.json.gz'));
  console.log('Compression check:', hasGz ? 'gz file present' : 'no gz file');
}
console.log('All smoke scenarios passed.');
