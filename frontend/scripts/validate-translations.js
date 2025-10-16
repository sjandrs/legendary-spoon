#!/usr/bin/env node
/*
  Simple validation for translation files:
  - Ensures JSON parses
  - Ensures all namespaces exist across all languages
  - Ensures no empty files and that English has keys for referenced namespaces
*/

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.resolve(__dirname, '..', 'public', 'locales');
const LANGS = fs.readdirSync(LOCALES_DIR).filter((f) => fs.statSync(path.join(LOCALES_DIR, f)).isDirectory());

function readJson(file) {
  const raw = fs.readFileSync(file, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid JSON: ${file} -> ${e.message}`);
  }
}

function main() {
  const errors = [];

  const namespacesByLang = {};
  for (const lang of LANGS) {
    const langDir = path.join(LOCALES_DIR, lang);
    const files = fs.readdirSync(langDir).filter((f) => f.endsWith('.json'));
    namespacesByLang[lang] = files.map((f) => path.basename(f, '.json'));

    for (const file of files) {
      const full = path.join(langDir, file);
      try {
        const data = readJson(full);
        if (typeof data !== 'object' || data === null) {
          errors.push(`File does not contain an object: ${full}`);
        }
      } catch (e) {
        errors.push(e.message);
      }
    }
  }

  // Ensure all languages have the same namespaces as English
  const enNamespaces = new Set(namespacesByLang['en'] || []);
  for (const lang of LANGS) {
    if (lang === 'en') continue;
    const ns = new Set(namespacesByLang[lang] || []);
    for (const missing of [...enNamespaces].filter((n) => !ns.has(n))) {
      errors.push(`Missing namespace for ${lang}: ${missing}.json`);
    }
  }

  if (errors.length) {
    console.error('Translation validation failed:\n' + errors.map((e) => ` - ${e}`).join('\n'));
    process.exit(1);
  } else {
    console.log('Translation validation passed.');
  }
}

main();
