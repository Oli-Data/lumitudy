import { createContext, useContext, useState, useEffect } from 'react'
import api, { getSession, setSession } from '../api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [identity, setIdentity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    let active = true
    // Remove credentials left by the former bearer-token implementation.
    try { ['token', 'username', 'friend_code'].forEach(key => localStorage.removeItem(key)) } catch { /* Storage is optional. */ }
    const expired = () => { setIdentity(null); setAuthError('Your session ended. Please sign in again.') }
    window.addEventListener('lumitudy:session-expired', expired)
    getSession().then(data => {
      if (active) { setIdentity(data.user); setAuthError(null) }
    }).catch(() => {
      if (active) setAuthError('We could not check your account. Please retry when the connection is back.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false; window.removeEventListener('lumitudy:session-expired', expired) }
  }, [])

  async function authenticate(path, values) {
    const { data } = await api.post(path, values)
    setSession(data)
    setIdentity(data.user)
    setAuthError(null)
  }

  async function logout() {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await api.post('/auth/logout')
      setSession(null)
      setIdentity(null)
      setAuthError(null)
    } catch (error) {
      if (error.response?.status === 401) {
        setSession(null)
        setIdentity(null)
      } else {
        setAuthError('Logout did not finish. Check your connection and try again; your session is still active.')
      }
    } finally { setLoggingOut(false) }
  }

  return <AuthContext.Provider value={{
    user: identity?.email || null, username: identity?.username || null,
    friendCode: identity?.friend_code || null, loading, authError, loggingOut, logout,
    login: (email, password) => authenticate('/auth/login', { email, password }),
    register: (email, username, password) => authenticate('/auth/register', { email, username, password }),
  }}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }
