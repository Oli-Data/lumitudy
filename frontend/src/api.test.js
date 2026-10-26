import { beforeEach, expect, it, vi } from 'vitest'

let api, getSession, setSession, requests
beforeEach(async () => {
  vi.resetModules()
  ;({default: api, getSession, setSession} = await import('./api'))
  requests = []
  api.defaults.adapter = async config => {
    requests.push(config)
    return { status:200, statusText:'OK', headers:{}, config,
      data:config.url === '/auth/session' ? {user:null,csrf_token:'bootstrap-csrf'} : {} }
  }
})

it('bootstraps once for concurrent writes and sends credentials plus CSRF', async () => {
  await Promise.all([api.post('/upload/',new FormData()), api.delete('/sets/1')])
  expect(requests.filter(r=>r.url === '/auth/session')).toHaveLength(1)
  for (const request of requests) {
    expect(request.withCredentials).toBe(true)
    if (request.method !== 'get') expect(request.headers['X-CSRF-Token']).toBe('bootstrap-csrf')
    expect(request.headers.Authorization).toBeUndefined()
  }
})

it('uses the rotated CSRF token after authentication and resets after logout', async () => {
  await getSession()
  setSession({csrf_token:'rotated-csrf'})
  await api.post('/game/create',{})
  expect(requests.at(-1).headers['X-CSRF-Token']).toBe('rotated-csrf')
  setSession(null)
  await api.post('/auth/login',{})
  expect(requests.filter(r=>r.url === '/auth/session')).toHaveLength(2)
})

it('does not send the session or CSRF header to an arbitrary absolute URL', async () => {
  setSession({csrf_token:'private-csrf'})
  for (const url of ['https://attacker.example/path','//attacker.example/path']) {
    await expect(api.post(url,{})).rejects.toThrow('relative Lumitudy API path')
  }
  expect(requests).toHaveLength(0)
})

it('does not retry a failed mutation, and recovers from an expired bootstrap on the next attempt', async () => {
  setSession({csrf_token:'expired-csrf'})
  let calls = 0
  const adapter = api.defaults.adapter
  api.defaults.adapter = async config => {
    if (++calls === 1) throw {response:{status:401},config}
    return adapter(config)
  }
  await expect(api.post('/auth/login',{})).rejects.toMatchObject({response:{status:401}})
  expect(calls).toBe(1)
  await api.post('/auth/login',{})
  expect(requests[0].url).toBe('/auth/session')
  expect(requests.at(-1).headers['X-CSRF-Token']).toBe('bootstrap-csrf')
})
