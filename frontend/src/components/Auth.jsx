import { SparkIcon } from './LumitudyIcons'
import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { Brand, ThemeToggle, StudyIllustration, LabFooter } from "./Brand"


function Auth() {
  const { login, register } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      if (isLogin) {
        await login(email, password)
      } else {
        if (!username.trim()) {
          setError("Username is required")
          setLoading(false)
          return
        }
        await register(email, username, password)
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <header className="header"><Brand /><div className="header-actions"><span className="lab-signature">A CO³ LABS PROJECT</span><ThemeToggle /></div></header>
      <main className="auth-layout">
        <section className="auth-story">
          <span className="eyebrow">LESS SCROLLING. MORE LIGHTBULB MOMENTS.</span>
          <h1>Meet your{" "}<br /><em>brighter side</em>{" "}<br />of studying.</h1>
          <p>Turn your textbooks into something you can play with. Flashcards, quizzes, and study sessions that start with your own material.</p>
          <StudyIllustration />
        </section>
        <section className="auth-card" aria-labelledby="auth-heading">
          <span className="card-sticker" aria-hidden="true"><SparkIcon /></span>
          <span className="eyebrow">A LITTLE EVERY DAY</span>
          <h2 id="auth-heading">{isLogin ? 'Welcome back, curious mind.' : 'Your next chapter starts here.'}</h2>
          <p className="auth-tagline">{isLogin ? 'Pick up where your curiosity left off.' : 'Make room for a new way to learn.'}</p>
          <div className="auth-tabs" aria-label="Account action">
            <button type="button" className={`auth-tab ${isLogin ? 'active' : 'inactive'}`} aria-pressed={isLogin} onClick={() => { setIsLogin(true); setError(null) }}>Log in</button>
            <button type="button" className={`auth-tab ${!isLogin ? 'active' : 'inactive'}`} aria-pressed={!isLogin} onClick={() => { setIsLogin(false); setError(null) }}>Sign up</button>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); handleSubmit() }}>
            <label htmlFor="auth-email">Email address</label>
            <input id="auth-email" className="auth-input" type="email" autoComplete="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            {!isLogin && <><label htmlFor="auth-username">Username</label><input id="auth-username" className="auth-input" type="text" autoComplete="username" placeholder="What should we call you?" required value={username} onChange={(e) => setUsername(e.target.value)} /></>}
            <label htmlFor="auth-password">Password</label>
            <input id="auth-password" className="auth-input" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder="Your password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="auth-btn" type="submit" disabled={loading}>{loading ? 'One moment…' : isLogin ? 'Let’s study →' : 'Create your account →'}</button>
            {error && <p className="auth-error" role="alert">{error}</p>}
          </form>
          <div className="auth-note"><span aria-hidden="true">◈</span><p>Your material. Your starting point.<br /><span>Bring a PDF, DOCX, or EPUB.</span></p></div>
          <p className="auth-footer">AI-assisted practice, with source passages to help you check your understanding.</p>
        </section>
      </main>
      <div className="feature-strip"><span><b>01</b> Bring your textbook</span><span><b>02</b> Make it interactive</span><span><b>03</b> Find your study rhythm</span></div>
      <LabFooter />
    </div>
  )
}

export default Auth
