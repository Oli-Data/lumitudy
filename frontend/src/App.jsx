'use client'

import { StarIcon, SparkIcon } from './components/LumitudyIcons'
import { useState, useEffect, useRef } from "react"
import axios from "./api"
import { useAuth } from "./context/AuthContext"
import Upload from "./components/Upload"
import ChapterSelect from "./components/ChapterSelect"
import Auth from "./components/Auth"
import SiteHeader from "./components/SiteHeader"
import ExamMode from "./components/ExamMode"
import FileLibrary from "./components/FileLibrary"
import Friends from "./components/Friends"
import Kahoot from "./components/Kahoot"
import { StudyIllustration, LabFooter } from "./components/Brand"


function SourceQuote({ quote }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ textAlign: "center" }}>
      <button className="source-btn" onClick={() => setShow(!show)}>
        {show ? "Hide Source" : "View Source"}
      </button>
      {show && <div className="source-quote">"{quote}"</div>}
    </div>
  )
}

export default function App({ uploadIntent = false }) {
  const { user, username, friendCode, logout, loading, authError, loggingOut } = useAuth()
  const [fileData, setFileData] = useState(null)
  const [flashcards, setFlashcards] = useState([])
  const [currentCard, setCurrentCard] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [savedSets, setSavedSets] = useState([])
  const [showSaved, setShowSaved] = useState(false)
  const [showFriends, setShowFriends] = useState(false)
  const [examMode, setExamMode] = useState(false)
  const [slideAnim, setSlideAnim] = useState("")
  const [isAnimating, setIsAnimating] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const [kahootMode, setKahootMode] = useState(false)
  const uploadSection = useRef(null)

  useEffect(() => {
    if (uploadIntent && !loading && user) {
      uploadSection.current?.focus({ preventScroll: true })
      uploadSection.current?.scrollIntoView({ block: "start" })
    }
  }, [uploadIntent, loading, user])

  useEffect(() => {
    if (user) fetchSavedSets()
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchSavedSets = async () => {
    try {
      const res = await axios.get(`/sets/`)
      setSavedSets(res.data)
    } catch (err) {
      console.error("Failed to fetch saved sets")
    }
  }

  const navigateCard = (direction) => {
    if (isAnimating) return
    const newIndex = direction === "next"
      ? Math.min(flashcards.length - 1, currentCard + 1)
      : Math.max(0, currentCard - 1)
    if (newIndex === currentCard) return

    setIsAnimating(true)
    setSlideAnim(direction === "next" ? "slide-out-left" : "slide-out-right")

    setTimeout(() => {
      setCurrentCard(newIndex)
      setFlipped(false)
      setSlideAnim(direction === "next" ? "slide-in-left" : "slide-in-right")
      setTimeout(() => {
        setSlideAnim("")
        setIsAnimating(false)
      }, 350)
    }, 350)
  }

  const loadSet = (set) => {
    setFlashcards(set.cards)
    setCurrentCard(0)
    setFlipped(false)
    setShowSaved(false)
    setDropdownOpen(false)
  }

  const deleteSet = async (id) => {
    try {
      await axios.delete(`/sets/${id}`)
      fetchSavedSets()
    } catch (err) {
      console.error("Failed to delete set")
    }
  }

  const account = loading
    ? <button type="button" className="site-account-action" disabled>Checking account…</button>
    : !user
      ? <a className="site-account-action" href="#auth-heading">Log in / Sign up</a>
      : (
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              className="profile-btn"
              aria-expanded={dropdownOpen}
              aria-label="Open account menu"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="profile-avatar">
                {username ? username[0].toUpperCase() : "?"}
              </div>
              <span>{username}</span>
              <span style={{ opacity: 0.4, fontSize: "0.7rem" }}>▾</span>
            </button>

            {dropdownOpen && (
              <div className="dropdown">
                <button
                  className="dropdown-item"
                  onClick={() => { setShowSaved(!showSaved); fetchSavedSets(); setDropdownOpen(false) }}
                >
                  📚 My Sets
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => { setShowFriends(!showFriends); setDropdownOpen(false) }}
                >
                  👥 Friends
                </button>
                <div className="dropdown-divider" />
                <button className="dropdown-item danger" disabled={loggingOut} onClick={logout}>
                  ⎋ Logout
                </button>
              </div>
            )}
          </div>
      )

  return (
      <div className="site-shell study-shell">
        <SiteHeader current="study" mainId="study-workspace" account={account} />
        {loading ? <main id="study-workspace" tabIndex={-1}><p className="study-account-status" role="status">Checking your account…</p></main>
          : !user ? <Auth uploadIntent={uploadIntent} authError={authError} />
          : <>
        <main id="study-workspace" tabIndex={-1}>
        {authError && <p role="alert">{authError}</p>}
        <section className="study-hero">
          <div><span className="eyebrow">YOUR PERSONAL STUDY SPACE</span>
          <h1>My textbooks</h1>
          <p>Bring a chapter. Find your rhythm. Turn your reading into flashcards, quizzes, and a little friendly competition.</p>
          <div className="feature-pills"><span><SparkIcon /> Flashcards</span><span>◈ Practice exams</span><span><StarIcon /> Play together</span></div></div>
          <StudyIllustration />
        </section>
        <div className="workspace-heading"><h2>Let’s get into it.</h2><span>One chapter at a time</span></div>

        {showSaved && (
          <div className="glass-panel">
            <p className="panel-title">Saved Sets</p>
            {savedSets.length === 0 ? (
              <p className="empty-state">No saved sets yet.</p>
            ) : (
              savedSets.map((set) => (
                <div className="saved-set-row" key={set.id}>
                  <div>
                    <span className="set-name">{set.title}</span>
                    <span className="set-meta">{set.cards.length} cards</span>
                  </div>
                  <div className="row-actions">
                    <button className="btn btn-primary" onClick={() => loadSet(set)}>Load</button>
                    <button className="btn btn-danger" onClick={() => deleteSet(set.id)}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {showFriends && <Friends onClose={() => setShowFriends(false)} />}

        <Upload onUpload={setFileData} sectionRef={uploadIntent ? uploadSection : undefined} />
        <FileLibrary onFileSelect={setFileData} />

        <div className="study-lesson">
        {fileData && examMode && (
          <ExamMode fileData={fileData} onExit={() => setExamMode(false)} />
        )}

        {fileData && !examMode && !kahootMode && (
          <ChapterSelect
            fileData={fileData}
            onExamMode={() => setExamMode(true)}
            onKahoot={() => setKahootMode(true)}
            onGenerate={(cards) => {
              setFlashcards(cards)
              setCurrentCard(0)
              setFlipped(false)
              fetchSavedSets()
            }}
          />
        )}

        {kahootMode && (
          <Kahoot fileData={fileData} onExit={() => setKahootMode(false)} />
        )}

        {flashcards.length > 0 && !examMode && (
          <div className="flashcard-wrapper">
            <div className={`flashcard-slide ${slideAnim}`}>
              <div
                className={`flashcard-inner ${flipped ? "flipped" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={flipped ? "Show question" : "Show answer"}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (!isAnimating) setFlipped(!flipped) } }}
                onClick={() => !isAnimating && setFlipped(!flipped)}
              >
                <div>
                  <p className="card-label">{flipped ? "Answer" : "Question — tap to flip"}</p>
                  <p className="card-text">{flipped ? flashcards[currentCard].answer : flashcards[currentCard].question}</p>
                </div>
              </div>
            </div>

            {flashcards[currentCard].source_quote && (
              <SourceQuote quote={flashcards[currentCard].source_quote} />
            )}

            <div className="card-nav">
              <button
                className="btn btn-ghost"
                onClick={() => navigateCard("prev")}
                disabled={currentCard === 0 || isAnimating}
              >
                Prev
              </button>
              <span className="card-counter">{currentCard + 1} / {flashcards.length}</span>
              <button
                className="btn btn-ghost"
                onClick={() => navigateCard("next")}
                disabled={currentCard === flashcards.length - 1 || isAnimating}
              >
                Next
              </button>
            </div>
          </div>
        )}

        </div>
        </main>
        <LabFooter />
        </>}
      </div>
  )
}
