// Run against an existing Next dev/start server; never read real private data.
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'

const base = process.argv[2] || 'http://127.0.0.1:3000'
const root = process.cwd()
await mkdir(path.join(root, '.preview-data'), { recursive: true })
const directory = await mkdtemp(path.join(root, '.preview-data', 'privacy-check-'))
const fixture = path.join(directory, 'private.txt')
await writeFile(fixture, 'non-secret test fixture')
async function request(pathname, options = {}) {
  return fetch(new URL(pathname, base), { signal: AbortSignal.timeout(60000), ...options })
}
try {
  const relative = '/' + path.relative(root, fixture)
  for (const pathname of [relative, `${relative}?raw`, '/@fs' + fixture, '/.env.local', '/package.json', '/src/api.js']) {
    const response = await request(pathname)
    assert.equal(response.status, 404, `Next must not serve ${pathname}`)
    assert.ok(!(await response.text()).includes('non-secret test fixture'))
  }
  for (const pathname of ['/', '/study', '/favicon.svg', '/icons.svg']) {
    const response = await request(pathname)
    assert.equal(response.status, 200, `${pathname} must remain available`)
    const body = await response.text()
    if (pathname === '/') {
      assert.ok(body.includes('A little more curious.'), 'The bookshelf must render on the server')
      assert.ok(body.includes('/_next/'), 'The page must load the Next runtime')
    }
  }
  for (const [from, to] of [['/index.html', '/'], ['/observatory.html', '/'], ['/study.html', '/study']]) {
    const response = await request(from + '?from=bookmark', { redirect: 'manual' })
    assert.equal(response.status, 308, 'Old entry URLs must permanently redirect')
    const destination = new URL(response.headers.get('location'), base)
    assert.equal(destination.pathname, to)
    assert.equal(destination.searchParams.get('from'), 'bookmark')
    await response.body?.cancel()
  }
  console.log('Next routes, assets, legacy bookmarks, server rendering, and private-file checks passed.')
} finally {
  await rm(directory, { recursive: true })
}
