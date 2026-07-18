# Decap CMS Project State — RCCG Mercy Court

**Site:** mercycourt.org | **Repo:** echurch529/mercycourt.github.io | **Hosting:** Cloudflare Pages

---

## Phases

| Phase | Status | Notes |
|-------|--------|-------|
| 0 — Backup | ✅ Done | User has backup ZIP |
| 1 — Eleventy build | ✅ Done | `npm run build` → `_site/` clean, 18 files |
| 2 — Cloudflare Pages build settings | ⏳ User action | See instructions below |
| 3 — Decap CMS admin panel | ✅ Done | `admin/index.html` + `admin/config.yml` created |
| 4 — GitHub OAuth Worker | ⏳ User action | Worker script ready at `cloudflare-worker/oauth-worker.js` — deploy steps below |
| 5 — Access control | ❌ Pending | GitHub branch protection + Cloudflare Zero Trust |
| 6 — Delete old HTML blog posts | ❌ Pending | After verifying live site |

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

## Phase 2 — Cloudflare Pages Build Settings (USER ACTION)

Cloudflare dashboard → Pages → mercycourt.github.io project → Settings → Builds & deployments:
- **Build command:** `npm ci && npm run build`
- **Build output directory:** `_site`
- **Environment variables → Production:** `NODE_VERSION = 18`

Then trigger a deployment (push a commit or manual trigger in dashboard).

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
  base_url: https://oauth.mercycourt.workers.dev

publish_mode: editorial_workflow
media_folder: "assets/images/cms-uploads"
public_folder: "/assets/images/cms-uploads"
```

Collection fields: `title, seo_title, seo_description, date (datetime, YYYY-MM-DD), author, category (select: news/events/inspiration), featured (boolean), hero_image (image), hero_image_alt, excerpt (text), read_time (number), body (markdown), scripture_references (list, optional)`

---

## Phase 4 — OAuth Worker (⏳ USER ACTION)

Worker script: `cloudflare-worker/oauth-worker.js`

### Step A — Create GitHub OAuth App
GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App:
- Application name: `RCCG Mercy Court CMS`
- Homepage URL: `https://mercycourt.org`
- Authorization callback URL: `https://oauth.mercycourt.workers.dev/callback`

Copy the **Client ID** and generate + copy the **Client Secret**.

### Step B — Create Cloudflare Worker
Cloudflare dashboard → Workers & Pages → Create → Worker:
- Name: `oauth-mercycourt` (sets URL to `oauth.mercycourt.workers.dev`)
- Replace default code with the full contents of `cloudflare-worker/oauth-worker.js`
- Deploy

### Step C — Add Secrets
Worker → Settings → Variables → Environment Variables → Add variable (as **Secret**):
- `GITHUB_CLIENT_ID` = (paste Client ID from Step A)
- `GITHUB_CLIENT_SECRET` = (paste Client Secret from Step A)

### Step D — Validate
- Visit `https://oauth.mercycourt.workers.dev/auth` — should redirect to GitHub OAuth page
- Visit `https://mercycourt.org/admin/` → Login with GitHub → complete auth → Decap panel loads
- Create a test draft post → confirm branch `cms/posts/...` appears in the GitHub repo
- Delete the test draft

---

## Phase 5 — Access Control (PENDING)

- GitHub: Settings → Branches → rule on `main`: require PR + 1 approval, dismiss stale. Do NOT include administrators.
- Cloudflare Zero Trust → Access → Applications → Self-hosted: `mercycourt.org/admin/*`, allow specific emails, 24h session, one-time PIN auth.

---

## Phase 6 — Delete Old Blog HTML (PENDING)

Files to delete after verifying live output:
- `blog-posts/the-power-of-your-circle.html`
- `blog-posts/repositioned-for-greatness.html`
- `blog-posts/the-compound-effect.html`
- `blog-posts/mercy-court-launches-believing-bible-study-app.html`

---

## Tracking IDs
- GA4: `G-JWGVNRLKJL`
- Meta Pixel: `1027268596866855`
- Mailchimp form action: `https://mercycourt.us2.list-manage.com/subscribe/post?u=1f6d34239bf35c1b0512b77c8&id=888af1f4b9&f_id=0060c5e1f0`
- Zeffy embed: `https://www.zeffy.com/en-US/embed/donation-form/general-giving-25`
