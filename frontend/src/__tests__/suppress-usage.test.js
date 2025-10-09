const fs = require('fs');
const path = require('path');

// This test enforces that any use of suppressConsoleErrors in tests must
// include the marker comment SUPPRESS_CONSOLE_ERRORS_OK on the same line.
// This prevents accidental/global silencing of console.error in tests.

const TEST_DIR = path.resolve(__dirname, '..');

function walk(dir) {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full));
    } else if (/\.test\.(js|jsx|ts|tsx)$/.test(name)) {
      // Skip this enforcement file itself to avoid self-detection
      if (name === 'suppress-usage.test.js') continue;
      files.push(full);
    }
  }
  return files;
}

test('suppressConsoleErrors usage must include guard comment', () => {
  const files = walk(TEST_DIR);
  const offenders = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('suppressConsoleErrors(')) {
        if (!line.includes('SUPPRESS_CONSOLE_ERRORS_OK')) {
          offenders.push(`${path.relative(TEST_DIR, file)}:${i + 1}`);
        }
      }
    }
  }

  if (offenders.length) {
    throw new Error(
      `Found suppressConsoleErrors usage without marker comment:\n${offenders.join('\n')}`
    );
  }
});
