// Exercise both development servers over HTTP without reading real private data.
import { createServer } from 'vite'
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'

const root = process.cwd()
await mkdir(path.join(root, '.preview-data'), { recursive: true })
const directory = await mkdtemp(path.join(root, '.preview-data', 'privacy-check-'))
const fixture = path.join(directory, 'private.txt')
await writeFile(fixture, 'non-secret test fixture')
try {
  for (const configFile of ['vite.config.js', 'vite.observatory.config.js']) {
    const server = await createServer({
      configFile: path.join(root, configFile), logLevel: 'silent',
      server: { host: '127.0.0.1', port: 0, open: false },
    })
    try {
      await server.listen()
      const port = server.httpServer.address().port
      const base = `http://127.0.0.1:${port}`
      const relative = '/' + path.relative(root, fixture)
      for (const pathname of [relative, `${relative}?raw`, '/@fs' + fixture]) {
        const response = await fetch(base + pathname)
        assert.equal(response.status, 403, `${configFile} must block private preview files`)
        await response.body?.cancel()
      }
      const response = await fetch(base + '/observatory.html')
      assert.equal(response.status, 200, 'The public preview must remain available')
      await response.body?.cancel()
      console.log(`${configFile}: private files blocked; preview available.`)
    } finally {
      await server.close()
    }
  }
} finally {
  await rm(directory, { recursive: true })
}
