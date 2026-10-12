#!/usr/bin/env node
/**
 * Post-build SEO checker for _site/ output.
 *
 * Run after Eleventy: node seo-check.js
 * Strict mode (fail build on errors): node seo-check.js --strict
 *
 * ERRORS (fail build in --strict): missing title, missing/multiple H1,
 *   linked image with empty or absent alt.
 * WARNINGS (always logged, never fail build): title > 65 chars, description > 160
 *   chars or missing, missing canonical, missing og:image, duplicate titles/descs.
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

// ── URL helpers ──────────────────────────────────────────────────────────────

/** Convert a _site-relative file path to the canonical URL path. */
function toUrl(relPath) {
  let u = '/' + relPath.replace(/\\/g, '/');
  if (u.endsWith('/index.html')) u = u.slice(0, -10) || '/';
  else if (u.endsWith('.html')) u = u.slice(0, -5);
  if (u !== '/' && !u.endsWith('/')) u += '/';
  return u;
}

/**
 * Return a CMS navigation hint for a given URL and issue type.
 * issueType: 'title' | 'description' | 'linked-alt' | 'img-alt' | 'h1'
 */
function cmsHint(url, issueType) {
  const page = url.replace(/^\/|\/$/g, '') || 'home';

  if (issueType === 'linked-alt') {
    if (url === '/events/' || url === '/events') {
      return 'CMS → Event Pages → open the matching event → fill "Card Image Alt Text"';
    }
    return `CMS → inspect linked images on ${url}`;
  }

  if (issueType === 'img-alt') {
    return `CMS → check all images on ${url} have descriptive alt text`;
  }

  // Map URL to CMS collection + field labels
  const titleField = 'SEO Title';
  const descField  = 'SEO Description';

  if (url === '/' || url === '/index') {
    return issueType === 'title'
      ? 'CMS → Home Page → "SEO Title" field'
      : 'CMS → Home Page → "SEO Description" field';
  }
  if (url.startsWith('/sunday-services')) {
    return issueType === 'title'
      ? 'CMS → Sunday Services → "SEO Title" field'
      : 'CMS → Sunday Services → "SEO Description" field';
  }
  if (url.startsWith('/events/')) {
    const slug = url.replace(/^\/events\//, '').replace(/\/$/, '');
    if (slug && slug !== '') {
      return issueType === 'title'
        ? `CMS → Event Pages → "${slug}" → "Page Title" field`
        : `CMS → Event Pages → "${slug}" → "SEO Description" field`;
    }
    return issueType === 'title'
      ? 'CMS → Events Hub → title field'
      : 'CMS → Events Hub → "SEO Description" field';
  }
  if (url.startsWith('/blog-posts/')) {
    const slug = url.replace(/^\/blog-posts\//, '').replace(/\/$/, '');
    return issueType === 'title'
      ? `CMS → Blog Posts → "${slug}" → "SEO Title" field`
      : `CMS → Blog Posts → "${slug}" → "SEO Description" field`;
  }

  // Main pages — map slug to collection label
  const MAIN_PAGES = {
    'about-us': 'About Us', 'plan-your-visit': 'Plan Your Visit',
    'contact': 'Contact', 'give': 'Give', 'watch-live': 'Watch Live',
    'community-impact': 'Community Impact', 'ministries': 'Ministries',
    'tehillah-voices': 'Tehillah Voices', 'mercy-kidz': 'Mercy Kidz',
    'blog': 'Blog',
  };
  const label = MAIN_PAGES[page] || page;
  return issueType === 'title'
    ? `CMS → Main Pages → "${label}" → "${titleField}" field`
    : `CMS → Main Pages → "${label}" → "${descField}" field`;
}

// ── HTML helpers ─────────────────────────────────────────────────────────────

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

function linkedImagesWithoutAlt(html) {
  const clean = strip(html);
  const findings = [];
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
      if (!altM || altM[1].trim() === '') {
        findings.push({ src, alt: altM ? '""' : 'missing' });
      }
    }
  }
  return findings;
}

function imgsWithoutAltAttr(html) {
  const clean = strip(html);
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
  const url  = toUrl(rel);
  const html = fs.readFileSync(file, 'utf8');

  const title = extractTitle(html);
  const desc  = extractDescription(html);
  const h1s   = countH1(html);

  // Title checks
  if (!title) {
    errors.push(
      `${url} — MISSING <title>\n` +
      `  Fix: ${cmsHint(url, 'title')}`
    );
  } else {
    if (title.length > TITLE_MAX) {
      warnings.push(
        `${url} — Title too long: ${title.length} chars (max ${TITLE_MAX}, target 50–60)\n` +
        `  Title: "${title}"\n` +
        `  Fix:   ${cmsHint(url, 'title')} → shorten to under ${TITLE_MAX} chars`
      );
    }
    const key = title.toLowerCase();
    if (seenTitles[key]) {
      warnings.push(
        `${url} — Duplicate title (also on ${seenTitles[key]})\n` +
        `  Title: "${title}"\n` +
        `  Fix:   ${cmsHint(url, 'title')} → make it unique`
      );
    } else {
      seenTitles[key] = url;
    }
  }

  // Description checks
  if (!desc) {
    warnings.push(
      `${url} — MISSING meta description\n` +
      `  Fix: ${cmsHint(url, 'description')} → add 120–155 chars`
    );
  } else {
    if (desc.length > DESC_MAX) {
      warnings.push(
        `${url} — Description too long: ${desc.length} chars (max ${DESC_MAX}, target 120–155)\n` +
        `  Fix: ${cmsHint(url, 'description')} → shorten to under ${DESC_MAX} chars`
      );
    }
    const key = desc.toLowerCase();
    if (seenDescs[key]) {
      warnings.push(
        `${url} — Duplicate description (also on ${seenDescs[key]})\n` +
        `  Fix: ${cmsHint(url, 'description')} → make it unique`
      );
    } else {
      seenDescs[key] = url;
    }
  }

  // H1 checks
  if (h1s === 0) {
    errors.push(
      `${url} — MISSING <h1> heading\n` +
      `  Fix: check the page layout template for a missing or conditional <h1>`
    );
  } else if (h1s > 1) {
    errors.push(
      `${url} — MULTIPLE <h1> headings (found ${h1s}; must be exactly 1)\n` +
      `  Fix: change extra <h1> tags to <h2> in the page or layout template`
    );
  }

  // Linked images without alt
  const linked = linkedImagesWithoutAlt(html);
  for (const img of linked) {
    errors.push(
      `${url} — Linked image has ${img.alt} alt text: ${img.src}\n` +
      `  Fix: ${cmsHint(url, 'linked-alt')}`
    );
  }

  // Images without any alt attribute
  const noAlt = imgsWithoutAltAttr(html);
  for (const src of noAlt) {
    warnings.push(
      `${url} — <img> missing alt attribute: ${src}\n` +
      `  Fix: ${cmsHint(url, 'img-alt')}`
    );
  }

  // Canonical
  if (!hasCanonical(html)) {
    warnings.push(
      `${url} — MISSING canonical <link>\n` +
      `  Fix: add <link rel="canonical" href="https://mercycourt.org${url}"> to the page <head>`
    );
  }

  // OG image
  if (!hasOgImage(html)) {
    warnings.push(
      `${url} — MISSING og:image meta tag\n` +
      `  Fix: add <meta property="og:image" content="..."> to the page <head>`
    );
  }
}

// ── Report ───────────────────────────────────────────────────────────────────

const totalIssues = errors.length + warnings.length;

console.log('\n══════════════════════════════════════════════════════════════');
console.log('  SEO CHECK — ' + files.length + ' pages scanned');
console.log('══════════════════════════════════════════════════════════════');

if (warnings.length) {
  console.log('\n⚠  WARNINGS (' + warnings.length + '):\n');
  warnings.forEach(w => console.log('  ⚠  ' + w.replace(/\n/g, '\n     ')));
}

if (errors.length) {
  console.log('\n✖  ERRORS (' + errors.length + '):\n');
  errors.forEach(e => console.log('  ✖  ' + e.replace(/\n/g, '\n     ')));
}

if (totalIssues === 0) {
  console.log('\n  ✔  All SEO checks passed — ' + files.length + ' pages clean.\n');
} else {
  console.log('\n  ' + errors.length + ' error(s)  ' + warnings.length + ' warning(s)\n');
}

if (STRICT && errors.length > 0) {
  console.error(
    '\n[seo-check] Build FAILED in --strict mode.\n' +
    '  Fix the errors above (each line ends with "Fix: CMS → ..."),\n' +
    '  then push again. Warnings do not block the build.\n'
  );
  process.exit(1);
}
