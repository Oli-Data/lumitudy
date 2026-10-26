import axios from 'axios'

// Keep credentials and CSRF headers confined to the application's API client.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', withCredentials: true })
let csrfToken = null
let pendingSession = null

export function setSession(data) {
  csrfToken = data?.csrf_token || null
}

export async function getSession() {
  if (!pendingSession) {
    pendingSession = api.get('/auth/session', { timeout: 15000 }).then(({ data }) => {
      setSession(data)
      return data
    }).finally(() => { pendingSession = null })
  }
  return pendingSession
}

api.interceptors.request.use(async config => {
  // Call sites use relative API paths; do not forward cookies/CSRF to arbitrary URLs.
  if (!config.url?.startsWith('/') || config.url.startsWith('//')) {
    throw new Error('Expected a relative Lumitudy API path.')
  }
  if (!['get', 'head', 'options'].includes((config.method || 'get').toLowerCase())) {
    if (!csrfToken) await getSession()
    config.headers['X-CSRF-Token'] = csrfToken
  }
  return config
})

api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401) {
    setSession(null)
    if (error.config?.url !== '/auth/login') window.dispatchEvent(new Event('lumitudy:session-expired'))
  }
  // Never retry mutations automatically: an upload or score may already have completed.
  return Promise.reject(error)
})

export default api
