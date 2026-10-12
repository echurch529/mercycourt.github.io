# Working rules for Mercy Court repos

1. **One commit per task.** Group all file changes for a task into a single commit with a clear message. Never push one commit per file; every push triggers a Cloudflare build.
2. **Build before pushing.** Run the full production build locally from a clean state (`mercycourt.github.io`: `npx @11ty/eleventy`; `mercycourt-dmu-hub`: `npm run build`) and confirm it passes with no errors before every push.
3. **Verify live before reporting done.** After pushing, confirm the Cloudflare Pages deployment for that commit succeeded and is the ACTIVE production deployment, then check the affected live URLs. Never report a fix as live based on a local build alone.
4. **Plan first for bigger changes.** For anything touching more than 2 files, the nav, redirects, the CMS config, or the database, send a plan (files to change and approach) and wait for approval.
5. **Don't invent content.** Never make up dates, bios, titles, quotes or descriptions that will appear on the site. Leave the field blank and ask.
6. **Respect the CMS.** Before editing any content file that Decap manages (blog posts, event pages, main pages), check for open Decap pull requests (`cms/...` branches) on that file and warn, because publishing an older draft overwrites changes.
7. **Don't close, merge or delete pull requests or branches without asking first.**
8. **Test scope.** For layout changes, check 375px, 768px and 1440px, and the Decap preview pane where relevant.
9. **SEO check runs in --strict mode during every Cloudflare build (`npm run build`).** Any SEO error (missing `<title>`, missing/multiple `<h1>`, linked image with empty or absent `alt`) causes the build to exit 1 and the deploy is skipped — the previous version stays live. When a published change does not appear on the site, check the Cloudflare Pages build log first. Each error message includes a "Fix: CMS → …" line that tells an editor exactly where to go. Warnings (title/description length, missing og:image) are logged but never block the build.
