// Cloudflare Pages middleware
// Returns 410 Gone for retired WordPress-style permalink URLs (/slug/)
// that would otherwise resolve as 404s. These are old blog posts that
// are intentionally removed — 410 tells Google to drop them from the index.
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // Match root-level slug with trailing slash: /some-post-slug/
  // This is the old WordPress permalink format used by retired posts.
  // Current site pages are served without trailing slashes at the root level.
  if (/^\/[a-z0-9][a-z0-9-]*\/$/.test(path)) {
    const upstream = await context.next();
    if (upstream.status === 404) {
      return new Response(goneHtml(path), {
        status: 410,
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      });
    }
    return upstream;
  }

  return context.next();
}

function goneHtml(path) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Content Removed | RCCG Mercy Court</title>
  <meta name="robots" content="noindex">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Lato',sans-serif;background:#0A0A0A;color:#fff;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 24px}
    .label{color:#D95A2B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;margin-bottom:20px}
    h1{font-size:clamp(2rem,6vw,4rem);font-weight:900;text-transform:uppercase;letter-spacing:-.02em;line-height:1;margin-bottom:20px}
    p{color:#6b7280;font-size:1.0625rem;line-height:1.6;max-width:440px;margin-bottom:36px}
    .btn{display:inline-block;background:#D95A2B;color:#fff;padding:12px 32px;border-radius:9999px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;text-decoration:none}
    .btn:hover{background:#C04E25}
  </style>
  <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap" rel="stylesheet">
</head>
<body>
  <p class="label">410 — Content Permanently Removed</p>
  <h1>This content<br>has been removed</h1>
  <p>This page no longer exists and has been intentionally retired. It will not be restored.</p>
  <a href="/" class="btn">Return to Homepage</a>
</body>
</html>`;
}
