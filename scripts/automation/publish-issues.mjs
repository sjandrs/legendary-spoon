#!/usr/bin/env node
/**
 * Bulk GitHub Issue Publisher
 * Reads markdown files in issues/ and creates issues via REST API.
 * Features:
 *  - Dry run mode (default) unless PUBLISH=1
 *  - Idempotency via issue title existence check (search open & closed)
 *  - YAML front-matter (---) parsing: title, labels (array or comma), supersedes (array of issue numbers or titles)
 *  - Fallback label extraction from first **Labels:** line (comma-separated)
 *  - Skips META epic unless INCLUDE_META=1
 *  - Optional prefix filter ISSUE_PREFIX to limit which files publish
 *  - Updates ISSUES_TRACKING_BATCH.md index table with created numbers
 *  - Optional automatic closing of superseded issues with comment (CLOSE_SUPERSEDED=1)
 *  - Validation-only mode (VALIDATE=1) to lint front-matter without hitting GitHub
 *  - Persistent disk cache for search/existence (opt-out: DISABLE_CACHE=1, clear: CLEAR_CACHE=1)
 *  - Validation failure policy via VALIDATION_FAIL_ON=errors (exit code 2 if any validation errors)
 *
 * Required Env:
 *  - GITHUB_REPOSITORY ("owner/repo") OR GITHUB_OWNER + GITHUB_REPO
 *  - GITHUB_TOKEN (repo scope) - in Actions provided automatically
 * Optional Env:
 *  - PUBLISH=1 to actually create issues
 *  - INCLUDE_META=1 to include META-* file
 *  - ISSUE_PREFIX to only publish files whose basename starts with prefix
 *  - ASSIGNEES comma-separated GitHub logins
 *  - CLOSE_SUPERSEDED=1 to close superseded issues listed in front-matter `supersedes`
 *  - VALIDATE=1 run schema validation only (no network calls)
 *  - VALIDATION_FAIL_ON=errors exit code 2 if any validation errors
 *  - CACHE_TTL_MIN=minutes override cache freshness window (default 60)
 *  - DISABLE_CACHE=1 disable persistent cache
 *  - CLEAR_CACHE=1 clear cache before run
 *  - CACHE_COMPRESS=1 store cache gzipped (.json.gz)
 *  - PER_ISSUE_METADATA=1 add HTML comment with source metadata after creation
 */
import fs from 'fs';
import path from 'path';
import process from 'process';
import fetch from 'node-fetch';
import zlib from 'zlib';
import crypto from 'crypto';

const issuesDir = path.resolve(process.cwd(), 'issues');
if (!fs.existsSync(issuesDir)) {
  console.error('issues directory not found:', issuesDir);
  process.exit(1);
}

const repo = process.env.GITHUB_REPOSITORY || `${process.env.GITHUB_OWNER || ''}/${process.env.GITHUB_REPO || ''}`;
if (!repo || !repo.includes('/')) {
  console.error('GITHUB_REPOSITORY or (GITHUB_OWNER + GITHUB_REPO) must be set.');
  process.exit(1);
}
const [owner, repoName] = repo.split('/');
const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error('GITHUB_TOKEN not set (will still allow dry-run scanning).');
}

const dryRun = process.env.PUBLISH !== '1';
const includeMeta = process.env.INCLUDE_META === '1';
const prefix = process.env.ISSUE_PREFIX || '';
const assignees = (process.env.ASSIGNEES || '').split(',').map(s => s.trim()).filter(Boolean);
const closeSuperseded = process.env.CLOSE_SUPERSEDED === '1';
const validateOnly = process.env.VALIDATE === '1';
const disableCache = process.env.DISABLE_CACHE === '1';
const clearCache = process.env.CLEAR_CACHE === '1';
const cacheTtlMin = parseInt(process.env.CACHE_TTL_MIN || '60', 10); // default 60 minutes
const validationFailOn = (process.env.VALIDATION_FAIL_ON || '').toLowerCase(); // 'errors' supported
const perIssueMetadata = process.env.PER_ISSUE_METADATA === '1';
const legacyAutomationMode = process.env.LEGACY_AUTOMATION_MODE === '1';

// Cache paths
const cacheDir = path.resolve(process.cwd(), '.cache');
const cacheFile = path.join(cacheDir, 'issue-search-cache.json');
const cacheFileGz = path.join(cacheDir, 'issue-search-cache.json.gz');
const cacheCompress = legacyAutomationMode ? false : (process.env.CACHE_COMPRESS === '1');
let persistentCache = { meta: { version: 1, generated: new Date().toISOString(), ttlMinutes: cacheTtlMin }, searches: {}, exists: {} };

function loadCache() {
  if (disableCache) return;
  try {
    if (clearCache) {
      if (fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile);
      if (fs.existsSync(cacheFileGz)) fs.unlinkSync(cacheFileGz);
    }
    if (cacheCompress && fs.existsSync(cacheFileGz)) {
      const buf = fs.readFileSync(cacheFileGz);
      const json = zlib.gunzipSync(buf).toString('utf8');
      persistentCache = JSON.parse(json);
    } else if (fs.existsSync(cacheFile)) {
      const raw = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      persistentCache = raw;
    } else if (!cacheCompress && fs.existsSync(cacheFileGz)) {
      // Fallback: read compressed if compression newly disabled
      const buf = fs.readFileSync(cacheFileGz);
      const json = zlib.gunzipSync(buf).toString('utf8');
      persistentCache = JSON.parse(json);
    }
  } catch (e) {
    console.warn('Cache load failed, starting fresh:', e.message);
  }
}

function saveCache() {
  if (disableCache) return;
  try {
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    const json = JSON.stringify(persistentCache, null, 2);
    if (cacheCompress) {
      const gz = zlib.gzipSync(Buffer.from(json, 'utf8'));
      fs.writeFileSync(cacheFileGz, gz);
      // Optionally remove old uncompressed file to save space
      if (fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile);
    } else {
      fs.writeFileSync(cacheFile, json);
      // Optionally remove compressed if switching off
      if (fs.existsSync(cacheFileGz)) fs.unlinkSync(cacheFileGz);
    }
  } catch (e) {
    console.warn('Cache save failed:', e.message);
  }
}

function isStale(tsIso) {
  const ts = new Date(tsIso).getTime();
  const ageMin = (Date.now() - ts) / 60000;
  return ageMin > cacheTtlMin;
}

loadCache();

// Simple sleep util for polite rate spacing
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function githubRequest(url, opts = {}) {
  if (validateOnly) throw new Error('GitHub request attempted during VALIDATE mode');
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'bulk-issue-publisher',
      ...(opts.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

async function issueExists(title) {
  if (validateOnly) return false;
  if (!token) return false; // can't check without auth
  const key = title.toLowerCase();
  if (!disableCache && persistentCache.exists[key] && !isStale(persistentCache.exists[key].ts)) {
    return persistentCache.exists[key].value;
  }
  const q = encodeURIComponent(`repo:${owner}/${repoName} in:title "${title}"`);
  const url = `https://api.github.com/search/issues?q=${q}`;
  const data = await githubRequest(url);
  const value = data.items && data.items.some(i => i.title.toLowerCase() === title.toLowerCase());
  if (!disableCache) {
    persistentCache.exists[key] = { value, ts: new Date().toISOString() };
  }
  return value;
}

function parseLegacyLabels(content) {
  const match = content.match(/\*\*Labels:\*\*([^\n]+)/i);
  if (!match) return [];
  return match[1]
    .split(/[,|]/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(l => l.replace(/^#+/, ''));
}

function parseFrontMatter(raw) {
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return { front: {}, body: raw };
  const yaml = fmMatch[1];
  const front = {};
  yaml.split(/\n/).forEach(line => {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!m) return;
    const key = m[1].trim();
    let val = m[2].trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      // simple array parsing
      val = val.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    } else if (val.includes(',')) {
      // comma separated list
      val = val.split(',').map(s => s.trim()).filter(Boolean);
    }
    front[key] = val;
  });
  const body = raw.slice(fmMatch[0].length).trim();
  return { front, body };
}

function deriveTitle(fileName, content, front) {
  if (front.title) return Array.isArray(front.title) ? front.title.join(' ') : front.title;
  // Use first markdown H1 if present, else file stem
  const heading = content.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim();
  return fileName.replace(/[-_]/g, ' ').replace(/\.md$/i, '').trim();
}

function buildBody(content) {
  // Remove front-matter if present then strip first H1
  let body = content.replace(/^---[\s\S]*?---\n/, '');
  body = body.replace(/^#\s+.*$/m, '').trim();
  return body;
}

async function closeIssue(number, reason, newNumber) {
  if (!token) return;
  try {
    await githubRequest(`https://api.github.com/repos/${owner}/${repoName}/issues/${number}`, {
      method: 'PATCH',
      body: JSON.stringify({ state: 'closed' })
    });
    await githubRequest(`https://api.github.com/repos/${owner}/${repoName}/issues/${number}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body: reason + (newNumber ? ` Superseded by #${newNumber}.` : '') })
    });
    console.log(`Closed superseded issue #${number}`);
  } catch (e) {
    console.warn(`Failed to close superseded issue #${number}: ${e.message}`);
  }
}

async function findIssueByTitle(title) {
  if (validateOnly) return null;
  const key = title.toLowerCase();
  if (!disableCache && persistentCache.searches[key] && !isStale(persistentCache.searches[key].ts)) {
    return persistentCache.searches[key].value;
  }
  const q = encodeURIComponent(`repo:${owner}/${repoName} in:title "${title}"`);
  const url = `https://api.github.com/search/issues?q=${q}`;
  const data = await githubRequest(url);
  const value = data.items && data.items.find(i => i.title.toLowerCase() === title.toLowerCase()) || null;
  if (!disableCache) {
    persistentCache.searches[key] = { value, ts: new Date().toISOString() };
  }
  return value;
}

// Simple in-process cache for title searches to reduce API calls
const searchCache = new Map();
async function cachedFindIssueByTitle(title) {
  const key = title.toLowerCase();
  if (searchCache.has(key)) return searchCache.get(key);
  const res = await findIssueByTitle(title);
  searchCache.set(key, res);
  return res;
}

function validateFrontMatter(file, front) {
  const errors = [];
  const warn = [];
  const allowedKeys = new Set(['title','labels','supersedes']);
  Object.keys(front).forEach(k => {
    if (!allowedKeys.has(k)) warn.push(`Unknown key '${k}'`);
  });
  if (front.labels && !Array.isArray(front.labels) && typeof front.labels !== 'string') {
    errors.push('labels must be array or comma-separated string');
  }
  if (front.supersedes && !Array.isArray(front.supersedes) && typeof front.supersedes !== 'string') {
    errors.push('supersedes must be array or comma-separated string');
  }
  // Basic title sanity
  if (front.title && String(front.title).trim().length === 0) {
    errors.push('title cannot be empty');
  }
  return { errors, warn };
}

async function main() {
  const files = fs.readdirSync(issuesDir)
    .filter(f => f.endsWith('.md'))
    .filter(f => includeMeta ? true : !f.toLowerCase().startsWith('meta-'))
    .filter(f => prefix ? f.startsWith(prefix) : true)
    .sort();

  if (files.length === 0) {
    console.log('No issue files matched criteria.');
    return;
  }

  console.log(`Scanning ${files.length} issue file(s). Dry run: ${dryRun} Validate: ${validateOnly}`);
  const report = [];

  // Load index file path for later update
  const indexPath = path.resolve(process.cwd(), 'ISSUES_TRACKING_BATCH.md');
  let indexContent = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
  const createdMap = {};

  for (const file of files) {
    const full = path.join(issuesDir, file);
    const content = fs.readFileSync(full, 'utf8');
    const { front, body: bodyRaw } = parseFrontMatter(content);
    const title = deriveTitle(file, content, front);
    let labels = [];
    if (front.labels) {
      labels = Array.isArray(front.labels) ? front.labels : [front.labels];
    } else {
      labels = parseLegacyLabels(content);
    }
    const body = buildBody(content);
    const supersedes = Array.isArray(front.supersedes) ? front.supersedes : (front.supersedes ? [front.supersedes] : []);

    // Validation mode: perform schema linting only
    if (validateOnly) {
      const { errors, warn } = validateFrontMatter(file, front);
      if (errors.length || warn.length) {
        report.push({ file, title, action: 'validate', errors, warnings: warn });
        console.log(`VALIDATE ${file}: ${errors.length} error(s), ${warn.length} warning(s)`);
      } else {
        report.push({ file, title, action: 'validate', status: 'ok' });
      }
      continue;
    }

    let already = false;
    try {
      already = await issueExists(title);
    } catch (e) {
      console.warn(`Warning: search failed for '${title}': ${e.message}`);
    }
    if (already) {
      console.log(`SKIP (exists): ${title}`);
      report.push({ file, title, action: 'skip-exists' });
      continue;
    }

    if (dryRun || !token) {
      console.log(`DRY-RUN create: ${title} [labels: ${labels.join(', ')}] supersedes: ${supersedes.join(', ')}`);
      report.push({ file, title, action: 'dry-run', supersedes });
      continue;
    }

    try {
      const created = await githubRequest(`https://api.github.com/repos/${owner}/${repoName}/issues`, {
        method: 'POST',
        body: JSON.stringify({ title, body, labels, assignees })
      });
      console.log(`CREATED #${created.number}: ${title}`);
      createdMap[file] = created.number;
      report.push({ file, title, action: 'created', number: created.number });
      // Optional metadata footer comment for traceability
      if (perIssueMetadata) {
        try {
          const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
          const meta = [
            '<!-- automation:issue-metadata',
            `source-file:${file}`,
            `sha256:${hash}`,
            `generated:${new Date().toISOString()}`,
            'schema:1',
            '-->'
          ].join('\n');
          await githubRequest(`https://api.github.com/repos/${owner}/${repoName}/issues/${created.number}/comments`, {
            method: 'POST',
            body: JSON.stringify({ body: meta })
          });
          await sleep(200);
        } catch (metaErr) {
          console.warn(`Metadata comment failed for #${created.number}: ${metaErr.message}`);
        }
      }
      // Supersede logic
      if (closeSuperseded && supersedes.length) {
        for (const ref of supersedes) {
          let issueNum = null;
            if (/^\d+$/.test(ref)) {
              issueNum = parseInt(ref, 10);
            } else {
              // try find by title
              try {
                const found = await cachedFindIssueByTitle(ref);
                if (found) issueNum = found.number;
              } catch (e) {
                console.warn(`Lookup failed for superseded ref '${ref}': ${e.message}`);
              }
            }
          if (issueNum) {
            await closeIssue(issueNum, 'Closed as superseded by automated publish script.', created.number);
            await sleep(400);
          }
        }
      }
      await sleep(750); // gentle pacing
    } catch (e) {
      console.error(`ERROR creating '${title}': ${e.message}`);
      report.push({ file, title, action: 'error', error: e.message });
    }
  }

  const summaryPath = path.join(issuesDir, 'publish-report.json');
  fs.writeFileSync(summaryPath, JSON.stringify(report, null, 2));
  console.log('Report written:', summaryPath);
  saveCache();

  // In validation mode, enforce failure policy after report generation
  if (validateOnly) {
    const errorCount = report.reduce((acc, r) => acc + (r.errors ? r.errors.length : 0), 0);
    const warningCount = report.reduce((acc, r) => acc + (r.warnings ? r.warnings.length : 0), 0);
    console.log(`Validation summary: ${errorCount} error(s), ${warningCount} warning(s).`);
    if (!legacyAutomationMode && validationFailOn === 'errors' && errorCount > 0) {
      console.error('Validation failed: errors detected (exiting with code 2).');
      process.exit(2);
    }
    // Successful validation path
    return;
  }

  // Update index table with created issue numbers if present
  if (Object.keys(createdMap).length && indexContent.includes('| ID | Title | File |')) {
    const lines = indexContent.split(/\r?\n/).map(l => {
      const m = l.match(/\|\s*(\d+|META)\s*\|/);
      if (!m) return l;
      // Extract file name from line (last markdown link path)
      const linkMatch = l.match(/\[(.+?)\]\((issues\/.+?)\)/g);
      if (!linkMatch) return l;
      // Use first link with (issues/...) to identify file
      const fileLink = linkMatch[0].match(/\((issues\/.+?)\)/)[1];
      const baseFile = path.basename(fileLink);
      const createdNum = createdMap[baseFile];
      if (!createdNum) return l;
      if (l.includes(`#${createdNum}`)) return l; // already annotated
      // Append issue number at end of title cell if not present
      return l.replace(/\|\s*(\d+|META)\s*\|\s*([^|]+)\|/, (all, id, titleCell) => {
        const annotated = titleCell.includes('#') ? titleCell : `${titleCell.trim()} (#${createdNum})`;
        return all.replace(titleCell, annotated);
      });
    });
    const updated = lines.join('\n');
    if (!dryRun) {
      fs.writeFileSync(indexPath, updated);
      console.log('Index updated with issue numbers.');
    } else {
      console.log('Dry-run: index not modified. (Would annotate issue numbers)');
    }
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
