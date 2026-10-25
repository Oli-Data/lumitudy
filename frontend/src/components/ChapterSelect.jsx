import { useState } from "react"
import axios from "axios"

function ChapterSelect({ fileData, onGenerate, onExamMode, onKahoot }) {
  const [selectedChapter, setSelectedChapter] = useState(fileData.chapters[0])
  const [numCards, setNumCards] = useState(10)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [savedMessage, setSavedMessage] = useState(null)
  const [currentCards, setCurrentCards] = useState(null)
  const [setTitle, setSetTitle] = useState("")

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setSavedMessage(null)
    setCurrentCards(null)

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/flashcards/generate`, {
        file_path: fileData.file_path,
        chapter: selectedChapter,
        num_cards: numCards
      })
      setCurrentCards(res.data.flashcards)
      setSetTitle(selectedChapter)
      onGenerate(res.data.flashcards)
    } catch (err) {
      setError(typeof err.response?.data?.detail === "string" ? err.response.data.detail : "Failed to generate flashcards. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!currentCards) return
    setSaving(true)
    setSavedMessage(null)

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/sets/save`, {
        title: setTitle || selectedChapter,
        chapter: selectedChapter,
        cards: currentCards
      })
      setSavedMessage("Set saved successfully!")
    } catch {
      setError("Failed to save set.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      background: "var(--glass)",
      boxShadow: "var(--shadow)",
      backdropFilter: "blur(24px)",
      border: "1px solid var(--line)",
      borderRadius: "24px",
      padding: "1.5rem",
      marginBottom: "1.25rem",
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: "linear-gradient(90deg, transparent, var(--line), transparent)"
      }} />

      <p style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: "0.72rem",
        fontWeight: 700,
        color: "var(--accent)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: "1rem"
      }}>Select Chapter</p>

      <select
        aria-label="Chapter to study"
        value={selectedChapter}
        onChange={(e) => setSelectedChapter(e.target.value)}
        style={{ marginBottom: "1rem" }}
      >
        {fileData.chapters.map((chapter) => (
          <option key={chapter} value={chapter}>{chapter}</option>
        ))}
      </select>

      <label>Number of flashcards: {numCards}</label>
      <input
        aria-label="Number of flashcards"
        type="range"
        min="5"
        max="20"
        value={numCards}
        onChange={(e) => setNumCards(parseInt(e.target.value))}
        style={{ width: "100%", marginBottom: "1rem" }}
      />

      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{
          width: "100%",
          padding: "0.8rem",
          background: "linear-gradient(135deg, var(--primary-start), var(--primary-end))",
          color: "var(--on-primary)",
          border: "1px solid var(--line)",
          borderRadius: "10px",
          cursor: "pointer",
          fontSize: "0.95rem",
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500,
          marginBottom: "0.5rem",
          transition: "all 0.2s"
        }}
      >
        {loading ? "Generating flashcards..." : "Generate Flashcards"}
      </button>

      {currentCards && (
        <div style={{ marginTop: "0.75rem" }}>
          <input
            type="text"
            aria-label="Study set name"
            placeholder="Name this set..."
            value={setTitle}
            onChange={(e) => setSetTitle(e.target.value)}
            style={{ marginBottom: "0.5rem" }}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "linear-gradient(135deg, var(--success-soft), var(--success-soft))",
              color: "var(--success)",
              border: "1px solid var(--success-line)",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "0.95rem",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              transition: "all 0.2s"
            }}
          >
            {saving ? "Saving..." : "Save This Set"}
          </button>
        </div>
      )}

      {savedMessage && <p style={{ color: "var(--success)", textAlign: "center", marginTop: "0.75rem", fontSize: "0.88rem" }}>{savedMessage}</p>}
      {error && <p style={{ color: "var(--danger)", textAlign: "center", marginTop: "0.75rem", fontSize: "0.88rem" }}>{error}</p>}

      <div style={{
        marginTop: "1rem",
        paddingTop: "1rem",
        borderTop: "1px solid var(--line)",
        display: "flex",
        justifyContent: "flex-end",
        flexWrap: "wrap",
        gap: "0.5rem"
      }}>
        <button
          onClick={onKahoot}
          style={{
            padding: "0.6rem 1.4rem",
            background: "linear-gradient(135deg, var(--peach), var(--peach))",
            color: "var(--on-pastel)",
            border: "1px solid var(--gold-line)",
            borderRadius: "9px",
            cursor: "pointer",
            fontSize: "0.88rem",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            transition: "all 0.2s"
          }}
        >
          🎮 Kahoot
        </button>
        <button
          onClick={onExamMode}
          style={{
            padding: "0.6rem 1.4rem",
            background: "linear-gradient(135deg, var(--peach), var(--peach))",
            color: "var(--on-pastel)",
            border: "1px solid var(--gold-line)",
            borderRadius: "9px",
            cursor: "pointer",
            fontSize: "0.88rem",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            boxShadow: "0 4px 16px var(--danger-line)",
            transition: "all 0.2s"
          }}
        >
          Exam Mode
        </button>
      </div>
    </div>
  )
}

export default ChapterSelect
