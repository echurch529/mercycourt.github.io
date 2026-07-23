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
| 7 — Static pages CMS | ✅ Done | ministries ✅, tehillah-voices ✅, mercy-kidz ✅, about-us ✅, index ✅, community-impact ✅, contact ✅, plan-your-visit ✅; the-new-mc removed |
| 8 — Event landing pages | ✅ Done | Folder collection `events/` + `event-page.njk` layout; one-bring-one migrated; redirect stub at root; editable slugs on events + posts |
| 9 — CMS live preview templates | ✅ Done | `admin/preview.js` — all 10 templates built, pushed, and verified by editor |

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
  <script src="/admin/preview.js"></script>
</body></html>
```
`/admin/preview.js` script tag added in Phase 9 (commit `9c15a77`). The file registers `registerPreviewTemplate` components for each collection.

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

## Phase 7 — Static Pages CMS (✅ DONE)

### Approach

Editable fields extracted to front matter YAML; HTML body unchanged except hardcoded strings replaced with `{{ field }}` / `{% for %}` loops. Decap gets two new `files` collections (`main-pages`, `ministries-pages`) alongside the existing `posts` folder collection. Existing layout, CSS, and JS preserved exactly.

**File extension: stay `.html`, add `templateEngineOverride: njk` to front matter.** Do NOT rename to `.njk` — Decap v3 cannot reliably parse YAML frontmatter from `.njk` files. `.html` extension is natively understood by Decap with no `format` override needed. Eleventy processes the file as Nunjucks via `templateEngineOverride`.

**UX improvements (inspired by Statamic/TinaCMS/Sanity patterns):**
- Hero fields grouped under `object` widget — collapses as a unit in the sidebar
- List items get `summary` templates so collapsed items show meaningful labels (not just "Item 1")
- URL and technical fields get `hint` text explaining their purpose
- `default` values pre-populate fields for new editors

### Scope

**Completed conversions:**
1. `ministries.html` — ✅ **verified**
2. `tehillah-voices.html` — ✅ **verified**
3. `mercy-kidz.html` — ✅ **verified** (commit 8924f54)
4. `about-us.html` — ✅ **verified** (commit b8dac1d)
5. `the-new-mc.html` — ❌ **removed** from project entirely (not converted)
6. `index.html` — ✅ **converted** (commit 0f0b31c) — hero, about (body1/body2), mission_body, leadership (bio/blockquote), ministries list, cta_body; blog cards auto-pull from collections.posts
7. `community-impact.html` — ✅ **converted** (commit 8e7131c) — hero, mission (body1/2/3), stats loop, pantry_hours, programs/partners/testimonials/goals loops, pantry_highlight (body1/2/3), volunteer_intro1/2, volunteer_form_endpoint, grant_body; gallery kept static
8. `contact.html` — ✅ **converted** (commit b8a152c) — hero image only; all contact/footer info via site.*; social icon mismatch fixed
9. `plan-your-visit.html` — ✅ **converted** (commit df62aa6) — hero, welcome_body (×3), video_url, faq list (10 items as loop with loop.index IDs)

**Deferred (no conversion planned):** `give.html` (Zeffy iframes, minimal copy), `watch-live.html` (YouTube API JS, minimal copy), `blog.njk` (already .njk, posts auto-render).

**Shared site data:** `_data/site.json` — ✅ **created** (address, phone, email, social URLs, service times, Zeffy URLs, Mailchimp action).

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

CSS patterns like `@media(...){#id {...}}` trigger Nunjucks comment parsing (`{#` = comment open). Fix: add a space → `@media(...){ #id {...}}`. This was fixed in all blog layouts. Known occurrences in Phase 7:
- `mercy-kidz.html`: hit this during conversion — fixed by adding space (`){ #giving-modal`). Any page with the giving modal + minified media query will need the same fix. Check new conversions with `grep -n '{#' filename.html` before running build.

### ⚠️ Critical patterns for ALL Phase 7 `.njk` conversions (learned from pilot bugs)

**Bug 1 — Path resolution:** When Eleventy outputs `page.njk` to `_site/page/index.html`, ALL relative paths (`assets/...`, `give.html`) resolve from `/page/` not the root. EVERY href, src, and image path — including front matter image and link values — must be root-relative (leading `/`).
- Front matter: `image: "/assets/images/..."`, `link: "/mercy-kidz.html"` (NOT `"assets/..."`)
- HTML template: `href="/give.html"`, `src="/assets/..."`, `href="/"` for logo
- Template vars that output user-provided paths (e.g. `{{ ministry.image }}`) inherit the `/` from the front matter value — no need to add it in the template itself
- **Nav links must also be root-relative** — bare `href="about-us.html"` in nav/footer works when served from root but breaks in some hosting environments. Always use `href="/about-us.html"`. Verify with `grep 'href="[a-z]' _site/pagename.html` after build; should return 0 nav/footer matches.

**Bug 2 — Decap CMS format detection:** Decap v3 does not reliably parse YAML frontmatter from `.njk` files — `format: yaml-frontmatter` at either the collection or file-entry level was tried and failed. **Fix: keep the `.html` extension and add `templateEngineOverride: njk` to front matter.** Decap natively understands `.html` with YAML frontmatter; Eleventy processes it as Nunjucks via the override. No `format:` field needed in config.yml. This is the required pattern for ALL Phase 7 page conversions.

**Bug 3 — Legacy source file still deployed:** After initially renaming `ministries.html` → `ministries.njk`, the original `ministries.html` was only added to `.eleventy.js` ignores — not deleted. Eleventy's ignore rule prevents template processing but NOT static file serving; Cloudflare continued serving the old page at `/ministries.html`. Fix: delete the source file. The ignore rule is then unnecessary and should be removed.

**Bug 4 — Cloudflare edge cache:** Even after a file is deleted from the repo and a deploy completes, Cloudflare's edge cache can continue serving the old response. **Standard practice:** always confirm via the Cloudflare Pages Deployments tab that the build succeeded. If a URL still shows stale content after a confirmed-successful deploy, the fix is a cache purge (Dashboard → Caching → Configuration → Purge Everything) — not more code changes.

Commits: `5091c42` (paths fix), `fa006ac` (delete legacy file), `87851b0` (rename .njk → .html, add templateEngineOverride).

### ministries.html — pilot conversion notes

- `templateEngineOverride: njk` in front matter — required; DO NOT add this file to `.eleventy.js` ignores
- Hero bg: `/assets/images/2026/congregation/congregation-seated-service-01.jpg`
- Hero subtitle: "Discover the many ways you can connect, grow, and serve at Mercy Court"
- Intro eyebrow: "We do community differently"
- Intro body: "At Mercy Court, we believe that every member has a role to play in the body of Christ..."
- 5 ministry cards: Worship Ministry, Children's Ministry, Community Outreach, Discipleship Groups, Prayer Ministry
- Builds to `_site/ministries.html` (not a subdirectory) — Cloudflare pretty-URL routing serves it at `/ministries`
- `admin/config.yml` entry: `file: "ministries.html"`, no `format:` line

### Decap `files` collections — field summary per page

- **ministries** ✅: `hero` (object: image, subtitle), `intro_eyebrow`, `intro_body`, `ministries` (list: image/image_alt/title/description/link)
- **tehillah** ✅: `hero` (object: image, badge, tagline), `vision` (object: heading/body), `gallery` (list max 3), `about` (object: heading/body1/body2/instagram_url), `youtube_url`, `youtube_playlist_url`, `join_url`, `join` (object: body1/body2 — "Join the Worship Team" recruitment paragraphs), `scripture_quote`, `scripture_ref`
- **mercy-kidz** ✅: `hero` (object: image, tagline), `about_body`, `mission_heading_prefix`, `mission_heading_highlight`, `mission_body`, `who_we_serve_intro`, `age_groups` (list: class_name/age_range/description — Seeds, Seedlings, Sprouts, Vines), `farmers` (object: body1/body2/body3), `yearly_programs` (list: program_name — 4 annual events), `connect` (object: instagram_url/instagram_handle/youtube_url/youtube_handle), `faq` (list: question/answer). Static: 5S values, curriculum categories/bullets, farmers role-trait cards, What to Expect steps, age group card colors/SVGs (text dynamic via age_groups[i]). ⚠️ Do NOT use `name` as a subfield name in list widgets — Decap CMS silently drops the widget; use descriptive keys (class_name, program_name, etc.)
- **about** ✅: `hero` (object: image, headline, headline_highlight), `serve_body1`, `serve_body2`, `pastor` (object: photo/bio1/bio2/bio3), `vision_body1`, `vision_body2`, `testimonials` (list: title/quote/attribution). Static: approach pillars, pastor quote, service times, community grid
- **home** ✅: `hero` (image/headline/headline_highlight/tagline), `about` (body1/body2), `mission_body`, `leadership` (bio/blockquote), `ministries` (list: image/title/subtitle/body/link), `cta_body`
- **community-impact** ✅: `hero`, `mission` (body1/2/3), `stats` (list), `pantry_hours`, `programs` (list with emoji), `partners` (list), `testimonials` (list), `pantry_highlight` (body1/2/3), `goals` (list with emoji), `volunteer_intro1/2`, `volunteer_form_endpoint`, `grant_body`
- **contact** ✅: `hero` (image only — all contact info from site.*)
- **plan-your-visit** ✅: `hero`, `welcome_body1/2/3`, `video_url`, `faq` (list: question/answer; rendered with loop.index IDs)

### Post-conversion fixes (commit bb336d6 — 2026-07-19)

Two bugs found on all 4 Phase 7 pages after independent verification:

**Bug: Bare relative nav hrefs** — All 4 pages used `href="about-us.html"` style links instead of root-relative `/about-us.html`. For `index.html`, three ministry card `link:` values in front matter also needed the `/` prefix. Fixed by sed across all 4 files + front matter edits. Verified with `grep -c 'href="[a-z]...*\.html"'` on built output: 0 matches.

**Bug: Facebook missing from footer** — Footer social row on community-impact, contact, and plan-your-visit had only 3 icons (Instagram, YouTube, TikTok); Facebook was omitted during conversion. Inserted the Facebook block before Instagram in each footer, matching the 4-icon pattern from ministries.html. `index.html` footer has no social row (by design — its Connect section mid-page carries all 4).

**Root cause of delayed discovery:** The 5 Phase 7 conversion commits were local-only and never pushed to `origin/main`. The live site was running pre-conversion code. Standing rule added: always run `git log --oneline origin/main..HEAD` before any status report; never claim work is "live" or "in the CMS" if that returns commits.

---

## CMS Collection Structure (as of 2026-07-19)

`admin/config.yml` has four top-level collections (sidebar order):

1. **Main Pages** (`name: "main-pages"`) — Homepage, About Us, Contact, Plan Your Visit, Community Impact
2. **Ministries** (`name: "ministries-pages"`) — Ministries Overview, Tehillah Voices, Mercy Kidz
3. **Event Pages** (`name: "events"`) — folder collection, `events/*.html`, create: true, `slug: "{{fields.slug}}"`
4. **Blog Posts** (`name: "posts"`) — folder collection, `src/blog-posts/*.md`, create: true, `slug: "{{fields.slug}}"`

This mirrors the site nav: Tehillah Voices and God's Heritage nest under the Ministries dropdown; Homepage/About/Contact/etc. are top-level. Split from the original single flat "Pages" collection (commit `4786424`), reordered to put Blog Posts last (commit `c7f3ac5`). Event Pages added in Phase 8 (commit `c5a5c45`).

All 4 collections confirmed visible in `/admin/` sidebar.

---

## Phase 8 — Event Landing Pages (✅ DONE — 2026-07-19)

### Approach — Folder collection with shared Nunjucks layout

Folder collection (`events/`) identical in pattern to Blog Posts: each file contains front matter only; the shared `_includes/layouts/event-page.njk` template renders everything. `templateEngineOverride: njk` + `layout: layouts/event-page.njk` are injected via hidden Decap fields so editors never set them manually.

Old root `one-bring-one.html` kept as a client-side redirect stub (`<meta http-equiv="refresh">` + `window.location.replace()`) — GitHub Pages has no server-side redirects. Existing shares/traffic not broken.

All nav links across 14 source files updated to `/events/one-bring-one.html` (commit `c5a5c45`).

### Files created

| File | Purpose |
|------|---------|
| `_includes/layouts/event-page.njk` | Shared layout: hero, 5 optional sections, modal, footer |
| `events/one-bring-one.html` | First event entry — front matter only, no HTML body |

### Files modified

| File | Change |
|------|--------|
| `one-bring-one.html` (root) | Replaced with meta-refresh + JS redirect stub → `/events/one-bring-one.html` |
| `admin/config.yml` | `events` folder collection added (3rd position, between Ministries and Blog Posts) |
| 14 source files | Nav/footer EVENTS links updated to `/events/one-bring-one.html` |

### `event-page.njk` section structure

All sections except hero are optional — leave `heading:` blank (or omit the key entirely) to hide that section:

| Section key | Required | Notes |
|-------------|----------|-------|
| `hero` | ✅ | image, badge, headline, subheadline, primary_cta, secondary_cta_text/url |
| `testimonials` | optional | heading, subheading, video_url, quotes list; adaptive 1/2/3-col grid — **renders 2nd, immediately after hero** |
| `welcome` | optional | badge, heading, body (list of paragraphs) |
| `features` | optional | badge, heading, cards list (emoji/title/body) — 2-col grid |
| `logistics` | optional | heading, custom_note; address + service times from `site.*` |
| `cta_final` | optional | heading, body (list of paragraphs), button_text |
| `giving` | optional | heading, body, button_text, url |

Testimonials video: empty `video_url` → styled placeholder. Non-empty → `<iframe>` embed.

**Section order change (commits `a3bcdfc`, `ac59976` — 2026-07-23):** Testimonials section (containing the video) moved from position 4 (after Welcome and Features) to position 2 (immediately after the hero) in both `event-page.njk` and `admin/config.yml`. Rationale: video is high-value social proof that should be visible on the first scroll without requiring visitors to scroll past two other sections. CMS field order updated to match so the admin editor reflects the live page structure.

### Decap `events` collection fields

Hidden fields: `templateEngineOverride: njk`, `layout: layouts/event-page.njk`

Top-level: `title`, `slug` (editable, sets filename/URL), `seo_description`, `og_image`, `date`

Then one collapsed `object` widget per section above. `required: false` on all optional sections.

### Slug + SEO description improvements (commit `bf0893f`)

Both `events` and `posts` collections updated:
- `slug: "{{fields.slug}}"` at collection level — filename (= URL) is now set by the editor-typed slug field, not auto-derived from title
- `slug` field added (string widget): hint "Slug (target: 50–60 characters)"
- `seo_description` hint added: "Description (target: 120–160 characters)"
- `events/one-bring-one.html` front matter: `slug: one-bring-one` added so existing entry has the field populated

Note: Decap CMS has no computed/dynamic field defaults — the slug field starts blank for new entries. Editors must type the desired slug; the hint explains the format.

### Verified (2026-07-19)

- Old URL `/one-bring-one.html` → redirects to `/events/one-bring-one.html` ✅
- `/events/one-bring-one.html` renders all 6 sections correctly ✅
- All nav/footer/image paths root-relative ✅
- CMS `/admin/` shows Event Pages collection with one-bring-one entry ✅
- Test event created with long title + manually shortened slug `test-12th-anniversary` → live URL matched typed slug exactly ✅
- Optional sections (Testimonials, Giving) correctly hide when left blank ✅
- Test entry deleted ✅
- `one-bring-one` `video_url` populated with `https://www.youtube.com/embed/_VBaOUKJBpg` (commit `436ef46` — 2026-07-23); was previously blank/placeholder

---

## Phase 9 — CMS Live Preview Templates (✅ DONE)

### Approach

`admin/preview.js` — a single IIFE loaded after the Decap CMS bundle — registers `window.CMS.registerPreviewTemplate(name, component)` for all 10 collections. All components are **plain functions** (no ES6 class, no JSX, no build step). Styles delivered two ways:

1. **`registerPreviewStyle(url)`** — injects Google Fonts CSS into the preview iframe
2. **`injectTailwind()`** — idempotent guard appends Tailwind CDN script to `document.head`

All critical visual properties use **inline `style` props** so the preview renders correctly on first paint.

### Key implementation patterns

- **`var h = (React && React.createElement) || window.h`** — defensive detection; bail-out with `console.error` if neither exists. `window.React` is not reliably exported by all Decap CMS 3.x UMD builds; `window.h` is the safe primary.
- **Functional components** — avoids `extends React.Component` / `window.React.Component` dependency entirely.
- **`getData(props)`** — `var raw = props.entry.get('data'); return (raw && raw.toJS) ? raw.toJS() : {};` — converts Immutable.js entry to plain JS.
- **`props.widgetFor('body')`** — used in BlogPostPreview for native markdown rendering; avoids custom parsing.
- **`resolveImage(props, path)`** — direct return for `/`-prefixed paths; `props.getAsset(path)` fallback for CMS-managed uploads.
- **Shared helpers** — `noticeBar`, `pageHero`, `wrap`, `splitHeadline`, `pill`, `ctaBtn`, `h2Anton`, `para` — defined once in the IIFE, reused across all preview components.
- **Brand constants** — `ORANGE = '#E8541A'`, `NAVY = '#1B2A4A'`; font stacks with fallbacks.
- **`registerPreviewTemplate` naming** — for folder collections use the collection `name`; for files collections use the individual file entry's `name` (e.g. `'home'`, `'about'`), NOT the collection name.
- **Error boundary** — each component wrapped in try/catch; renders `'Preview error: ' + err.message` on failure.

### Status per collection (all ✅ verified by editor)

| Collection | Template name | Status |
|------------|--------------|--------|
| Event Pages | `'events'` | ✅ Done |
| Blog Posts | `'posts'` | ✅ Done |
| Main Pages — Homepage | `'home'` | ✅ Done |
| Main Pages — About Us | `'about'` | ✅ Done |
| Main Pages — Contact | `'contact'` | ✅ Done |
| Main Pages — Plan Your Visit | `'plan-your-visit'` | ✅ Done |
| Main Pages — Community Impact | `'community-impact'` | ✅ Done |
| Ministries — Overview | `'ministries'` | ✅ Done |
| Ministries — Tehillah Voices | `'tehillah'` | ✅ Done |
| Ministries — Mercy Kidz | `'mercy-kidz'` | ✅ Done |

### CMS field visibility fixes (commits `8d55f61`, branch deletion)

**Tehillah Voices — stale editorial workflow draft:**
The `cms/pages/tehillah` branch on GitHub was created by Decap's editorial workflow before the `join` field was added. Decap 3.x loads the draft branch version of a file (not `main`) when a draft exists, and only renders form fields whose keys are present in that file's frontmatter. Because the draft predated `join`, the field never appeared. Fix: deleted the stale draft branch — Decap falls back to `main` which has `join` with values.

**Mercy Kidz — `name` as a list subfield key:**
`age_groups` and `yearly_programs` both had a subfield named `name`. Decap CMS uses `name` internally as the identifier for every field definition object in its registry. Using it as a data key inside a list widget creates an ambiguity that causes Decap to silently drop those widgets (and sometimes adjacent ones). Fix: renamed to `class_name` (age_groups) and `program_name` (yearly_programs) in config.yml, frontmatter, and Nunjucks template. Build verified — rendered output correct.

**Standing rule:** Never use `name` as a subfield key inside a Decap CMS `list` or `object` widget field definition. Use descriptive alternatives (`class_name`, `program_name`, `item_label`, etc.).

### Ministries preview dispatch fix (commit `43284ab`)

All three Ministries pages were showing Decap's generic label+value fallback instead of custom branded layouts. Root cause: Decap CMS was looking up the preview template by the **collection name** (`'ministries-pages'`) rather than the individual file entry names (`'ministries'`, `'tehillah'`, `'mercy-kidz'`). Fix: added a `MinistriesDispatch` function registered under `'ministries-pages'` that routes to the correct component by inspecting `props.entry.get('path')`. Individual registrations kept as belt-and-suspenders.

```javascript
function MinistriesDispatch(props) {
  var path = (props.entry && props.entry.get('path')) || '';
  if (path.indexOf('tehillah') !== -1) return TehillahPreview(props);
  if (path.indexOf('mercy-kidz') !== -1) return MercyKidzPreview(props);
  return MinistriesPreview(props);
}
window.CMS.registerPreviewTemplate('ministries-pages', MinistriesDispatch);
```

### Critical bug fixed — `window.React` undefined in Decap CMS 3.x

Initial Event Pages template used `var h = React.createElement` which crashed the IIFE immediately when `window.React` was not exported (Decap 3.x UMD variant). Decap silently fell back to its built-in label+value preview with no console error visible in the UI. Fix: defensive detection line + convert class to functional component. All remaining templates built with functional pattern from the start — no class components anywhere in `preview.js`.

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
