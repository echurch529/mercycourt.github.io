'use strict';
const { execSync } = require('child_process');

module.exports = function () {
  const map = {};
  try {
    // One pass: get last-commit ISO date for every tracked file.
    // git log outputs a date line, blank line, then file names, then blank, repeat.
    // --diff-filter=AM captures Added and Modified commits; first hit per file = most recent.
    const out = execSync('git log --name-only --format=%aI --diff-filter=AM', {
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let date = null;
    for (const raw of out.split('\n')) {
      const line = raw.trim();
      if (!line) { date = null; continue; }
      if (/^\d{4}-\d{2}-\d{2}T/.test(line)) {
        date = line;
      } else if (date && !map[line]) {
        map[line] = date; // first occurrence = most recent commit for this file
      }
    }
  } catch {
    // git unavailable in this environment — callers fall back to buildDate
  }
  return map;
};
