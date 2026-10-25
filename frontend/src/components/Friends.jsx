import { useState, useEffect } from "react"
import axios from "axios"
import { useAuth } from "../context/AuthContext"

function Friends({ onClose }) {
  const { username, friendCode } = useAuth()
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [code, setCode] = useState("")
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchFriends()
    fetchRequests()
  }, [])

  const fetchFriends = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/friends/`)
      setFriends(res.data)
    } catch (err) {
      console.error("Failed to fetch friends")
    }
  }

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/friends/requests`)
      setRequests(res.data)
    } catch (err) {
      console.error("Failed to fetch requests")
    }
  }

  const sendRequest = async () => {
    if (!code.trim()) return
    setLoading(true)
    setMessage(null)
    setError(null)
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/friends/request`, { friend_code: code.toUpperCase() })
      setMessage("Friend request sent!")
      setCode("")
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send request")
    } finally {
      setLoading(false)
    }
  }

  const acceptRequest = async (id) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/friends/accept/${id}`)
      fetchFriends()
      fetchRequests()
    } catch (err) {
      console.error("Failed to accept request")
    }
  }

  const declineRequest = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/friends/${id}`)
      fetchRequests()
    } catch (err) {
      console.error("Failed to decline request")
    }
  }

  const removeFriend = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/friends/${id}`)
      fetchFriends()
    } catch (err) {
      console.error("Failed to remove friend")
    }
  }

  const glassPanel = {
    background: "var(--glass)",
    boxShadow: "var(--shadow)",
    backdropFilter: "blur(24px)",
    border: "1px solid var(--line)",
    borderRadius: "24px",
    padding: "1.5rem",
    marginBottom: "1.25rem",
    position: "relative",
    overflow: "hidden"
  }

  const panelTitle = {
    fontFamily: "'Syne', sans-serif",
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "var(--accent)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "1rem"
  }

  const rowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 0",
    borderBottom: "1px solid var(--line)"
  }

  return (
    <div style={glassPanel}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: "linear-gradient(90deg, transparent, var(--line), transparent)"
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <p style={{ ...panelTitle, marginBottom: 0 }}>Friends</p>
        <button onClick={onClose} style={{
          padding: "0.4rem 1rem",
          background: "var(--surface)",
          color: "var(--muted)",
          border: "1px solid var(--line)",
          borderRadius: "8px", cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem"
        }}>Close</button>
      </div>

      {/* Your friend code */}
      <div style={{
        background: "var(--inset)",
        border: "1px solid var(--line)",
        borderRadius: "10px",
        padding: "0.85rem 1rem",
        marginBottom: "1.25rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <p style={{ ...panelTitle, marginBottom: "0.25rem" }}>Your Friend Code</p>
          <p style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "1.3rem",
            fontWeight: 700,
            color: "var(--accent)",
            letterSpacing: "0.1em"
          }}>{friendCode}</p>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(friendCode)}
          style={{
            padding: "0.4rem 0.85rem",
            background: "var(--mint-soft)",
            color: "var(--accent)",
            border: "1px solid var(--line)",
            borderRadius: "7px", cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem"
          }}
        >
          Copy
        </button>
      </div>

      {/* Add friend by code */}
      <div style={{ marginBottom: "1.25rem" }}>
        <p style={panelTitle}>Add Friend</p>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            placeholder="Enter friend code (e.g. LUMI-1234)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendRequest()}
            style={{ flex: 1 }}
          />
          <button
            onClick={sendRequest}
            disabled={loading}
            style={{
              padding: "0.65rem 1.1rem",
              background: "var(--mint-soft)",
              color: "var(--accent)",
              border: "1px solid var(--line)",
              borderRadius: "9px", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem",
              whiteSpace: "nowrap"
            }}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
        {message && <p style={{ color: "var(--success)", fontSize: "0.85rem", marginTop: "0.5rem" }}>{message}</p>}
        {error && <p style={{ color: "var(--danger)", fontSize: "0.85rem", marginTop: "0.5rem" }}>{error}</p>}
      </div>

      {/* Pending requests */}
      {requests.length > 0 && (
        <div style={{ marginBottom: "1.25rem" }}>
          <p style={panelTitle}>Pending Requests</p>
          {requests.map((r) => (
            <div key={r.id} style={rowStyle}>
              <span style={{ color: "var(--ink)", fontSize: "0.88rem" }}>{r.from_username}</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => acceptRequest(r.id)} style={{
                  padding: "0.3rem 0.75rem",
                  background: "var(--success-soft)", color: "var(--success)",
                  border: "1px solid var(--success-line)",
                  borderRadius: "7px", cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem"
                }}>Accept</button>
                <button onClick={() => declineRequest(r.id)} style={{
                  padding: "0.3rem 0.75rem",
                  background: "var(--danger-soft)", color: "var(--danger)",
                  border: "1px solid var(--danger-line)",
                  borderRadius: "7px", cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem"
                }}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friends list */}
      <div>
        <p style={panelTitle}>My Friends</p>
        {friends.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: "0.88rem" }}>No friends yet. Share your code above.</p>
        ) : (
          friends.map((f) => (
            <div key={f.id} style={{ ...rowStyle, borderBottom: "none" }}>
              <span style={{ color: "var(--ink)", fontSize: "0.88rem" }}>{f.username}</span>
              <button onClick={() => removeFriend(f.id)} style={{
                padding: "0.3rem 0.75rem",
                background: "var(--danger-soft)", color: "var(--danger)",
                border: "1px solid var(--danger-line)",
                borderRadius: "7px", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem"
              }}>Remove</button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Friends