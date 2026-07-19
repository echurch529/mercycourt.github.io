# Decap CMS Project State — RCCG Mercy Court

**Site:** mercycourt.org | **Repo:** echurch529/mercycourt.github.io | **Hosting:** Cloudflare Pages

---

## Phases

| Phase | Status | Notes |
|-------|--------|-------|
| 0 — Backup | ✅ Done | User has backup ZIP |
| 1 — Eleventy build | ✅ Done | `npm run build` → `_site/` clean, 18 files |
| 2 — Cloudflare Pages build settings | ✅ Done | Build confirmed live: 48s, NODE_VERSION 18; clean URLs verified in DevTools (0 .html hrefs) |
| 3 — Decap CMS admin panel | ✅ Done | `admin/index.html` + `admin/config.yml` created |
| 4 — GitHub OAuth Worker | ✅ Done | Live at `oauth-mercycourt.echurch.workers.dev`; incognito login confirmed; Decap dashboard loads with 4 posts |
| 5 — Access control | ✅ Done | Part A (branch protection) + Part B (Zero Trust) both verified 2026-07-18 |
| 6 — Delete old HTML blog posts | ✅ Done | All four files deleted via PR #2; live URLs verified post-deploy; /blog clean (0 .html in DOM) |
| 7 — Static pages CMS | ⏳ In progress | 5 pages → `.njk` conversion + Decap `files` collection; pilot: `ministries.html`; see below |
| 8 — Event landing pages | ❌ Pending | New `events` collection + `event-page.njk` layout; one-bring-one nav bug fix first |

---

## Phase 1 — File Inventory

### New files created

| File | Purpose |
|------|---------|
| `.eleventy.js` | Eleventy config |
| `_data/eleventyComputed.js` | Keeps .html files at original paths (e.g. `/about-us.html`) |
| `_includes/layouts/post.njk` | Standard blog post layout |
| `_includes/layouts/post-wide.njk` | 2-column layout (used by app post) |
| `src/blog-posts/blog-posts.json` | Directory data: layout, permalink, tags for all posts |
| `src/blog-posts/the-power-of-your-circle.md` | Pilot post — date 2026-05-04 |
| `src/blog-posts/repositioned-for-greatness.md` | date 2026-05-11 |
| `src/blog-posts/the-compound-effect.md` | date 2026-05-18 |
| `src/blog-posts/mercy-court-launches-believing-bible-study-app.md` | date 2026-06-01, `featured: true`, `layout: layouts/post-wide.njk` |
| `blog.njk` | Auto-generates `_site/blog.html` from `collections.posts` |
| `sitemap.njk` | Auto-generates `_site/sitemap.xml` |
| `package.json` | `"build": "eleventy"`, `"start": "eleventy --serve --watch"`, deps: `@11ty/eleventy ^2.0.1`, `luxon ^3.5.0` |

### `.eleventy.js` key decisions
- `htmlTemplateEngine: false` — existing HTML pages pass through as static files (no Nunjucks parsing)
- `markdownTemplateEngine: "njk"` — blog post `.md` files use Nunjucks for front matter vars
- `eleventyConfig.ignores.add(...)` — ignores: `blog.html`, `sitemap.xml`, `blog-posts/`, `node_modules`, `pages`, `marketingskills`, `screenshots`, `Reference`, `README.md`, `CMS_STATE.md`
- `addPassthroughCopy("assets")`, `addPassthroughCopy("CNAME")`, `addPassthroughCopy("robots.txt")`, `addPassthroughCopy("admin")`
- Filters: `postDate`, `isoDate`, `where`, `except`, `limit`
- Collection: `posts` — glob `src/blog-posts/*.md`, sorted newest-first

### Known gotcha — Nunjucks in CSS
CSS like `@media(...){#id {...}}` triggers Nunjucks comment parsing. Fix: add space after `{` → `@media(...){ #id {...}}`. This was fixed in `blog.njk`, `post.njk`, `post-wide.njk`.

### Blog post front matter schema
```yaml
title, seo_title, seo_description, date, author, category (news|events|inspiration),
featured (bool), hero_image, hero_image_alt, excerpt, read_time,
scripture_references (optional list)
```

### `post-wide.njk` extra front matter (app announcement post only)
```yaml
layout: layouts/post-wide.njk  # overrides blog-posts.json default
article_tags, article_keywords
sidebar_image, sidebar_image_alt
sidebar_app_name, sidebar_app_tagline, sidebar_app_description
sidebar_cta_primary_text/url, sidebar_cta_secondary_text/url
sidebar_install_iphone, sidebar_install_android, sidebar_install_desktop
sidebar_features_title, sidebar_features (list)
```

### HTML blocks in app post markdown body
The app post body (`mercy-court-launches-believing-bible-study-app.md`) contains raw HTML blocks for feature cards (`.border-l-2.border-brand-red`), install box (`.bg-gray-50.rounded-xl`), and CTA box (`.bg-brand-dark.rounded-xl`). markdown-it passes these through.

---

## Phase 2 — Cloudflare Pages Build Settings (✅ DONE)

Build confirmed: `npm ci && npm run build` → `_site/`, NODE_VERSION 18, 48s deploy time.
Clean URL fix verified 2026-07-18 via DevTools Elements panel search: 0 `.html` hrefs on live `/blog`.

---

## Phase 3 — Admin Panel (✅ DONE)

### `admin/index.html`
```html
<!DOCTYPE html><html><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Content Manager — RCCG Mercy Court</title>
</head><body>
  <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
</body></html>
```

### `admin/config.yml` key settings
```yaml
backend:
  name: github
  repo: echurch529/mercycourt.github.io
  branch: main
  base_url: https://oauth-mercycourt.echurch.workers.dev

publish_mode: editorial_workflow
media_folder: "assets/images/cms-uploads"
public_folder: "/assets/images/cms-uploads"
```

Collection fields: `title, seo_title, seo_description, date (datetime, YYYY-MM-DD), author, category (select: news/events/inspiration), featured (boolean), hero_image (image), hero_image_alt, excerpt (text), read_time (number), body (markdown), scripture_references (list, optional)`

---

## Phase 4 — OAuth Worker (✅ DONE)

Worker script: `cloudflare-worker/oauth-worker.js`

### Step A — Create GitHub OAuth App
1. Go to GitHub → **Settings** (top-right avatar) → **Developer Settings** → **OAuth Apps** → **New OAuth App**
2. Fill in:
   - **Application name:** `RCCG Mercy Court CMS`
   - **Homepage URL:** `https://mercycourt.org`
   - **Authorization callback URL:** `https://oauth-mercycourt.echurch.workers.dev/callback`
3. Click **Register application**
4. On the next screen: copy the **Client ID** (visible immediately)
5. Click **Generate a new client secret** → copy the secret **immediately** (it is shown only once)

### Step B — Create Cloudflare Worker
1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Create Worker**
2. Set name to exactly `oauth-mercycourt` (this sets the URL to `oauth-mercycourt.echurch.workers.dev`)
3. Click **Deploy** (ignore the default hello-world code — you'll replace it next)
4. On the success screen, click **Edit code**
5. Select all the default code and replace it with the full contents of `cloudflare-worker/oauth-worker.js`
6. Click **Save and deploy**

### Step C — Add Secrets
Worker → **Settings** → **Variables** → **Environment Variables** → **Add variable**:

For each variable, change type to **Secret** (not plain text) before saving:
- Name: `GITHUB_CLIENT_ID` → Value: (paste Client ID from Step A)
- Name: `GITHUB_CLIENT_SECRET` → Value: (paste Client Secret from Step A)

Click **Save and deploy** after adding both.

### Step D — Validate
**Worker isolation test (before touching /admin/):**
1. Visit `https://oauth-mercycourt.echurch.workers.dev/auth` in a browser
2. Expected: immediate redirect to `https://github.com/login/oauth/authorize?client_id=...`
3. If you see a GitHub login/authorize page, the worker is working

**Full end-to-end test (incognito window):**
1. Open incognito → go to `https://mercycourt.org/admin/`
2. Decap CMS loads (no GitHub auth yet) — you see a "Login with GitHub" button
3. Click the button → a **popup window** opens (not a full redirect)
4. The popup redirects to GitHub → you authorize `RCCG Mercy Court CMS`
5. GitHub redirects popup to `https://oauth-mercycourt.echurch.workers.dev/callback?code=...`
6. The worker exchanges the code for a token and renders a small HTML page
7. The popup closes automatically
8. The main Decap tab is now logged in — you see the CMS dashboard with the Posts collection
9. The 4 existing posts should be listed

**Session behavior:**
- Decap stores the GitHub token in `localStorage` — you remain logged in across page reloads until you explicitly log out or clear browser data
- Incognito windows clear on close, so editors using incognito must log in each session
- A normal browser tab stays authenticated indefinitely unless the user logs out

**Test draft (confirm write access):**
1. Create a new post → save as draft
2. Confirm branch `cms/posts/...` appears in the GitHub repo
3. Delete the draft from Decap (or close the branch on GitHub)

### Auth flow diagram (for sign-off verification)
```
User visits /admin/
      │
      ▼
Decap CMS loads (static HTML/JS — no server)
      │
      ▼ (clicks "Login with GitHub")
Popup opens → GET oauth-mercycourt.echurch.workers.dev/auth
      │
      ▼ (302 redirect)
github.com/login/oauth/authorize?client_id=...
      │
      ▼ (user authorizes)
GET oauth-mercycourt.echurch.workers.dev/callback?code=abc123
      │
      ▼ (worker POSTs to GitHub)
github.com/login/oauth/access_token → returns token
      │
      ▼
Worker renders popup page → postMessage("authorization:github:success:{token:...}")
      │
      ▼
Popup closes → Decap receives token → stores in localStorage
      │
      ▼
CMS dashboard loads — editor is authenticated
```

---

## Phase 5 — Access Control

### Part A — GitHub Branch Protection (✅ DONE — 2026-07-18)

Branch ruleset on `main`:
- Require PR before merging: ✅
- Required approvals: 1
- Dismiss stale approvals on new commits: ✅
- Include administrators: ❌ (admins retain bypass — enables admin self-publish via Decap)

Verified full loop: Decap draft → Ready to Review → PR created → admin approve/bypass-merge → Cloudflare auto-deploy → live post.

Editor workflow: ends at "Set status → Ready to Review." Admin merges on GitHub. Editors clicking Publish will be silently blocked by GitHub — tell editors not to use the Publish button.

### Part B — Cloudflare Zero Trust on `/admin/*` (✅ DONE — 2026-07-18)

Application: `Mercy Court CMS`
- Domain: `mercycourt.org`, Path: `/admin`
- Policy: Allow — Emails: `seun.imohi@mercycourt.org`, `blessing.leonard@mercycourt.org`
- Session duration: 24 hours
- Authentication method: One-time PIN

Verified flow: incognito → `mercycourt.org/admin/` → Cloudflare email challenge → PIN → GitHub OAuth → Decap dashboard.

**Identity provider gotcha (for future reference):**
The default "Cloudflare" identity provider (tied to the Cloudflare account login) was enabled on the account and kept overriding the One-time PIN flow, even with "Accept all identity providers" toggled off on the application. Fix: delete the "Cloudflare" identity provider entirely under **Zero Trust → Settings → Authentication → Identity provider integrations**, then explicitly add "One-time PIN" as its replacement. After that change, the email PIN challenge worked as intended. If Zero Trust auth ever reverts to a Cloudflare account login prompt instead of an email PIN, check this setting first.

---

## Phase 6 — Delete Old Blog HTML (✅ DONE — 2026-07-18)

Deleted via PR #2 after all four live post URLs independently verified.
All posts now served exclusively by Eleventy from `src/blog-posts/*.md`.
`/blog` page confirmed clean post-deploy: 0 `.html` hrefs in live DOM.

---

## Phase 7 — Static Pages CMS (⏳ IN PROGRESS)

### Approach

Pages renamed `.html` → `.njk`; editable fields extracted to front matter YAML; HTML body unchanged except hardcoded strings replaced with `{{ field }}` / `{% for %}` loops. Decap gets a new `files` collection alongside the existing `posts` folder collection. Existing layout, CSS, and JS preserved exactly.

**UX improvements (inspired by Statamic/TinaCMS/Sanity patterns):**
- Hero fields grouped under `object` widget — collapses as a unit in the sidebar
- List items get `summary` templates so collapsed items show meaningful labels (not just "Item 1")
- URL and technical fields get `hint` text explaining their purpose
- `default` values pre-populate fields for new editors

### Scope

**Tier 1 — Convert (5 pages, in pilot order):**
1. `ministries.html` → `ministries.njk` — ✅ **pilot complete** (built, verified 2026-07-19)
2. `tehillah-voices.html` → `tehillah-voices.njk` — **prerequisite:** rename `4G6A8444 copy 3.jpg` (space breaks Decap image widget) → e.g. `tehillah-voices-hero.jpg`
3. `the-new-mc.html` → `the-new-mc.njk` — **blocked:** user must create Formspree form for Get Connected form and provide endpoint
4. `mercy-kidz.html` → `mercy-kidz.njk`
5. `about-us.html` → `about-us.njk`

**Tier 2 — Shared site data only:** `_data/site.json` — ✅ **created** (address, phone, email, social URLs, service times, Zeffy URLs, Mailchimp action); `contact.html` + `index.html` stay as pass-through HTML.

**Deferred:** `community-impact.html`, `plan-your-visit.html` (complex interactive JS); `give.html`, `watch-live.html`, `index.html`.

### `_data/site.json` (confirmed from source files)

```json
{
  "address_street": "529 Walker Avenue",
  "address_city_state": "Baltimore, MD 21212",
  "phone": "+1 (410) 900-9111",
  "email": "info@mercycourt.org",
  "service_times": {
    "sunday":      { "label": "Sunday Service",           "time": "10:00 AM" },
    "wednesday":   { "label": "Bible Study",              "time": "7:00 PM"  },
    "friday":      { "label": "Prayer Meeting",           "time": "7:00 PM"  },
    "power_night": { "label": "Power Night (1st Friday)", "time": "7:00 PM"  }
  },
  "social": {
    "facebook":  "https://www.facebook.com/rccgmercycourt",
    "instagram": "https://www.instagram.com/mercycourt/",
    "youtube":   "https://www.youtube.com/@RCCGMercyCourt",
    "tiktok":    "https://www.tiktok.com/@rccgmercycourt"
  },
  "zeffy_general":  "https://www.zeffy.com/en-US/embed/donation-form/general-giving-25",
  "zeffy_building": "https://www.zeffy.com/en-US/embed/donation-form/building-project-3",
  "mailchimp_action": "https://mercycourt.us2.list-manage.com/subscribe/post?u=1f6d34239bf35c1b0512b77c8&id=888af1f4b9&f_id=0060c5e1f0"
}
```

Referenced in `.njk` templates as `{{ site.address_street }}`, `{{ site.social.instagram }}`, etc.

### Nunjucks gotcha — CSS `{#` conflict

CSS patterns like `@media(...){#id {...}}` trigger Nunjucks comment parsing (`{#` = comment open). Fix: add a space → `@media(...){ #id {...}}`. This was fixed in all blog layouts. Known occurrence in Phase 7:
- `ministries.html` line 74: `@media(prefers-reduced-motion:reduce){#giving-modal>div:last-child.animate{animation:none}}` → needs `){ #giving-modal`

### ⚠️ Critical patterns for ALL Phase 7 `.njk` conversions (learned from pilot bugs)

**Bug 1 — Path resolution:** When Eleventy outputs `page.njk` to `_site/page/index.html`, ALL relative paths (`assets/...`, `give.html`) resolve from `/page/` not the root. EVERY href, src, and image path — including front matter image and link values — must be root-relative (leading `/`).
- Front matter: `image: "/assets/images/..."`, `link: "/mercy-kidz.html"` (NOT `"assets/..."`)
- HTML template: `href="/give.html"`, `src="/assets/..."`, `href="/"` for logo
- Template vars that output user-provided paths (e.g. `{{ ministry.image }}`) inherit the `/` from the front matter value — no need to add it in the template itself

**Bug 2 — Decap CMS format detection:** Decap does not recognize `.njk` as a YAML-frontmatter file. Without an explicit `format` key, all fields appear empty in the CMS and a Save would wipe the file's content. Every `files` collection entry for a `.njk` file MUST include:
```yaml
format: "yaml-frontmatter"
```

Both fixes committed as `5091c42` on 2026-07-19.

### ministries.html — pilot conversion notes

- Hero bg: `assets/images/2026/congregation/congregation-seated-service-01.jpg`
- Hero subtitle: "Discover the many ways you can connect, grow, and serve at Mercy Court"
- Intro eyebrow: "We do community differently"
- Intro body: "At Mercy Court, we believe that every member has a role to play in the body of Christ..."
- 5 ministry cards: Worship Ministry, Children's Ministry, Community Outreach, Discipleship Groups, Prayer Ministry
- Footer bug: only 3 social icons with wrong icon/URL pairings → replace with correct 4-link footer from `one-bring-one.html`
- Canonical/og:url/ld+json: strip `.html` suffix → `/ministries`
- `.eleventy.js`: add `eleventyConfig.ignores.add("ministries.html")` to prevent duplicate pass-through output

### `the-new-mc.html` notes
- `<meta name="robots" content="noindex, nofollow">` — preserved during conversion; removal is a separate explicit decision
- Get Connected form has no `action` and no JS handler — broken. Fix: add Formspree endpoint + async submit handler (same pattern as `community-impact.html`). **User must create the Formspree form and provide the endpoint first.**

### Decap `files` collection — field summary per page

Full YAML schema is in the plan file (`/Users/oluwaseunimohi/.claude/plans/modular-waddling-sky.md`).

- **ministries**: `hero` (object: image, subtitle), `intro_eyebrow`, `intro_heading`, `intro_body`, `ministries` (list: image/image_alt/title/description/link)
- **tehillah**: `hero` (object: image, badge, tagline), `vision` (object: heading/body), `gallery` (list max 3), `about` (object: heading/body/instagram_url), `youtube_url`, `join_url`, `roles` (list), `scripture_quote`, `scripture_ref`
- **the-new-mc**: `hero`, `mission`, `vision`, `serve_teams` (list), `leaders`, `leader_bio` (markdown), `formspree_endpoint`
- **mercy-kidz**: `hero` (object: image, tagline), `mission`, `values` (5S list), `age_groups` (list), `faq` (list), `programs` (list)
- **about**: `hero` (object: image, headline), `pastor` (object: photo + bio markdown), `pastor_quote`, `pastor_quote_attr`, `vision_body` (markdown), `testimonials` (list max 2)

### Pending user action
- Create a Formspree form for The New MC "Get Connected" and provide the endpoint URL before page 3 is converted.

---

## Phase 8 — Event Landing Pages (❌ PENDING)

### Approach — Variable Type Widgets (block-based)

Event pages use Decap's **Variable Type Widgets** (`list` with `types` + `typeKey: "block_type"`). This is the structural equivalent of Statamic Replicator / TinaCMS blocks / Sanity typed arrays. Editors can add, remove, and reorder section blocks in the Decap sidebar. Each block type exposes only its own fields.

`event-page.njk` renders via `{% for section in sections %}` + `{% if section.block_type == "hero" %}` etc. The visit modal form (Formspree + Mailchimp dual-submit) is rendered once outside the sections loop using top-level flat fields.

### Prerequisite
Fix `one-bring-one.html` nav/footer `../` relative hrefs → absolute paths before any event page templating.

### File structure

```
src/event-pages/
  event-pages.json      → layout + permalink (/{{ page.fileSlug }}) + tags: [events]
  one-bring-one.md      → first entry, migrated from one-bring-one.html
_includes/layouts/
  event-page.njk        → block renderer (for loop + if/elif per block type)
_data/
  currentEvent.js       → finds is_current_event: true → exports URL for nav
```

### Top-level flat fields (per event, not blocks)

`title`, `seo_title`, `seo_description`, `og_image`, `is_current_event` (boolean), `formspree_endpoint`, `mailchimp_f_id`, `mailchimp_tag`

### Block types (`section.block_type` values)

| Block | Key fields |
|-------|-----------|
| `hero` | image, badge, headline, tagline, cta_primary_text, cta_secondary_text |
| `welcome` | badge, heading, body (markdown) |
| `feature_grid` | badge, heading, cards list (emoji/title/body) |
| `video` | heading, url (YouTube embed URL) |
| `testimonials` | badge, heading, items list (name/quote), max 3 |
| `service_info` | heading, address, time, parking_note |
| `cta` | heading, body (markdown), button_text |

### Nav — `is_current_event` flag

`_data/currentEvent.js` finds the event with `is_current_event: true`, exports its URL. Nav uses `{{ currentEvent.url | cleanUrl }}`. Toggle the flag on new event + off old → nav updates on next deploy. Old pages stay live.

### Existing `one-bring-one.html`
Stays untouched in the project root until an explicit migration decision is made. No deletion without instruction.

---

## Tracking IDs
- GA4: `G-JWGVNRLKJL`
- Meta Pixel: `1027268596866855`
- Mailchimp form action: `https://mercycourt.us2.list-manage.com/subscribe/post?u=1f6d34239bf35c1b0512b77c8&id=888af1f4b9&f_id=0060c5e1f0`
- Mailchimp f_id (visit modal / one-bring-one): `0065c5e1f0`
- Zeffy general giving: `https://www.zeffy.com/en-US/embed/donation-form/general-giving-25`
- Zeffy building project: `https://www.zeffy.com/en-US/embed/donation-form/building-project-3`
- Formspree (visit modal / one-bring-one): `https://formspree.io/f/xreddnbn`

## Social URLs (confirmed from one-bring-one.html footer)
- Facebook: `https://www.facebook.com/rccgmercycourt`
- Instagram: `https://www.instagram.com/mercycourt/`
- YouTube: `https://www.youtube.com/@RCCGMercyCourt`
- TikTok: `https://www.tiktok.com/@rccgmercycourt`
