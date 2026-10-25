import ArrowIcon from './ArrowIcon'
import { useEffect, useState } from 'react'

export function AeroBackdrop() {
  return <div className="aero-scene" aria-hidden="true"><div className="aero-horizon" /><div className="aero-wave wave-one" /><div className="aero-wave wave-two" /><span className="aero-bubble bubble-one" /><span className="aero-bubble bubble-two" /><span className="aero-bubble bubble-three" /><span className="aero-bubble bubble-four" /><span className="aero-bubble bubble-five" /><div className="aero-glint glint-one">✦</div><div className="aero-glint glint-two">✦</div></div>
}

export function Brand() {
  return <div className="brand"><span className="brand-mark" aria-hidden="true">✳</span><span>Lumitudy<span className="brand-dot">.</span></span></div>
}

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'day')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('lumitudy-theme', theme) } catch { /* Appearance still works without storage. */ }
  }, [theme])
  return <button className="theme-toggle" onClick={() => setTheme(theme === 'day' ? 'night' : 'day')} aria-label={`Switch to ${theme === 'day' ? 'night' : 'day'} theme`}><span aria-hidden="true">{theme === 'day' ? '☾' : '☀'}</span><span>{theme === 'day' ? 'Night' : 'Day'}</span></button>
}

export function StudyIllustration() {
  return <div className="study-illustration" aria-hidden="true">
    <div className="orbit orbit-one" /><div className="orbit orbit-two" />
    <span className="floating-spark spark-one">✳</span><span className="floating-spark spark-two">✦</span>
    <div className="illustration-card card-back"><span>01 / A LITTLE CURIOSITY</span><strong>Big ideas.<br />Small steps.</strong><div className="mini-lines"><i /><i /><i /></div></div>
    <div className="illustration-card card-front"><span>02 / A LITTLE PRACTICE</span><strong>Oh, now<br />I get it.</strong><div className="illustration-answer"><span>✦</span> Your next lightbulb moment</div></div>
    <span className="floating-note">Made for curious minds <ArrowIcon /></span>
  </div>
}

export function LabFooter() {
  return <footer className="lab-footer"><span>A little curiosity goes a long way.</span><span>Made by <a href="https://co3labs.com">CO³ Labs <ArrowIcon /></a></span></footer>
}
