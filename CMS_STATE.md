# Decap CMS Project State — RCCG Mercy Court

**Site:** mercycourt.org | **Repo:** echurch529/mercycourt.github.io | **Hosting:** Cloudflare Pages

---

## Standing Rules

### ⚠️ Image fields — alt text and file size (standing requirement)

Every `image` widget in `admin/config.yml` must follow this pattern:

**Where the image renders as an `<img>` tag in the template:**
1. Add the `image` widget field with a file size hint: `hint: "Keep under 300KB (hero/banner: 500KB). Compress at squoosh.app or tinypng.com before uploading."`
2. Add a sibling `string` widget immediately after for alt text: `{ label: "Image Alt Text", name: "image_alt", widget: "string", hint: "Describe the image for screen readers and image search — e.g. '...'" }`
3. Update the template to use `alt="{{ field.image_alt }}"` (or `| default(fallback)` if graceful degradation is needed)
4. Populate the alt field in the page's frontmatter YAML

**Where the image renders as a CSS `background-image` (no `<img>` tag):**
- Add the file size hint only. Do NOT add an alt field — CSS backgrounds have no `alt` attribute in HTML, so the field would not map to any rendered output (misleading to editors).

**Decap CMS 3.x limitation:** The `image` widget returns a plain string path. There is no native alt text property on the widget itself — the sibling field pattern is the only correct approach for structured image fields. (The markdown rich-text editor does support alt text natively for inline images in `body` fields, but that is separate.)

**File size:** Decap CMS does not natively support file size restrictions or warnings. The size hint on every image field is the best achievable within Decap's current architecture. Do not implement custom widget workarounds for this.

**Implemented (commit `fb6be67` — 2026-07-23):**
| Field | Alt field | Template |
|---|---|---|
| `events` → `hero.image` | `hero.image_alt` ✅ | `event-page.njk` — `alt="{{ hero.image_alt \| default(title) }}"` |
| `plan-your-visit` → `hero.image` | `hero.image_alt` ✅ | `plan-your-visit.html` — `alt="{{ hero.image_alt }}"` |
| `about` → `pastor.photo` | `pastor.photo_alt` ✅ | `about-us.html` — `alt="{{ pastor.photo_alt }}"` |
| `home` → `ministries[].image` | `image_alt` ✅ | `index.html` — `alt="{{ ministry.image_alt \| default(ministry.title) }}"` |
| `ministries` → ministry cards `image` | `image_alt` ✅ (pre-existing) | `ministries.html` — `alt="{{ ministry.image_alt }}"` |
| `tehillah` → `gallery[].image` | `alt` ✅ (pre-existing) | `tehillah-voices.html` — `alt="{{ gallery[i].alt }}"` |
| Blog posts `hero_image` | `hero_image_alt` ✅ (pre-existing) | `post.njk`, `post-wide.njk` |
| All hero images rendered as CSS bg | hint only, no alt field | — |

---

### ⚠️ Preview template sync — mandatory on every structural change

Whenever a structural change is made to any live page — section reordering, new/removed sections, layout changes, field additions/removals — you must:

1. **Immediately check** whether the corresponding `registerPreviewTemplate` component in `admin/preview.js` still matches the updated live page structure.
2. **Fix it in the same commit** if it doesn't match. Do not wait for the mismatch to be reported separately.
3. **Update CMS_STATE.md** in that same commit, logging what structural change was made and explicitly confirming the preview template was checked and synced.

The CMS preview must never be allowed to drift out of sync with the live page. This applies to every collection: Ministries, Main Pages, Event Pages, and Blog Posts.

**Why this rule exists:** After the event page section reorder (testimonials moved from position 4 to position 2), the preview template was not synced in the same commit — the mismatch had to be reported and fixed separately (commits `a3bcdfc` → `68ef8f7`). This rule prevents that from recurring.

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

**Deferred (no conversion planned):** `give.html` (Zeffy iframes, minimal copy), `watch-live.html` (YouTube API JS, minimal copy).

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
- **home** ✅: `hero` (image/headline/headline_highlight/tagline/show_hero_text), `about` (body1/body2), `mission_body`, `leadership` (bio/blockquote), `ministries` (list: image/title/subtitle/body/link), `cta_body`
- **community-impact** ✅: `hero`, `mission` (body1/2/3), `stats` (list), `pantry_hours`, `programs` (list with emoji), `partners` (list), `testimonials` (list), `pantry_highlight` (body1/2/3), `goals` (list with emoji), `volunteer_intro1/2`, `volunteer_form_endpoint`, `grant_body`
- **contact** ✅: `hero` (image only — all contact info from site.*)
- **plan-your-visit** ✅: `hero`, `welcome_body1/2/3`, `video_url`, `faq` (list: question/answer; rendered with loop.index IDs)
- **blog** ✅: `hero` (image/image_alt/headline/headline_highlight/tagline), `section` (heading/heading_highlight/description). Featured post and blog grid are auto-populated from `collections.posts` — no CMS fields needed. See "Blog Page CMS Integration (2026-08-09)".

### Post-conversion fixes (commit bb336d6 — 2026-07-19)

Two bugs found on all 4 Phase 7 pages after independent verification:

**Bug: Bare relative nav hrefs** — All 4 pages used `href="about-us.html"` style links instead of root-relative `/about-us.html`. For `index.html`, three ministry card `link:` values in front matter also needed the `/` prefix. Fixed by sed across all 4 files + front matter edits. Verified with `grep -c 'href="[a-z]...*\.html"'` on built output: 0 matches.

**Bug: Facebook missing from footer** — Footer social row on community-impact, contact, and plan-your-visit had only 3 icons (Instagram, YouTube, TikTok); Facebook was omitted during conversion. Inserted the Facebook block before Instagram in each footer, matching the 4-icon pattern from ministries.html. `index.html` footer has no social row (by design — its Connect section mid-page carries all 4).

**Root cause of delayed discovery:** The 5 Phase 7 conversion commits were local-only and never pushed to `origin/main`. The live site was running pre-conversion code. Standing rule added: always run `git log --oneline origin/main..HEAD` before any status report; never claim work is "live" or "in the CMS" if that returns commits.

---

## CMS Collection Structure (as of 2026-07-19)

`admin/config.yml` has four top-level collections (sidebar order):

1. **Main Pages** (`name: "main-pages"`) — Homepage, About Us, Contact, Plan Your Visit, Community Impact, Blog
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
| `hero` | ✅ | image, image_alt, badge, headline, subheadline, primary_cta, secondary_cta_text/url |
| `countdown_target` + `countdown_heading` | optional | top-level fields (not an object). Non-blank `countdown_target` renders live JS countdown (days/hrs/mins/secs) directly below hero |
| `testimonials` | optional | heading, subheading, video_url, quotes list; adaptive 1/2/3-col grid |
| `welcome` | optional | badge, heading, body (list of paragraphs) |
| `schedule` | optional | badge, heading, items list (day/time/label) — 4-col card grid; hidden when items empty |
| `speaker` + top-level `host_name` | optional | full_name (**not** `name` — standing rule), title, bio, photo, photo_alt; "Hosted by {host_name}" credit; hidden when full_name blank; centers text when no photo |
| `features` | optional | badge, heading, cards list (emoji/title/body) — 2-col grid |
| `logistics` | optional | heading, custom_note, + optional middle-column override: middle_icon/middle_label/middle_line1/middle_line2 (defaults to Sunday Service from `site.*` when middle_label blank) |
| `cta_final` | optional | heading, body (list of paragraphs), button_text |
| `giving` | optional | heading, body, button_text, url |

**Render order (live + preview + config field order, all synced):** Hero → Countdown → Testimonials → Welcome → Schedule → Speaker → Features → Logistics → Giving → Final CTA.

Testimonials video: empty `video_url` → styled placeholder. Non-empty → `<iframe>` embed.

### 12th Anniversary page + new sections (2026-07-23)

`events/12th-anniversary.html` created — theme "Better Things", Aug 14–16 2026. New optional layout sections added to `event-page.njk` for it (countdown, schedule, speaker, logistics middle-column override — all listed in the table above). Details:

- **Countdown**: `countdown_target` stored as ISO string with offset (`"2026-08-14T19:00:00-04:00"` = Tehillah Album Launch, Fri 7 PM ET). Decap datetime widget uses `format: "YYYY-MM-DDTHH:mm:ssZ"` so it saves a string, not a YAML date. Template handles both: `countdown_target.toISOString() if countdown_target.toISOString else countdown_target`. Inline script ticks every second; clamps to zeros after the target passes.
- **Speaker photo**: `/assets/images/cms-uploads/speaker-george-adegboye.jpg` — wired into front matter (commit `9d2e162`). Photo was uploaded via CMS during the build session and discovered from git log.
- **CTA button behaviors (commit `47f4af4`)**: "Save the Date" uses `primary_cta_url: "/assets/events/12th-anniversary.ics"` — template renders it as `<a href="..." download>` when `primary_cta_url` is set. "Plan Your Visit" uses `secondary_cta_url: "#visit-modal"` sentinel — template renders it as `<button onclick="openVisitModal()">` instead of an anchor. Pattern for `primary_cta_url`: absent → modal button; present → download link. Pattern for `secondary_cta_url`: `"#visit-modal"` → modal button; any other value → standard `<a>` link. Both patterns apply in both text-mode and flyer-mode hero. `admin/config.yml` fields updated with explanatory hints; `preview.js` synced (preview shows styled label buttons — modal and download are live-page behaviors). `assets/events/12th-anniversary.ics` created: DTSTART `20260814T230000Z` (Aug 14 7 PM EDT), DTEND `20260816T170000Z` (Aug 16 ~1 PM EDT), covers all 3 days.
- **Preview sync (standing rule followed)**: `CountdownSection`, `ScheduleSection`, `SpeakerSection` + logistics middle-column override added to `admin/preview.js` in the same commit, same render order. Preview countdown computes remaining time at render (static snapshot, labeled "counts down live on the published page") — no setInterval in the preview iframe.
- **One-bring-one regression-checked**: builds byte-identical behavior — none of the new sections render (all keys absent), logistics middle column falls back to Sunday Service default.
- **Events nav dropdown (✅ DONE — 2026-07-23)**: Events promoted from a sub-link inside the About Us dropdown to its own top-level nav dropdown (same pattern as Ministries): "12th Anniversary" (`/events/12th-anniversary.html`) + "One Bring One" (`/events/one-bring-one.html`); parent link points at the anniversary page. Applied to all 14 nav-bearing source files (11 pages + event-page/post/post-wide layouts) via script — note three pre-existing href variants for the Community Impact anchor line (`/community-impact.html`, relative `community-impact.html` in about-us/give/watch-live, extensionless `/community-impact` in blog.njk/post layouts) required regex matching. `the-new-mc.html` intentionally skipped (slated for deletion, Phase 7 plan Task 0). `sitemap.njk`: 12th-anniversary entry added.

### Hero flyer mode + preview image bug fix (2026-07-23)

**Hero flyer mode** (`event-page.njk` + preview): when `hero.badge`, `hero.headline`, AND `hero.subheadline` are ALL blank, the hero switches to flyer mode — the image renders full-width at natural aspect ratio (no crop, no blur backdrop, no forced viewport height) on a black section with the CTA buttons below it. (Original 2026-07-23 implementation had a blurred backdrop + 100vh centering; removed same day at user request — hero is now just the flyer itself. Preview synced in the same commit.) Text mode (any of the three set) is unchanged. `headline`/`subheadline` are now `required: false` in config.yml so editors can blank them; the headline hint explains flyer mode. 12th-anniversary uses flyer mode with `betterthings-lndscape.jpeg` (landscape flyer) for both `hero.image` and `og_image` — all event info lives in the artwork, and the full flyer text is mirrored into `image_alt` for accessibility. The portrait flyer (`better-things-final.jpeg`) was deleted from CMS media by the user; only the landscape version is referenced.

**Preview image refresh bug (root cause + fix)**: `resolveImage()` in `admin/preview.js` skipped `getAsset()` for paths starting with `/` and returned the raw path. Freshly uploaded media (`/assets/images/cms-uploads/...`) then 404'd against the deployed site until the upload commit finished deploying — making the preview appear not to refresh after selecting a new image. Fix: always call `getAsset()` first (returns a local blob URL for pending uploads; resolves to the public path for deployed media), fall back to the raw path on failure. Affects every collection's preview, not just events.

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
- **`mdToHtml(md)` + `mdInline(text)`** — inline markdown converter used in BlogPostPreview; replaced `props.widgetFor('body')` which returned null in Decap 3.x (commit `0875ecb`, 2026-07-31).
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

### Hero text-overlay toggle — reusable pattern (added 2026-07-23)

**Field:** `hero.show_hero_text` — boolean, default `true`.

**Homepage:** `index.html` hero section wraps the headline/tagline/CTA block in `{% if hero.show_hero_text == false %}` / `{% else %}`. When `false`, the hero renders as a plain `<img>` at natural aspect ratio (max 100vh, object-fit cover) on a black section — identical clean pattern to the Event Page flyer mode. When `true` (or unset), full text overlay renders as before.

**CMS config:** `boolean` widget inside the home `hero` object, hint explains the use case (flyer or announcement graphic). Default `true` ensures existing editors see no change.

**Preview sync (mandatory rule followed):** `admin/preview.js` `HomePreview` reads `hero.show_hero_text !== false` → `showHeroText`. When false, renders `<section style="background:#000"><img width:100% height:auto maxHeight:100vh></section>` instead of calling `pageHero(...)`. Both branches update on every CMS field change so the toggle is live in preview.

**Extensibility note:** The same `show_hero_text` boolean pattern can be added to other hero-bearing collections later if needed — Event Pages (`event-page.njk` already has its own badge/headline/subheadline blank-check for flyer mode, so no change needed there), Ministries pages, or any future page with a full-bleed hero image. The template pattern is always `{% if hero.show_hero_text == false %}` (not `!= true`) so undefined (field not yet added) defaults to text-on.

---

## Comprehensive CMS Audit (2026-07-24) — commit `5e8e744`

### Bugs fixed

**Community Impact — `name` subfield collision in partners list (same class as Mercy Kidz):**
`admin/config.yml` partners list used `{ name: "name", widget: "string" }` as the Decap field key. Decap silently dropped the "Partner Name" widget — editors could not update partner names through the CMS. Live page was unaffected (YAML `name:` keys and `{{ partner.name }}` both resolved correctly in Nunjucks). Fix: renamed to `partner_name` in config.yml (field key + summary template), all three partner entries in `community-impact.html` front matter, the Nunjucks template (`{{ partner.partner_name }}`), and the preview (`p.partner_name`).

**Community Impact preview — missing `grant_body` section:**
`CommunityImpactPreview` in `admin/preview.js` ended after the Volunteer section. The "Trusted Anchor in Baltimore" section (`{{ grant_body }}` at line 644 of `community-impact.html`) rendered on the live page but was absent from the preview. Added the grant_body section at the end of `CommunityImpactPreview`.

**Tehillah Voices preview — "Join the Worship Team" used hardcoded text:**
`TehillahPreview` showed a hardcoded paragraph ("Whether you sing, play an instrument…"). The live page uses `{{ join.body1 }}` and `{{ join.body2 }}` (CMS-managed fields at lines 311–314 of `tehillah-voices.html`). Editing those fields in the CMS produced no change in the preview pane. Fixed: replaced hardcoded text with `data.join.body1` / `data.join.body2`.

### Confirmed clean (no action needed)

- Hero nav overlap fix: verified present on all 17 hero sections across all page types ✅
- All 10 preview templates registered; MinistriesDispatch + MainPagesDispatch both functional ✅
- Event page section order identical in live template and preview ✅
- Analytics.js: no `the-new-mc` reference remaining ✅
- Blog post `repositioned-for-greatness.md` hero_image: YAML multi-line path resolves correctly to `adventurous-...utc (1).jpg` — image loads correctly ✅
- Alt text fields present and populated across all required image widgets ✅
- No `{#` CSS conflicts in built output ✅

### Pending cleanup (user decision required)

- **Stale git branches:** `remove-legacy-blog-html` (local + remote), `origin/cms/posts/repositioned-for-greatness` (orphaned Decap editorial workflow branch)
- **Orphaned assets:** `assets/images/2026/the-new-mc/` (4 images; page deleted), `assets/images/2026/flyers/anniversary/better-things-final.jpeg` + `better-things-final-long.jpeg` (portrait flyer copies; landscape version in cms-uploads is what's referenced), `assets/images/2026/leadership/Speaker-George-Adegboye.jpg` (original; `cms-uploads/speaker-george-adegboye.jpg` is referenced), `assets/images/2026/flyers/anniversary/betterthings-lndscape.jpeg` (duplicate; `cms-uploads/betterthings-lndscape.jpeg` is referenced), `assets/blog/*.docx` (3 source documents, not web assets)
- **README.md:** Still references `the-new-mc.html` in 3 places (documentation only; not served to users)
- **Alt text quality:** Tehillah gallery all 3 images have identical `alt: Tehillah Voices`; Ministries card `image_alt` values are card titles rather than image descriptions — content decisions

---

## Site-wide Hero Nav Overlap Fix (2026-07-24)

**Problem:** All hero `<section>` elements started at y:0 in the page. With the nav at `position: fixed; top: 0` (height 72px — `py-4` padding × 2 + `h-10` logo), the fixed nav overlaid the top 72px of every hero across the entire site.

**Affected page types:** All — Main Pages, Ministries pages, Event Pages (text mode), Blog Posts, Plan Your Visit.

**First pass (commit `e55d5cc`):** Added `padding-top: 72px` using Tailwind arbitrary-value class `pt-[72px]` on sections that used class-based styling; inline `style=` on sections that already had inline styles. Build clean.

**Second pass (commit `588b850`):** After user confirmed 5 pages (Give, Ministries, Tehillah Voices, Mercy Kidz, Watch Live) still showed content under the nav on the live site — root cause: Tailwind Play CDN (`cdn.tailwindcss.com`) does not reliably generate CSS for arbitrary-value classes like `pt-[72px]` across all pages. Fix: replaced every `pt-[72px]` instance with `style="padding-top: 72px"` across all 10 affected files. Inline styles apply unconditionally, bypassing CDN scan/generation timing.

**Files patched:** `index.html`, `about-us.html`, `contact.html`, `community-impact.html`, `ministries.html`, `tehillah-voices.html`, `mercy-kidz.html`, `give.html`, `watch-live.html`, `blog.njk`, `plan-your-visit.html`, `_includes/layouts/event-page.njk`, `_includes/layouts/post.njk`, `_includes/layouts/post-wide.njk`.

**Standing rule:** Never rely on Tailwind Play CDN arbitrary-value classes (bracket syntax `pt-[72px]`, `h-[65vh]`, etc.) for layout-critical properties. Use inline `style=` for any value that isn't a named Tailwind utility or confirmed to generate reliably. The CDN is useful for named utilities; bracket values are JIT-only and the CDN's scan coverage is not guaranteed.

---

## CMS Admin Branding (2026-07-24 / 2026-07-31)

### Commits
- `b02e7f4` — initial branding: logo, favicon, site URL
- `2e736d8` — bug fix + dark mode toggle + watermark

### Changes to `admin/config.yml`

Three top-level keys added (after `public_folder`, before `collections`):

```yaml
logo_url: /assets/images/MC LOGO 1080PX black.png
site_url: https://mercycourt.org
display_url: https://mercycourt.org
```

- `logo_url` — church logo shown on the Decap login screen and CMS header bar
- `site_url` / `display_url` — "View site" link in the CMS toolbar; corrected from `.github.io` (404d) to `mercycourt.org`

### Changes to `admin/index.html`

Added favicon, minimal body style, watermark div, and dark mode toggle:

- **Favicon:** `<link rel="icon" type="image/png" href="/assets/images/MC LOGO 1080PX black.png" />`
- **Body style:** `body { background: #f8fafc; margin: 0; }` — page chrome only, no Decap internals targeted
- **Watermark:** `<div id="mc-watermark">` — 560px MC logo fixed to bottom-right, `opacity: 0.06`, `pointer-events: none`, `z-index: 0`. Visible in the background of the login screen; partially visible in the editor margins. In dark mode, the black logo automatically inverts to white — correct for a dark background.
- **Dark mode toggle:** `<button id="mc-theme-toggle">` — pill button fixed top-right (`z-index: 99999`). Applies `filter: invert(1) hue-rotate(180deg)` to `body`; counter-inverts itself with the same filter so it always looks normal regardless of mode. Preference saved to `localStorage` (`mc-cms-theme: 'dark' | 'light'`). Applied on page load before Decap renders — no flash. Implementation avoids all Decap internal selectors.

### Logo assets available
| File | Use |
|---|---|
| `/assets/images/MC LOGO 1080PX black.png` | Used for favicon, logo_url, watermark (inverts correctly in dark mode) |
| `/assets/images/MC LOGO 1080PX white.png` | Available — not currently used |
| `/assets/images/MC LOGO 1080PX yellow.png` | Available — not currently used |

### Design decision: no internal Decap CSS targeting
Decap CMS's internal component class names are not part of its public API and change across minor/patch versions. All branding uses page-level CSS and official config keys only. This keeps the implementation resilient to Decap version bumps via the `@^3.0.0` CDN range.

---

## Blog Post Preview — Body Rendering Fix (2026-07-31) — commit `0875ecb`

### Problem
`props.widgetFor('body')` — the Decap CMS API for delegating markdown body rendering to the widget's internal preview component — returns `null` silently for new entries and before the first keystroke in Decap 3.x. This caused the preview pane's article body area to be permanently blank for new blog posts being edited in the CMS. Existing published posts were unaffected on the live site (`post.njk` uses `{{ content | safe }}` which is correct and unchanged).

### Root cause
`widgetFor('body')` in Decap CMS 3.x's functional-component preview API does not reliably initialize for the markdown widget on new/empty entries. It is not a public, stable API.

### Fix (in `admin/preview.js`)

1. **Added `mdInline(text)` function** — converts inline markdown (bold, italic, links, images, code spans) to HTML strings.

2. **Added `mdToHtml(md)` function** — line-by-line markdown parser covering all elements that appear in Mercy Court blog posts:
   - H1–H6 headings
   - Blockquotes (consecutive `>` lines)
   - Unordered lists (`*`/`-`/`+`) and ordered lists (`1.`/`2.`)
   - Horizontal rules
   - Paragraphs (consecutive non-special lines)
   - Delegates inline elements to `mdInline()`

3. **In `BlogPostPreview`**: replaced `props.widgetFor('body')` with:
   ```javascript
   var bodyHtml = mdToHtml(data.body || '');
   // ...
   h('div', { dangerouslySetInnerHTML: { __html: bodyHtml } })
   ```
   `data.body` comes from `rawData.toJS()` — Decap stores the file body content under `data.body` for folder collections with a `widget: "markdown"` field named `body`.

### What is NOT changed
- `post.njk` template: still uses `{{ content | safe }}` (Eleventy's rendered markdown body). No change.
- `blog-posts.json`, `.eleventy.js`, `admin/config.yml` posts collection: all unchanged.
- The fix affects only the CMS preview pane, not the live site.

### Known limitation: `markdownTemplateEngine: "njk"`
Because `.md` files are processed through Nunjucks before markdown parsing (`.eleventy.js` line 54), any blog post body containing Nunjucks-special characters (`{{`, `}}`, `{%`, `%}`) will be evaluated as Nunjucks at build time. This would cause silent content drops or build errors for posts with code examples using curly braces. This is a pre-existing Eleventy config issue — not introduced by this fix.

---

## Zelle Giving Option — Site-Wide Addition (2026-08-05)

### Summary
Zelle added as the primary/first giving method across all pages. Existing Zeffy-based giving (General Giving, Building Project) is fully intact and unchanged. Zelle details: **RCCG Mercy Court · (410) 900-9111**.

### Changes per location

| File | What changed |
|------|-------------|
| `give.html` | (1) Intro CTA section: "Give via Zelle" replaces "Give Now" as primary button; Zelle phone/name box added above buttons. (2) "WAYS TO GIVE" grid: Zelle added as first card (brand-red, "Most Popular" badge); grid changed from `md:grid-cols-3` to `sm:grid-cols-2 xl:grid-cols-4`. (3) New `#give-zelle` section added between "Ways to Give" and "Online Giving Form" — white card with full step-by-step Zelle instructions. |
| `index.html` | `#give` section: Zelle phone/name info box added between paragraph and buttons. Giving modal: Zelle strip added at top of scrollable area above Zeffy iframe. |
| `about-us.html`, `community-impact.html`, `contact.html`, `ministries.html`, `plan-your-visit.html`, `watch-live.html`, `mercy-kidz.html`, `blog.html` | Give section: Zelle inline chip (`Via Zelle: (410) 900-9111 — RCCG Mercy Court · No fees · Instant`) added between paragraph and buttons. Giving modal: same Zelle strip as above. |
| `_includes/layouts/post.njk`, `_includes/layouts/post-wide.njk` | Same give section + modal changes as static pages above. |
| `admin/preview.js` | **No changes needed.** `GivingSection` is only used for the event-page CMS-driven optional giving block (fields: heading/body/url/button_text). Zelle is hardcoded into static sections, not a new CMS field. Standing sync rule satisfied by review (no structural change to any CMS-driven field). |

### Not changed
- `tehillah-voices.html` — has no give section or modal; only nav "Give" button and footer "Give Online" link pointing to `/give.html`. Visitors reach the updated give page naturally.
- `_includes/layouts/event-page.njk` — the optional `{% if giving %}` block is CMS-editor-controlled per event. No hardcoded Zelle added; the event-specific giving URL (usually `/give.html`) routes visitors to the primary give page which now shows Zelle first.
- `admin/config.yml` — no new CMS fields added.
- Both Zeffy embeds (`general-giving-25`, `building-project-3`) — completely unchanged.

### Zelle details (hardcoded, not CMS-managed)
- **Recipient:** RCCG Mercy Court
- **Phone:** (410) 900-9111
- Note: Zelle has no embeddable form; instructions-based approach is the correct pattern.

---

## CMS Editor Mode Toggle Patch (2026-08-09) — commit `99d2ea2`

### Problem
Two issues with the markdown body field's Rich Text / Markdown mode toggle:
1. **UX clarity**: No visual indication of which mode is currently active; toggle buttons look identical regardless of state.
2. **Naming**: "Markdown" mode label doesn't communicate that it's a raw-source view. User wanted "Source Code" instead.

The root WYSIWYG issue (markdown symbols visible in Rich Text mode) was assessed as a Decap 3.x Slate.js internal behavior — not patchable from `admin/index.html`. Most likely cause was visual confusion about which mode was active. The clarity fix addresses the underlying confusion.

### Fix — `admin/index.html`

**CSS added** (inside existing `<style>` block):
```css
button[data-mc-mode="active"] {
  background: #0a1628 !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  border-radius: 4px !important;
  padding: 2px 10px !important;
  box-shadow: 0 1px 3px rgba(10,22,40,0.35) !important;
  opacity: 1 !important;
}
button[data-mc-mode=""] {
  opacity: 0.4 !important;
  font-weight: 400 !important;
}
```

**Script added** (new `<script>` block after `preview.js`):

A `MutationObserver` IIFE that:
1. Scans for "Rich Text" / "Markdown" button pairs by text-content matching (version-resilient — does not target Decap internal class names)
2. Renames the Markdown button to "Source Code" by replacing its text node (preserves any icon/SVG siblings)
3. Sets `data-mc-mode="active"` on the active button and `data-mc-mode=""` on the inactive button — CSS targets these attributes
4. Applies monospace font to the editor textarea when Source Code mode is active (120ms delay to let Decap render the textarea after the switch)
5. Uses click capture phase + `aria-pressed` observer as two independent signals to keep the attribute accurate across Decap re-renders

**`_mcModePatch` flag**: Set on button DOM nodes to prevent double-patching when MutationObserver fires repeatedly.

**`findEditorArea(startEl)`**: Traverses up to 12 DOM levels from the toggle button searching for `textarea`, `.CodeMirror-code`, or `.cm-content` to locate the editor element for monospace styling.

### Design decision
Never targets Decap internal class names — uses text-content matching + custom `data-mc-mode` attributes only. Resilient to Decap version bumps via `@^3.0.0` CDN range.

---

## Total Commitment Blog Post — Fixes (2026-08-09) — commit `70374b9`

### Post
Title: "TOTAL COMMITMENT TO GOD: 5 BIBLICAL KEYS FROM ABRAHAM AND ISAAC"
File: `src/blog-posts/total-commitment.md`
Hero image: `/assets/images/cms-uploads/sunrise-mountain-hike-stockcake.jpg`
Date: 2026-08-09 | Author: Dr. John Itakpe | Category: inspiration | `featured: true`

### Bug 1 — Mangled filename/URL (fixed)

**Root cause:** CMS `slug` field was set to `/blog-posts/total-commitment` (with collection path prefix). Decap's `slug: "{{fields.slug}}"` template converts slashes to hyphens when creating the filename → produced `blog-posts-total-commitment.md`.

**Effect:** Live URL was `/blog-posts/blog-posts-total-commitment.html` instead of `/blog-posts/total-commitment.html`.

**Fix:**
```bash
git mv src/blog-posts/blog-posts-total-commitment.md src/blog-posts/total-commitment.md
```
Frontmatter `slug` corrected: `/blog-posts/total-commitment` → `total-commitment`.

**Standing rule:** When creating blog posts via CMS, enter only the bare slug (e.g. `total-commitment`), never a path-prefixed value. The `blog-posts.json` permalink template handles the path.

### Bug 2 — Post absent from blog listing (fixed)

**Root cause at the time:** `blog.html` is in `eleventyConfig.ignores` — it's a static file, not an Eleventy template. New posts weren't appearing there automatically.

**Fix at the time:** Article card manually added to `#blog-grid` in `blog.html`.

**⚠️ Standing rule SUPERSEDED (2026-08-09):** `blog.njk` is the actual live Eleventy template that generates `_site/blog.html`. It already dynamically loops over `collections.posts` for both the featured post and the full grid — new posts appear automatically with no manual HTML edits. The old `blog.html` static file is Eleventy-ignored and is NOT the live page. Manual card additions to `blog.html` are no longer needed or effective. See "Blog Page CMS Integration (2026-08-09)".

### Bug 3 — Hero image broken in CMS editor and preview (not a code bug)

**Root cause:** GitHub Pages deployment timing. The image file was committed in the same session. Decap's image widget loads images from the deployed live site URL; the preview iframe similarly loads from the live origin. Until GitHub Pages finishes rebuilding (~2–10 min), neither can serve the file.

**Resolution:** Image file and frontmatter reference are both correct. Will display automatically after Pages builds and the editor refreshes `/admin/`.

### Note on `featured: true`
The post has `featured: true` in frontmatter. The Featured Post section at the top of `blog.html` still shows the Bible study app article — it is hardcoded (static file). Update `blog.html`'s featured section if this post should be promoted.

---

## Three-Layer Blog Post Quality Prevention (2026-08-09) — commits `26cd103`, `d4fb46f`

### Context
Seven issues found on the "Total Commitment to God" post at publish time (broken placeholder links, numbered list items used as headings, missing SEO title suffix, FAQ heading inconsistency, wrong image filename, no structured data, duplicate bullet). All were content-authoring or template gaps that would recur on every future post without systematic guardrails.

### Layer 1 — Template auto-fixes (`_includes/layouts/post.njk`, `_includes/layouts/post-wide.njk`)

**Auto-append "| Mercy Court" title suffix:**
Template computes `_seoTitle` via `{% set %}` block: appends suffix only if missing (idempotent — existing posts with the suffix are unchanged). Applied to `<title>`, `og:title`, and `twitter:title`.

```nunjucks
{% set _seoTitle %}{% if " | Mercy Court" in seo_title %}{{ seo_title }}{% else %}{{ seo_title }} | Mercy Court{% endif %}{% endset %}
```

**`article h3` and `article h4` CSS added** (immediately after `article h2` rule):
```css
article h3 {
    font-family: 'Anton', sans-serif;
    font-size: clamp(1.1rem, 2.2vw, 1.35rem);
    text-transform: uppercase;
    color: #111827;
    letter-spacing: -0.015em;
    margin-top: 2rem;
    margin-bottom: 0.75rem;
    line-height: 1.25;
}
article h4 {
    font-family: 'Lato', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
}
```
Without these rules, FAQ `###` sub-headings rendered as browser-default text (no Anton font, no brand styling).

**Meta Pixel noscript `<img>` fixed in both templates:** added `alt=""` (correct for tracking pixels per HTML spec; was triggering the new linter).

### Layer 2 — CMS authoring guidance (`admin/config.yml`)

**`note` widget added** as the first field in the posts collection fields list — always visible when an editor opens a blog post:
```yaml
- widget: note
  name: writing_guide
  label: "📝 Writing Guide"
  hint: |
    HEADINGS — Use ## for major sections, ### for sub-headings (FAQ questions). No numbered lists as section headers.
    LINKS — Use [link text](url) syntax. Never leave placeholder text like (link to mercycourt.org/...).
    SEO TITLE — Must end with | Mercy Court.
    IMAGE — Rename file descriptively before uploading (e.g. total-commitment-hero.jpg).
    FAQ SCHEMA — Populate the FAQ field below to auto-generate structured data.
```

**Improved hints on:**
- `seo_title`: format + "| Mercy Court" requirement explicitly stated
- `body`: `##` heading convention + `[text](url)` link syntax
- `hero_image`: file-naming convention added to existing size hint

### Layer 3 — Eleventy build-time linter (`.eleventy.js`)

`addTransform("blog-post-lint", ...)` runs on every `blog-posts/*.html` built file. Warnings only — never fails the build or modifies output.

Checks:
1. `(link to ` — placeholder link text left in post body
2. `<img>` tags missing `alt=` attribute
3. `<title>` not containing `| Mercy Court`

Warnings appear in the `npm run build` console output before the deploy. Current baseline: zero warnings across all 5 posts.

### Standing rules (standing since this session)
- Never write numbered lists (`1. **Bold:**`) for section headers — use `## Section Title` headings.
- All FAQ questions must be `###` under a `##` parent heading.
- `seo_title` must end with `| Mercy Court` (template enforces it regardless, but keep frontmatter correct).
- Image filenames must be descriptive before upload — no stock photo names, no `IMG_` prefixes.

---

## Baltimore Community Outreach Post — Fixes (2026-08-09) — commit `81394c7`

### Post
Title: "FREE FOOD, NO STIGMA: INSIDE MERCY COURT'S YEAR-ROUND COMMUNITY OUTREACH"
File: `src/blog-posts/baltimore-community-outreach-food-pantry.md`
Hero: `/assets/images/cms-uploads/outreach-team-food-distribution-05.jpg`
Date: 2026-08-09 | Author: Bukola Daramola | Category: events | `featured: true` | `community_impact: true`

### 7 issues fixed

1. **Duplicate URL** — CMS created filename `blog-posts-baltimore-community-outreach-food-pantry.md` (slug field had a leading `/`). URL was `/blog-posts/blog-posts-...`. Fixed: `git mv` → `baltimore-community-outreach-food-pantry.md`; slug field corrected to bare slug (no slash).
2. **SEO title double-append** — `seo_title` ended with `| RCCG Mercy Court`, which doesn't match the `" | Mercy Court"` check → template would append again. Fixed: title updated to `| Mercy Court`; template check widened to `"| Mercy Court" in seo_title or "| RCCG Mercy Court" in seo_title`.
3. **Author note in body** — `(link with UTM tracking, see below)` leaked into article body. Removed; plain-text URL converted to markdown link.
4. **Weak hero alt text** — `"Landscape photo people under a tent with items"` → descriptive text referencing Mercy Court volunteers.
5. **excerpt was editorial meta** — `"A News article for mercycourt.org…"` replaced with reader-facing preview sentence.
6. **FAQ answer 3** — `"their Court's"` → `"Mercy Court's"`.
7. **Absolute URLs in body** — `https://mercycourt.org/events/...` and `https://mercycourt.org/community-impact` → relative paths.

### Template fixes (same commit)

- **FAQPage JSON-LD + visual FAQ rendering:** Template previously emitted only JSON-LD. Added a visible FAQ section (`<div class="mt-12 bg-gray-50 rounded-lg p-8">`) rendered after `{{ content | safe }}` for all posts with `faq` frontmatter. The CMS `faq` field hint was updated to correctly state that FAQ now renders both visually and as JSON-LD.
- **`&` double-encoding fix:** The `_seoTitle` set-block encodes `&` → `&amp;` on first pass; `{{ _seoTitle }}` was encoding again to `&amp;amp;`. Fixed: `{{ _seoTitle | safe }}` on all three output locations (title, og:title, twitter:title). Result: `&amp;` in HTML → browser renders `&` correctly.

### CMS guidance fixes (same commit)

- **Slug field hint** updated: explicitly says "no leading slash" with a negative example (`/baltimore-...` is wrong).
- **FAQ field hint** corrected: "renders a visible FAQ section... AND adds FAQPage structured data".

---

## Blog Page CMS Integration (2026-08-09) — commit `d5e687e`

### Context — two blog files exist; only one is live

| File | Role | Eleventy |
|------|------|----------|
| `blog.njk` | **Live template** — generates `_site/blog.html`; dynamically loops over `collections.posts` for featured post and full grid | Processed (permalink: `/blog.html`) |
| `blog.html` | **Ignored static file** — old pre-Eleventy version kept for historical reference | In `eleventyConfig.ignores` — NOT served to users |

`blog.html` was previously (incorrectly) assumed to be the live page. All changes to the blog listing must be made in `blog.njk`.

### What was already dynamic in `blog.njk` (no changes needed)

- **Featured post:** `{%- set featuredPost = collections.posts | where("data.featured", true) | first %}` — auto-picks the newest post with `featured: true`. Falls back to `collections.posts | first` if none is flagged.
- **Blog grid:** `{%- set gridPosts = collections.posts | except(featuredPost.url) %}` → loops over all remaining posts, rendering cards with image, category badge, date, title, excerpt, and "Read More" link.

### What was added (hero and section intro editable via CMS)

**`blog.njk` frontmatter added:**
```yaml
hero:
  image: /assets/images/2026/community-outreach/outreach-community-event-02.jpg
  image_alt: Mercy Court Community
  headline: Welcome to
  headline_highlight: Mercy Court Blog
  tagline: We continue to make an impact in Baltimore through outreach, food drives, and neighborhood partnerships.
section:
  heading: "News &"
  heading_highlight: Updates
  description: Stay connected with the latest from Mercy Court — stories, announcements, and articles that impact our community.
```

Hero `src`, `alt`, headline parts, and tagline; section heading parts and description — all replaced with `{{ hero.* }}` / `{{ section.* }}` variables. `{{ section.heading | safe }}` used to prevent `&` double-encoding.

**`admin/config.yml` — Blog entry added under `main-pages`:**
- `file: "blog.njk"`
- `note` widget at top explaining: how to swap the featured post (toggle "Featured Post" ON in Blog Posts), that the grid is automatic
- `hero` object: image, image_alt, headline, headline_highlight, tagline
- `section` object (collapsed): heading, heading_highlight, description

### Nunjucks `{#` gotcha — relevant to blog.njk

`blog.njk` already had `{ #giving-modal` (with space) in the giving-modal media query, avoiding the Nunjucks comment-parse conflict. Any future CSS edits to this file must maintain that space.

### Standing rule update

**Manually adding cards to `blog.html` is no longer needed.** New blog posts appear automatically in the live blog grid because `blog.njk` loops over `collections.posts`. To feature a specific post at the top: toggle `featured: true` on that post in the Blog Posts CMS collection (and turn it off on the previous featured post).

---

## Dynamic Community Impact News Section (2026-08-09) — commit `49ec1de`

### Problem
The "Latest News — From the Community Impact Team" section in `community-impact.html` (Section 11) was 100% static HTML with a single placeholder card ("Stay Tuned"). No mechanism existed to feature community-impact articles there without manual HTML edits.

### Solution — `community_impact` boolean frontmatter flag

A new `community_impact: true` field on any blog post opt-ins it to the community-impact news section. The section is now a Nunjucks loop:

```nunjucks
{% set communityPosts = collections.posts | where("data.community_impact", true) | limit(3) %}
```

Uses the existing `where` and `limit` filters — no new Eleventy config needed. `community-impact.html` already had `templateEngineOverride: njk`, so `collections.posts` was accessible with zero config changes.

**Fallback:** `{% if communityPosts.length %}` → posts loop; `{% else %}` → original "Stay Tuned" placeholder. The section never shows an empty grid.

**Cap:** 3 most-recent posts (newest-first, inherited from collection sort order).

### CMS widget added (`admin/config.yml`)

```yaml
- { label: "Community Impact Feature", name: "community_impact", widget: "boolean", default: false,
    hint: "Turn ON to feature this post in the 'Latest News' section on the Community Impact page." }
```

Added after the `featured` field. Default `false` — opt-in only; no existing posts affected.

Writing guide note widget also updated with a `COMMUNITY IMPACT` line explaining the toggle.

### Baltimore outreach post flagged

`community_impact: true` set on `src/blog-posts/baltimore-community-outreach-food-pantry.md` — it appears immediately in the community-impact page news section post-deploy.

### Blog post frontmatter schema (updated)

```yaml
title, seo_title, seo_description, date, author, category (news|events|inspiration),
featured (bool), community_impact (bool, default false),
hero_image, hero_image_alt, excerpt, read_time,
faq (optional list: question/answer — renders visually + FAQPage JSON-LD),
scripture_references (optional list)
```

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
