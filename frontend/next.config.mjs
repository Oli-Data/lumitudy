// Preserve the deployed API origin while Vercel's old variable is renamed.
const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || '/api'
const apiTarget = (process.env.LUMITUDY_API_TARGET || process.env.LUMITUDY_PREVIEW_API_TARGET || 'http://127.0.0.1:8000').replace(/\/$/, '')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // FastAPI distinguishes /upload/ and /sets/ from slashless endpoints.
  // Preserve them instead of redirecting POSTs or exposing the upstream URL.
  skipTrailingSlashRedirect: true,
  // Generation can take two 90-second provider attempts; Next's default
  // 30-second proxy timeout would cut off local/self-hosted requests early.
  experimental: { proxyTimeout: 240000 },
  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_PUBLIC_LOCAL_API: process.env.NEXT_PUBLIC_LOCAL_API || (
      process.env.NODE_ENV === 'development' && apiUrl === '/api' ? 'true' : 'false'
    ),
  },
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/observatory.html', destination: '/', permanent: true },
      { source: '/study.html', destination: '/study', permanent: true },
    ]
  },
  async rewrites() {
    // Local/self-hosted HTTP and WebSocket proxy. On Vercel, use the direct,
    // same-site API origin for both transports (https://api.lumitudy.com).
    return apiUrl === '/api'
      ? [
        { source: '/api/:path*/', destination: `${apiTarget}/:path*/` },
        { source: '/api/:path*', destination: `${apiTarget}/:path*` },
      ]
      : []
  },
}

export default nextConfig
