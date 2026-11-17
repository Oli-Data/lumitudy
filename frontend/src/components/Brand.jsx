'use client'

import { StarIcon, SparkIcon, SunIcon, MoonIcon } from './LumitudyIcons'
import ArrowIcon from './ArrowIcon'
import LumitudyFlower from './LumitudyFlower'
import { useSyncExternalStore } from 'react'

function readTheme() { return document.documentElement.dataset.theme === 'night' ? 'night' : 'day' }
function serverTheme() { return 'day' }
function subscribeTheme(notify) {
  const syncStorage = event => {
    if (event.key === 'lumitudy-theme' || event.key === null) {
      document.documentElement.dataset.theme = event.newValue === 'night' ? 'night' : 'day'
      notify()
    }
  }
  window.addEventListener('lumitudy:theme-change', notify)
  window.addEventListener('storage', syncStorage)
  return () => {
    window.removeEventListener('lumitudy:theme-change', notify)
    window.removeEventListener('storage', syncStorage)
  }
}

export function AeroBackdrop() {
  return <div className="aero-scene" aria-hidden="true"><div className="aero-horizon" /><div className="aero-wave wave-one" /><div className="aero-wave wave-two" /><span className="aero-bubble bubble-one" /><span className="aero-bubble bubble-two" /><span className="aero-bubble bubble-three" /><span className="aero-bubble bubble-four" /><span className="aero-bubble bubble-five" /><div className="aero-glint glint-one"><SparkIcon /></div><div className="aero-glint glint-two"><SparkIcon /></div></div>
}

export function Brand() {
  return <div className="brand"><LumitudyFlower /><span>Lumitudy<span className="brand-dot">.</span></span></div>
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, serverTheme)
  function toggleTheme() {
    const next = theme === 'day' ? 'night' : 'day'
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('lumitudy-theme', next) } catch { /* Appearance still works without storage. */ }
    window.dispatchEvent(new Event('lumitudy:theme-change'))
  }
  return <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === 'day' ? 'night' : 'day'} theme`}><span aria-hidden="true">{theme === 'day' ? <MoonIcon /> : <SunIcon />}</span><span>{theme === 'day' ? 'Night' : 'Day'}</span></button>
}

export function StudyIllustration() {
  return <div className="study-illustration" aria-hidden="true">
    <div className="orbit orbit-one" /><div className="orbit orbit-two" />
    <span className="floating-spark spark-one"><StarIcon /></span><span className="floating-spark spark-two"><SparkIcon /></span>
    <div className="illustration-card card-back"><span>01 / A LITTLE CURIOSITY</span><strong>Big ideas.<br />Small steps.</strong><div className="mini-lines"><i /><i /><i /></div></div>
    <div className="illustration-card card-front"><span>02 / A LITTLE PRACTICE</span><strong>Oh, now<br />I get it.</strong><div className="illustration-answer"><span><SparkIcon /></span> Your next lightbulb moment</div></div>
    <span className="floating-note">Made for curious minds <ArrowIcon /></span>
  </div>
}

export function LabFooter() {
  return <footer className="lab-footer"><span>A little curiosity goes a long way.</span><span>Made by <a href="https://co3labs.com">CO³ Labs <ArrowIcon /></a></span></footer>
}
