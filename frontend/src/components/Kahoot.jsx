import { useState, useEffect, useRef } from "react"
import axios from "../api"
import { useAuth } from "../context/AuthContext"

function Kahoot({ fileData, onExit, intent = "both" }) {
  const { username } = useAuth()
  const [mode, setMode] = useState("menu")
  const [gameCode, setGameCode] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [players, setPlayers] = useState([])
  const [isHost, setIsHost] = useState(false)
  const [question, setQuestion] = useState(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [timeLeft, setTimeLeft] = useState(20)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [answerResult, setAnswerResult] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [finalLeaderboard, setFinalLeaderboard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [numQuestions, setNumQuestions] = useState(10)
  const [selectedChapter, setSelectedChapter] = useState(fileData?.chapters[0])
  const [totalScore, setTotalScore] = useState(0)
  const [isLastQuestion, setIsLastQuestion] = useState(false)
  const [lobbyTab, setLobbyTab] = useState("generate")
  const [savedSets, setSavedSets] = useState([])
  const [updatingQuestions, setUpdatingQuestions] = useState(false)
  const [questionsReady, setQuestionsReady] = useState(false)
  const [questionsCount, setQuestionsCount] = useState(0)

  const wsRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.onerror = null; wsRef.current.onopen = null; wsRef.current.onmessage = null; wsRef.current.close() }
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const connectWebSocket = (code, asHost) => {
    const base = new URL(import.meta.env.VITE_API_URL || '/api', window.location.origin)
    base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:'
    base.pathname = `${base.pathname.replace(/\/$/, '')}/game/ws/${encodeURIComponent(code)}/${encodeURIComponent(username)}`
    base.search = ''
    base.hash = ''
    if (wsRef.current) {
      wsRef.current.onclose = null
      wsRef.current.onerror = null
      wsRef.current.onopen = null
      wsRef.current.onmessage = null
      wsRef.current.close()
    }
    setLoading(true)
    const ws = new WebSocket(base.href)
    wsRef.current = ws

    ws.onopen = () => {
      setLoading(false)
      setMode("lobby")
      setIsHost(asHost)
      setGameCode(code)
      if (asHost) axios.get(`/sets/`).then(res => setSavedSets(res.data)).catch(() => {})
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleMessage(data)
    }

    ws.onerror = () => {
      setLoading(false)
      setError("Connection failed. Please try again.")
      setMode("menu")
    }

    ws.onclose = (event) => {
      if (timerRef.current) clearInterval(timerRef.current)
      setLoading(false)
      setMode('menu')
      setError(previous => previous || (event?.code === 1008 ? 'Your session ended. Please sign in again.' : 'The game connection closed. You can join again with the code.'))
    }
  }

  const handleMessage = (data) => {
    switch (data.type) {
      case "player_joined":
      case "player_left":
        setPlayers(data.players)
        break

      case "question":
        setShowLeaderboard(false)
        setQuestion(data)
        setQuestionIndex(data.index)
        setTotalQuestions(data.total)
        setTimeLeft(data.time_limit)
        setSelected(null)
        setAnswered(false)
        setAnswerResult(null)
        setMode("game")

        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current)
              return 0
            }
            return prev - 1
          })
        }, 1000)
        break

      case "answer_result":
        setAnswerResult(data)
        setTotalScore(data.total_score)
        break

      case "question_result":
        console.log("question_result received:", data)
        clearInterval(timerRef.current)
        setLeaderboard(data.leaderboard)
        setShowLeaderboard(true)
        setIsLastQuestion(data.is_last)
        break

      case "questions_updated":
        setQuestionsReady(true)
        setQuestionsCount(data.num_questions)
        break

      case "ping":
        if (wsRef.current) wsRef.current.send(JSON.stringify({ type: "pong" }))
        break

      case "game_over":
        clearInterval(timerRef.current)
        setShowLeaderboard(false)
        setFinalLeaderboard(data.leaderboard)
        setMode("results")
        break

      case "error":
        setError(data.message)
        setMode("menu")
        break
    }
  }

  const createGame = async () => {
    if (!fileData) {
      setError("Please upload a textbook first")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post(`/game/create`, {
        file_path: fileData.file_path,
        chapter: selectedChapter,
        num_questions: numQuestions
      })
      connectWebSocket(res.data.game_code, true)
    } catch (err) {
      setError(typeof err.response?.data?.detail === "string" ? err.response.data.detail : "Failed to create game. Please try again.")
      setLoading(false)
    }
  }

  const joinGame = () => {
    if (loading || !joinCode.trim()) return
    setError(null)
    connectWebSocket(joinCode.trim().toUpperCase(), false)
  }

  const startGame = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: "start_game" }))
    }
  }

  const submitAnswer = (index) => {
    if (answered) return
    setSelected(index)
    setAnswered(true)
    clearInterval(timerRef.current)
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: "submit_answer",
        answer_index: index,
        question_id: question.question_id
      }))
    }
  }

  const updateQuestions = async () => {
    if (!fileData) return
    setUpdatingQuestions(true)
    try {
      const res = await axios.post(`/game/${gameCode}/update-questions`, {
        file_path: fileData.file_path,
        chapter: selectedChapter,
        num_questions: numQuestions
      })
      setQuestionsReady(true)
      setQuestionsCount(res.data.num_questions)
    } catch (err) {
      setError(typeof err.response?.data?.detail === "string" ? err.response.data.detail : "Failed to update questions")
    } finally {
      setUpdatingQuestions(false)
    }
  }

  const updateQuestionsFromSet = async (set) => {
    setUpdatingQuestions(true)
    try {
      const res = await axios.post(`/game/${gameCode}/update-questions`, {
        cards: set.cards,
        num_questions: set.cards.length
      })
      setQuestionsReady(true)
      setQuestionsCount(res.data.num_questions)
    } catch (err) {
      setError(typeof err.response?.data?.detail === "string" ? err.response.data.detail : "Failed to update questions")
    } finally {
      setUpdatingQuestions(false)
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

  const topLine = {
    position: "absolute", top: 0, left: 0, right: 0, height: "1px",
    background: "linear-gradient(90deg, transparent, var(--line), transparent)"
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

  const btnPrimary = {
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
    transition: "all 0.2s",
    marginBottom: "0.5rem"
  }

  // Menu screen
  if (mode === "menu") {
    return (
      <div style={glassPanel}>
        <div style={topLine} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <p style={{ ...panelTitle, marginBottom: 0 }}>{intent === "host" ? "Host a game" : intent === "join" ? "Join a game" : "Play together"}</p>
          <button onClick={onExit} style={{
            padding: "0.4rem 1rem",
            background: "var(--surface)",
            color: "var(--muted)",
            border: "1px solid var(--line)",
            borderRadius: "8px", cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem"
          }}>Back</button>
        </div>

        {fileData && intent !== "join" && (
          <div style={{ marginBottom: "1.5rem" }}>
            {intent === "both" && <p style={panelTitle}>Host a Game</p>}
            <label style={{ color: "var(--muted)", fontSize: "0.88rem", display: "block", marginBottom: "0.4rem" }}>Chapter:</label>
            <select aria-label="Chapter to play" value={selectedChapter} onChange={(e) => setSelectedChapter(e.target.value)} style={{ marginBottom: "0.75rem" }}>
              {fileData.chapters.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <label style={{ color: "var(--muted)", fontSize: "0.88rem", display: "block", marginBottom: "0.4rem" }}>
              Questions: {numQuestions}
            </label>
            <input type="range" min="5" max="20" value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              style={{ width: "100%", marginBottom: "0.75rem", accentColor: "var(--accent)" }}
            />
            <button onClick={createGame} disabled={loading} style={btnPrimary}>
              {loading ? "Creating game..." : "Create game"}
            </button>
          </div>
        )}

        {intent !== "host" && <>
        <div>
          {intent === "both" && <p style={panelTitle}>Join a Game</p>}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              aria-label="Game code"
              placeholder="GAME-AB12"
              maxLength={32}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && joinGame()}
              style={{ flex: 1 }}
            />
            <button disabled={loading || !joinCode.trim()} onClick={joinGame} style={{
              padding: "0.65rem 1.1rem",
              background: "var(--mint-soft)",
              color: "var(--accent)",
              border: "1px solid var(--line)",
              borderRadius: "9px", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem",
              whiteSpace: "nowrap"
            }}>{loading ? "Connecting…" : "Join game"}</button>
          </div>
        </div>

        </>}
        {error && <p role="alert" style={{ color: "var(--danger)", marginTop: "0.75rem", fontSize: "0.88rem" }}>{error}</p>}
      </div>
    )
  }

  // Lobby screen
  if (mode === "lobby") {
    return (
      <div style={glassPanel}>
        <div style={topLine} />
        <p style={panelTitle}>Game Lobby</p>

        <div style={{
          textAlign: "center",
          padding: "1rem",
          background: "var(--inset)",
          borderRadius: "12px",
          marginBottom: "1.25rem",
          border: "1px solid var(--line)"
        }}>
          <p style={{ color: "var(--muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>Game Code</p>
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: "2rem", fontWeight: 800, color: "var(--accent)", letterSpacing: "0.15em" }}>{gameCode}</p>
          <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>Share this code with your friends</p>
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <p style={panelTitle}>Players ({players.length})</p>
            {players.map((p, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.6rem 0",
                borderBottom: "1px solid var(--line)"
              }}>
                <div style={{
                  width: "28px", height: "28px",
                  background: "linear-gradient(135deg, var(--accent), var(--aqua))",
                  borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", fontWeight: 700, color: "var(--ink)", flexShrink: 0
                }}>
                  {p[0].toUpperCase()}
                </div>
                <span style={{ color: "var(--ink)", fontSize: "0.9rem" }}>
                  {p}
                  {i === 0 && <span style={{ color: "var(--accent)", fontSize: "0.75rem", marginLeft: "0.4rem" }}>HOST</span>}
                </span>
              </div>
            ))}
          </div>

          {isHost && (
            <div style={{ flex: 1, minWidth: "200px" }}>
              <p style={panelTitle}>Select Questions</p>

              <div style={{ display: "flex", marginBottom: "0.75rem", background: "var(--inset)", borderRadius: "8px", padding: "0.2rem", border: "1px solid var(--line)" }}>
                <button
                  onClick={() => setLobbyTab("generate")}
                  style={{
                    flex: 1, padding: "0.4rem", border: "none", borderRadius: "6px", cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", transition: "all 0.2s",
                    background: lobbyTab === "generate" ? "var(--mint-soft)" : "transparent",
                    color: lobbyTab === "generate" ? "var(--accent)" : "var(--muted)"
                  }}
                >Generate</button>
                <button
                  onClick={() => setLobbyTab("saved")}
                  style={{
                    flex: 1, padding: "0.4rem", border: "none", borderRadius: "6px", cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", transition: "all 0.2s",
                    background: lobbyTab === "saved" ? "var(--mint-soft)" : "transparent",
                    color: lobbyTab === "saved" ? "var(--accent)" : "var(--muted)"
                  }}
                >Saved Sets</button>
              </div>

              {lobbyTab === "generate" && fileData && (
                <div>
                  <select
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(e.target.value)}
                    style={{ marginBottom: "0.5rem", fontSize: "0.82rem" }}
                  >
                    {fileData.chapters.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <label style={{ color: "var(--muted)", fontSize: "0.82rem", display: "block", marginBottom: "0.25rem" }}>
                    Questions: {numQuestions}
                  </label>
                  <input type="range" min="5" max="20" value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                    style={{ width: "100%", marginBottom: "0.5rem", accentColor: "var(--accent)" }}
                  />
                  <button
                    onClick={updateQuestions}
                    disabled={updatingQuestions}
                    style={{
                      width: "100%", padding: "0.6rem",
                      background: "linear-gradient(135deg, var(--primary-start), var(--primary-end))",
                      color: "var(--on-primary)", border: "1px solid var(--line)",
                      borderRadius: "8px", cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 500
                    }}
                  >
                    {updatingQuestions ? "Generating..." : "Set Questions"}
                  </button>
                </div>
              )}

              {lobbyTab === "saved" && (
                <div>
                  {savedSets.length === 0 ? (
                    <p style={{ color: "var(--muted)", fontSize: "0.82rem" }}>No saved sets.</p>
                  ) : (
                    savedSets.map((set) => (
                      <div key={set.id} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "0.5rem 0", borderBottom: "1px solid var(--line)"
                      }}>
                        <div>
                          <span style={{ color: "var(--ink)", fontSize: "0.82rem" }}>{set.title}</span>
                          <span style={{ color: "var(--muted)", fontSize: "0.75rem", marginLeft: "0.4rem" }}>{set.cards.length} cards</span>
                        </div>
                        <button
                          onClick={() => updateQuestionsFromSet(set)}
                          style={{
                            padding: "0.25rem 0.6rem",
                            background: "var(--mint-soft)", color: "var(--accent)",
                            border: "1px solid var(--line)",
                            borderRadius: "6px", cursor: "pointer",
                            fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem"
                          }}
                        >Use</button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {questionsReady && (
                <p style={{ color: "var(--success)", fontSize: "0.8rem", marginTop: "0.5rem", textAlign: "center" }}>
                  ✓ {questionsCount} questions ready
                </p>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: "1.25rem" }}>
          {isHost ? (
            <button
              onClick={startGame}
              disabled={players.length < 1}
              style={{
                ...btnPrimary,
                background: "linear-gradient(135deg, var(--peach), var(--peach))",
                color: "var(--on-pastel)",
                border: "1px solid var(--gold-line)"
              }}
            >
              Start game
            </button>
          ) : (
            <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.88rem" }}>
              Waiting for host to start...
            </p>
          )}
        </div>
      </div>
    )
  }

  // Game screen
  if (mode === "game") {
    const colors = [
      { bg: "var(--danger-soft)", border: "var(--danger-line)", color: "var(--danger)" },
      { bg: "var(--blue-soft)", border: "var(--blue-line)", color: "var(--blue)" },
      { bg: "var(--gold-soft)", border: "var(--gold-line)", color: "var(--gold)" },
      { bg: "var(--success-soft)", border: "var(--success-line)", color: "var(--success)" },
    ]

    const shapes = ["▲", "◆", "●", "■"]

    if (showLeaderboard) {
      return (
        <div style={glassPanel}>
          <div style={topLine} />
          <p style={{ ...panelTitle, textAlign: "center" }}>Leaderboard</p>
          {leaderboard.map((entry, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "0.75rem 1rem", marginBottom: "0.5rem", borderRadius: "10px",
              background: i === 0 ? "var(--gold-soft)" : "var(--surface)",
              border: `1px solid ${i === 0 ? "var(--gold-line)" : "var(--line)"}`
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{
                  fontFamily: "'Syne', sans-serif", fontWeight: 700,
                  color: i === 0 ? "var(--gold)" : i === 1 ? "var(--muted)" : i === 2 ? "var(--peach-ink)" : "var(--muted)"
                }}>#{i + 1}</span>
                <span style={{ color: "var(--ink)", fontSize: "0.9rem" }}>{entry.username}</span>
              </div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "var(--accent)" }}>
                {entry.score}
              </span>
            </div>
          ))}
          <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.82rem", marginTop: "0.75rem" }}>
            {isLastQuestion ? "Game ending..." : "Next question coming up..."}
          </p>
        </div>
      )
    }

    return (
      <div style={glassPanel}>
        <div style={topLine} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <span style={{ color: "var(--muted)", fontSize: "0.82rem", fontFamily: "'Syne', sans-serif" }}>
            {questionIndex + 1} / {totalQuestions}
          </span>
          <div style={{
            width: "44px", height: "44px",
            borderRadius: "50%",
            background: timeLeft <= 5 ? "var(--danger-line)" : "var(--mint-soft)",
            border: `2px solid ${timeLeft <= 5 ? "var(--danger-line)" : "var(--line)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Syne', sans-serif", fontWeight: 700,
            color: timeLeft <= 5 ? "var(--danger)" : "var(--accent)",
            fontSize: "1.1rem",
            transition: "all 0.3s"
          }}>
            {timeLeft}
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", color: "var(--accent)", fontSize: "0.85rem" }}>
            {totalScore} pts
          </span>
        </div>

        <div style={{
          background: "var(--inset)",
          borderRadius: "12px",
          padding: "1.25rem",
          marginBottom: "1rem",
          border: "1px solid var(--line)",
          textAlign: "center"
        }}>
          <p style={{ color: "var(--ink)", fontSize: "1.05rem", fontWeight: 500, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
            {question?.question}
          </p>
        </div>

        {answerResult && (
          <div style={{
            textAlign: "center",
            padding: "0.75rem",
            marginBottom: "0.75rem",
            borderRadius: "10px",
            background: answerResult.correct ? "var(--success-soft)" : "var(--danger-soft)",
            border: `1px solid ${answerResult.correct ? "var(--success-line)" : "var(--danger-line)"}`
          }}>
            <p style={{ color: answerResult.correct ? "var(--success)" : "var(--danger)", fontWeight: 600, fontSize: "0.95rem" }}>
              {answerResult.correct ? `+${answerResult.points_earned} points!` : "Wrong!"}
            </p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
          {question?.options.map((option, index) => {
            const c = colors[index]
            const isSelected = selected === index
            return (
              <button
                key={index}
                onClick={() => submitAnswer(index)}
                disabled={answered}
                style={{
                  padding: "1rem 0.75rem",
                  background: isSelected ? c.bg : "var(--inset)",
                  border: `2px solid ${isSelected ? c.border : "var(--line)"}`,
                  borderRadius: "12px",
                  cursor: answered ? "default" : "pointer",
                  color: isSelected ? c.color : "var(--muted)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.88rem",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  textAlign: "left"
                }}
              >
                <span style={{ fontSize: "1rem", opacity: 0.7 }}>{shapes[index]}</span>
                {option}
              </button>
            )
          })}
        </div>

        {answered && !answerResult && (
          <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.82rem", marginTop: "0.75rem" }}>
            Waiting for other players...
          </p>
        )}
      </div>
    )
  }

  // Results screen
  if (mode === "results" && finalLeaderboard) {
    return (
      <div style={glassPanel}>
        <div style={topLine} />
        <h2 style={{ textAlign: "center", fontFamily: "'Syne', sans-serif", color: "var(--ink)", marginBottom: "0.5rem" }}>
          Game Over!
        </h2>
        {finalLeaderboard[0] && (
          <p style={{ textAlign: "center", color: "var(--gold)", fontFamily: "'Syne', sans-serif", fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.5rem" }}>
            🏆 {finalLeaderboard[0].username} wins!
          </p>
        )}

        <p style={panelTitle}>Final Scores</p>
        {finalLeaderboard.map((entry, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "0.75rem 1rem", marginBottom: "0.5rem", borderRadius: "10px",
            background: i === 0 ? "var(--gold-soft)" : "var(--surface)",
            border: `1px solid ${i === 0 ? "var(--gold-line)" : "var(--line)"}`
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.1rem",
                color: i === 0 ? "var(--gold)" : i === 1 ? "var(--muted)" : i === 2 ? "var(--peach-ink)" : "var(--muted)"
              }}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
              </span>
              <span style={{ color: "var(--ink)", fontSize: "0.95rem" }}>{entry.username}</span>
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "var(--accent)", fontSize: "1rem" }}>
              {entry.score}
            </span>
          </div>
        ))}

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
          <button
            onClick={() => {
              setMode("lobby")
              setFinalLeaderboard(null)
              setLeaderboard([])
              setQuestion(null)
              setSelected(null)
              setAnswered(false)
              setAnswerResult(null)
              setTotalScore(0)
              setIsLastQuestion(false)
            }}
            style={{
              ...btnPrimary,
              marginBottom: 0,
              flex: 1,
              background: "linear-gradient(135deg, var(--primary-start), var(--primary-end))"
            }}
          >
            🔄 Back to Lobby
          </button>
          <button
            onClick={onExit}
            style={{
              flex: 1,
              padding: "0.8rem",
              background: "var(--surface)",
              color: "var(--muted)",
              border: "1px solid var(--line)",
              borderRadius: "10px",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500
            }}
          >
            Exit
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default Kahoot
