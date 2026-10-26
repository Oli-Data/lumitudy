import { useState } from "react"
import axios from "../api"

function Upload({ onUpload }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState(null)

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setFileName(file.name)
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await axios.post(`/upload/`, formData)
      onUpload(res.data)
    } catch (err) {
      setError("Failed to upload file. Make sure it's a PDF, DOCX, or EPUB.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="upload-panel" aria-labelledby="upload-title">
      <div className="upload-icon" aria-hidden="true">↥</div>
      <div><h3 id="upload-title">Start with your textbook.</h3><p>A whole book or just a chapter. PDF, DOCX, and EPUB welcome.</p></div>
      <div className="upload-input"><input aria-label="Upload textbook" type="file" accept=".pdf,.docx,.epub" onChange={handleUpload} disabled={loading} /></div>
      {loading && <p className="upload-status" role="status">Finding the chapters in your file…</p>}
      {fileName && !loading && !error && <p className="upload-status" role="status">Ready to study: {fileName}</p>}
      {error && <p className="upload-status upload-error" role="alert">{error}</p>}
    </section>
  )
}

export default Upload
