import { useEffect, useState } from 'react'
import axios from '../api'
import Auth from '../components/Auth'
import Kahoot from '../components/Kahoot'
import Upload from '../components/Upload'
import ArrowIcon from '../components/ArrowIcon'
import { SparkIcon } from '../components/LumitudyIcons'

const localAccountNotice = import.meta.env.VITE_PREVIEW_LOCAL_API === 'true'
  ? 'Accounts in this local preview are separate from live Lumitudy.'
  : 'Use your existing Lumitudy account, or create one to play.'

export function AccountPanel({auth, heading, onSuccess, onHome}) {
  return <section className="obs-account-page">
    <div className="obs-connected-intro"><p className="obs-eyebrow">YOUR PLACE IN LUMITUDY</p><h1 ref={heading} tabIndex="-1">{auth.user ? `Welcome back, ${auth.username}.` : 'Make yourself at home.'}</h1><p>{localAccountNotice}</p></div>
    {auth.authError && <p role="alert">{auth.authError}</p>}
    {auth.loading ? <p role="status">Checking your account…</p> : auth.user ? <div className="obs-glass obs-account-details"><span className="obs-account-avatar" aria-hidden="true">{auth.username?.slice(0,1).toUpperCase()}</span><h2>Your account</h2><dl><dt>Email</dt><dd>{auth.user}</dd><dt>Friend code</dt><dd>{auth.friendCode}</dd></dl><p className="obs-muted">Your uploaded books and multiplayer use this account. Sample study progress stays in this browser.</p><div className="obs-account-actions"><button className="obs-primary" onClick={onHome}>Back to my bookshelf <ArrowIcon/></button><button className="obs-secondary" disabled={auth.loggingOut} onClick={auth.logout}>Log out</button></div></div> : <Auth embedded onSuccess={onSuccess}/>}
  </section>
}

export function PlayTogether({auth, heading, onSignIn}) {
  const [choice,setChoice] = useState(null)
  const [file,setFile] = useState(null)
  const [files,setFiles] = useState([])
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState('')
  const [reload,setReload] = useState(0)
  useEffect(()=>{
    if (!auth.user || choice!=='host' || file) return
    let active=true
    setLoading(true);setError('')
    axios.get(`/upload/files`, {timeout:15000})
      .then(({data})=>{if(active)setFiles(data)})
      .catch(()=>{if(active)setError('We couldn’t load your textbooks. Try again, or upload a book below.')})
      .finally(()=>{if(active)setLoading(false)})
    return()=>{active=false}
  },[auth.user,choice,file,reload])

  return <section className="obs-play-page">
    <div className="obs-connected-intro"><p className="obs-eyebrow">A LITTLE FRIENDLY COMPETITION</p><h1 ref={heading} tabIndex="-1">Better together.</h1><p>Turn a chapter into a live quiz. Bring your friends, compare answers, and find out what clicks.</p></div>
    {auth.authError && <p role="alert">{auth.authError}</p>}
    {auth.loading ? <p role="status">Checking your account…</p> : !auth.user ? <div className="obs-glass obs-play-gate"><span className="obs-play-emblem" aria-hidden="true"><SparkIcon/></span><h2>A seat for everyone.</h2><p>Log in or create an account to host a quiz or join with a game code. Joining doesn’t require a textbook.</p><button className="obs-primary" onClick={onSignIn}>Log in or sign up to play <ArrowIcon/></button><small>{localAccountNotice}</small></div> : <>
      {!choice ? <div className="obs-play-choices"><button className="obs-glass obs-play-choice" onClick={()=>setChoice('host')}><span className="obs-play-emblem" aria-hidden="true"><SparkIcon/></span><span className="obs-eyebrow">BRING THE QUESTIONS</span><strong>Host a game</strong><span>Choose a textbook and chapter. Share your room code with friends.</span><span className="obs-choice-action">Set up a room <ArrowIcon/></span></button><button className="obs-glass obs-play-choice" onClick={()=>setChoice('join')}><span className="obs-play-code" aria-hidden="true">Aa</span><span className="obs-eyebrow">BRING YOUR CURIOSITY</span><strong>Join with a code</strong><span>Have an invite? Enter the game code and take your place in the lobby.</span><span className="obs-choice-action">Find your friends <ArrowIcon/></span></button></div> : <>
        <button className="obs-text-button" onClick={()=>{setChoice(null);setFile(null)}}>Back to play together / Leave game</button>
        {choice==='join' ? <div className="obs-game-shell"><Kahoot intent="join" onExit={()=>setChoice(null)}/></div> : file ? <div className="obs-game-shell"><p className="obs-selected-book">Playing from <strong>{file.filename}</strong></p><Kahoot key={file.file_path} intent="host" fileData={file} onExit={()=>setFile(null)}/></div> : <div className="obs-host-library obs-glass"><p className="obs-eyebrow">01 / CHOOSE YOUR MATERIAL</p><h2>Which book are we opening?</h2><p>Choose one of your uploaded textbooks, or bring something new. The sample books on the home shelf aren’t connected to multiplayer.</p>{loading&&<p role="status">Opening your library…</p>}{error&&<div role="alert"><p>{error}</p><button className="obs-secondary" onClick={()=>setReload(n=>n+1)}>Retry library</button></div>}{!loading&&!error&&!files.length&&<p className="obs-empty-library">Your library is ready for its first textbook.</p>}<div className="obs-host-books">{files.map(book=><button className="obs-secondary" key={book.id} disabled={!book.chapters?.length} onClick={()=>setFile(book)}><span><strong>{book.filename}</strong><small>{book.chapters?.length||0} chapters</small></span><ArrowIcon/></button>)}</div><Upload onUpload={setFile}/><small className="obs-helper">Hosting generates quiz questions from your chosen chapter. Check the material and answers before relying on them for study.</small></div>}
      </>}
    </>}
  </section>
}
