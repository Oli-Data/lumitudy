export function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL || '/api'
}

export function getGameSocketUrl(code, username, origin) {
  // HTTP and WebSockets must use the same origin/path to share the session cookie.
  const base = new URL(getApiUrl(), origin)
  base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:'
  base.pathname = `${base.pathname.replace(/\/$/, '')}/game/ws/${encodeURIComponent(code)}/${encodeURIComponent(username)}`
  base.search = ''
  base.hash = ''
  return base.href
}
