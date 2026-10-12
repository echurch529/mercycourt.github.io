#!/usr/bin/env node
/**
 * Post-build SEO checker for _site/ output.
 *
 * Run after Eleventy: node seo-check.js
 * Strict mode (fail on errors): node seo-check.js --strict
 *
 * ERRORS (fail build in --strict): missing title, missing/multiple H1,
 *   linked image with empty or absent alt.
 * WARNINGS (always logged, never fail): title > 65 chars, description > 160 chars
 *   or missing, missing canonical, missing og:image, duplicate titles/descriptions.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const STRICT     = process.argv.includes('--strict');
const SITE_DIR   = path.join(__dirname, '_site');
const TITLE_MAX  = 65;
const DESC_MAX   = 160;

// Pages excluded from all checks
const EXCLUDE = ['404.html', '410.html'];

// ── Helpers ─────────────────────────────────────────────────────────────────

function walkHtml(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'admin') continue;
      results.push(...walkHtml(full));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

function strip(html) {
  // Remove <script>, <style>, <noscript> blocks so their content never matches
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, '');
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

function extractDescription(html) {
  const m = html.match(/<meta\s[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
         || html.match(/<meta\s[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  return m ? m[1] : null;
}

function countH1(html) {
  return (html.match(/<h1[\s>]/gi) || []).length;
}

function hasCanonical(html) {
  return /<link\s[^>]*rel=["']canonical["']/i.test(html);
}

function hasOgImage(html) {
  return /<meta\s[^>]*property=["']og:image["']/i.test(html);
}

/**
 * Find <a> tags that enclose an <img> with empty or missing alt.
 * Returns array of {src, alt} for each offending image.
 */
function linkedImagesWithoutAlt(html) {
  const clean = strip(html);
  const findings = [];
  // Match <a ...>...<img ...>...</a> spanning up to ~10 lines
  const aPattern = /<a\b[^>]*>([\s\S]{0,800}?)<\/a>/gi;
  let aMatch;
  while ((aMatch = aPattern.exec(clean)) !== null) {
    const inner = aMatch[1];
    const imgPattern = /<img\b([^>]*)>/gi;
    let imgMatch;
    while ((imgMatch = imgPattern.exec(inner)) !== null) {
      const attrs = imgMatch[1];
      const srcM  = attrs.match(/src=["']([^"']*)["']/i);
      const altM  = attrs.match(/alt=["']([^"']*)["']/i);
      const src   = srcM ? srcM[1] : '(no src)';
      // Missing alt attribute entirely, or alt=""
      if (!altM || altM[1].trim() === '') {
        findings.push({ src, alt: altM ? '""' : 'missing' });
      }
    }
  }
  return findings;
}

/**
 * Find <img> tags (outside links) with no alt attribute at all.
 * Does NOT flag alt="" (decorative images) or tracking pixels.
 */
function imgsWithoutAltAttr(html) {
  const clean = strip(html);
  // First remove <a>...</a> blocks so we only check un-linked images
  const noLinks = clean.replace(/<a\b[\s\S]*?<\/a>/gi, '');
  const findings = [];
  const imgPattern = /<img\b([^>]*)>/gi;
  let m;
  while ((m = imgPattern.exec(noLinks)) !== null) {
    const attrs = m[1];
    if (!/\balt=/i.test(attrs)) {
      const srcM = attrs.match(/src=["']([^"']*)["']/i);
      findings.push(srcM ? srcM[1] : '(no src)');
    }
  }
  return findings;
}

// ── Main ─────────────────────────────────────────────────────────────────────

if (!fs.existsSync(SITE_DIR)) {
  console.error('[seo-check] _site/ directory not found. Run eleventy first.');
  process.exit(1);
}

const files = walkHtml(SITE_DIR).filter(f => {
  const rel = path.relative(SITE_DIR, f);
  return !EXCLUDE.some(ex => rel === ex || rel.endsWith('/' + ex));
});

const errors   = [];
const warnings = [];
const seenTitles = {};
const seenDescs  = {};

for (const file of files) {
  const rel  = path.relative(SITE_DIR, file);
  const html = fs.readFileSync(file, 'utf8');

  const title = extractTitle(html);
  const desc  = extractDescription(html);
  const h1s   = countH1(html);

  // Title checks
  if (!title) {
    errors.push(`[${rel}] MISSING <title>`);
  } else {
    if (title.length > TITLE_MAX) {
      warnings.push(`[${rel}] Title too long: ${title.length} chars (max ${TITLE_MAX}) — "${title.slice(0, 70)}…"`);
    }
    const key = title.toLowerCase();
    if (seenTitles[key]) {
      warnings.push(`[${rel}] Duplicate title: "${title}" (also on ${seenTitles[key]})`);
    } else {
      seenTitles[key] = rel;
    }
  }

  // Description checks
  if (!desc) {
    warnings.push(`[${rel}] MISSING meta description`);
  } else {
    if (desc.length > DESC_MAX) {
      warnings.push(`[${rel}] Description too long: ${desc.length} chars (max ${DESC_MAX})`);
    }
    const key = desc.toLowerCase();
    if (seenDescs[key]) {
      warnings.push(`[${rel}] Duplicate description (also on ${seenDescs[key]})`);
    } else {
      seenDescs[key] = rel;
    }
  }

  // H1 checks
  if (h1s === 0) {
    errors.push(`[${rel}] MISSING <h1>`);
  } else if (h1s > 1) {
    errors.push(`[${rel}] MULTIPLE <h1> (found ${h1s})`);
  }

  // Linked images without alt
  const linked = linkedImagesWithoutAlt(html);
  for (const img of linked) {
    errors.push(`[${rel}] Linked <img> with ${img.alt} alt: ${img.src}`);
  }

  // Images without any alt attribute
  const noAlt = imgsWithoutAltAttr(html);
  for (const src of noAlt) {
    warnings.push(`[${rel}] <img> missing alt attribute: ${src}`);
  }

  // Canonical
  if (!hasCanonical(html)) {
    warnings.push(`[${rel}] MISSING canonical link`);
  }

  // OG image
  if (!hasOgImage(html)) {
    warnings.push(`[${rel}] MISSING og:image`);
  }
}

// ── Report ───────────────────────────────────────────────────────────────────

const totalIssues = errors.length + warnings.length;

console.log('\n══════════════════════════════════════════');
console.log('  SEO CHECK — ' + files.length + ' pages scanned');
console.log('══════════════════════════════════════════');

if (warnings.length) {
  console.log('\n⚠  WARNINGS (' + warnings.length + '):\n');
  warnings.forEach(w => console.log('  ' + w));
}

if (errors.length) {
  console.log('\n✖  ERRORS (' + errors.length + '):\n');
  errors.forEach(e => console.log('  ' + e));
}

if (totalIssues === 0) {
  console.log('\n✔  All SEO checks passed.\n');
} else {
  console.log('\n  ' + errors.length + ' error(s), ' + warnings.length + ' warning(s)\n');
}

if (STRICT && errors.length > 0) {
  console.error('[seo-check] Build failed: fix the errors above.');
  process.exit(1);
}
