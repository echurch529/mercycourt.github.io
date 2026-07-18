// Decap CMS — GitHub OAuth handler for RCCG Mercy Court
// Deploy as Cloudflare Worker named: oauth-mercycourt
// Required secrets: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': 'https://mercycourt.org',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    })
  }

  if (url.pathname === '/auth') return handleAuth(url)
  if (url.pathname === '/callback') return handleCallback(url)

  return new Response('Not found', { status: 404 })
}

// Step 1: redirect browser to GitHub OAuth authorization page
function handleAuth(url) {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    scope: 'repo,user',
    state: url.searchParams.get('site_id') || url.searchParams.get('state') || '',
  })
  return Response.redirect(
    `https://github.com/login/oauth/authorize?${params}`,
    302
  )
}

// Step 2: GitHub redirects here with ?code=...; exchange it for a token
async function handleCallback(url) {
  const code = url.searchParams.get('code')
  if (!code) return errorPage('Missing code parameter from GitHub.')

  let tokenData
  try {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    })
    tokenData = await res.json()
  } catch (err) {
    return errorPage('Failed to connect to GitHub token endpoint.')
  }

  if (tokenData.error) {
    return errorPage(tokenData.error_description || tokenData.error)
  }

  return postMessagePage(
    `authorization:github:success:${JSON.stringify({
      token: tokenData.access_token,
      provider: 'github',
    })}`
  )
}

// Renders the popup page that sends the token back to Decap CMS via postMessage
function postMessagePage(message) {
  return new Response(
    `<!DOCTYPE html>
<html>
<body>
<script>
(function () {
  function receiveMessage(e) {
    window.opener.postMessage(${JSON.stringify(message)}, e.origin);
  }
  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:github", "*");
})();
</script>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html;charset=UTF-8' } }
  )
}

function errorPage(detail) {
  return postMessagePage(`authorization:github:error:${JSON.stringify(detail)}`)
}
