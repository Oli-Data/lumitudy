import { afterEach, expect, it, vi } from 'vitest'
import { getApiUrl, getGameSocketUrl } from './config'

afterEach(() => vi.unstubAllEnvs())

it('uses one same-origin API path for local HTTP and WebSocket sessions', () => {
  vi.stubEnv('NEXT_PUBLIC_API_URL', '')
  expect(getApiUrl()).toBe('/api')
  expect(getGameSocketUrl('ABC123', 'a reader', 'http://localhost:3000'))
    .toBe('ws://localhost:3000/api/game/ws/ABC123/a%20reader')
})

it('connects directly to the production API for cookie-authenticated multiplayer', () => {
  vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.lumitudy.com/')
  expect(getApiUrl()).toBe('https://api.lumitudy.com/')
  expect(getGameSocketUrl('ABC123', 'reader/name', 'https://lumitudy.com'))
    .toBe('wss://api.lumitudy.com/game/ws/ABC123/reader%2Fname')
})
