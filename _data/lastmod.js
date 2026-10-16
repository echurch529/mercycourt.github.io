'use strict';
const { execSync } = require('child_process');

module.exports = function () {
  const map = {};
  try {
    // One git log pass: get the most-recent commit ISO date for every tracked file.
    // Output format per commit: one date line, a blank line, N file-path lines, blank line, repeat.
    // Bug fix: skip blank lines without resetting `date` — the blank line between the date
    // and file names would otherwise clear `date` before any file gets recorded.
    const out = execSync('git log --name-only --format=%aI --diff-filter=AM', {
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let date = null;
    for (const raw of out.split('\n')) {
      const line = raw.trim();
      if (!line) continue; // skip blank lines, preserve current date
      if (/^\d{4}-\d{2}-\d{2}T/.test(line)) {
        date = line;
      } else if (date && !map[line]) {
        map[line] = date; // first occurrence = most recent commit for this file
      }
    }
  } catch {
    // git unavailable — map stays empty; callers omit <lastmod> or use a content-level fallback
  }
  return map;
};
