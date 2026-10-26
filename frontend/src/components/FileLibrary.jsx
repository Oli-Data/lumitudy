import { useState, useEffect } from "react"
import axios from "../api"

function FileLibrary({ onFileSelect }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const res = await axios.get(`/upload/files`)
      setFiles(res.data)
    } catch (err) {
      console.error("Failed to fetch files")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/upload/files/${id}`)
      fetchFiles()
    } catch (err) {
      console.error("Failed to delete file")
    }
  }

  if (loading || files.length === 0) return null

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
      }}>My Textbooks</p>

      {files.map((file) => (
        <div key={file.id} className="library-row" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 0",
          borderBottom: "1px solid var(--line)"
        }}>
          <div>
            <span style={{ fontWeight: 500, color: "var(--ink)" }}>{file.filename}</span>
            <span style={{ fontSize: "0.78rem", color: "var(--muted)", marginLeft: "0.5rem" }}>
              {file.chapters.length} chapters
            </span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => onFileSelect({
                filename: file.filename,
                file_path: file.file_path,
                file_type: file.file_type,
                chapters: file.chapters
              })}
              style={{
                padding: "0.3rem 0.75rem",
                background: "var(--mint-soft)",
                color: "var(--accent)",
                border: "1px solid var(--line)",
                borderRadius: "7px",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontFamily: "'DM Sans', sans-serif"
              }}
            >
              Load
            </button>
            <button
              onClick={() => handleDelete(file.id)}
              style={{
                padding: "0.3rem 0.75rem",
                background: "var(--danger-soft)",
                color: "var(--danger)",
                border: "1px solid var(--danger-line)",
                borderRadius: "7px",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontFamily: "'DM Sans', sans-serif"
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default FileLibrary