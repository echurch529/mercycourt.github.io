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

## Tracking IDs
- GA4: `G-JWGVNRLKJL`
- Meta Pixel: `1027268596866855`
- Mailchimp form action: `https://mercycourt.us2.list-manage.com/subscribe/post?u=1f6d34239bf35c1b0512b77c8&id=888af1f4b9&f_id=0060c5e1f0`
- Zeffy embed: `https://www.zeffy.com/en-US/embed/donation-form/general-giving-25`
