import { useEffect, useRef, useState } from 'react'
import { AeroBackdrop, Brand, ThemeToggle } from '../components/Brand'
import { SparkIcon, StarIcon } from '../components/LumitudyIcons'
import { useAuth } from '../context/AuthContext'
import { AccountPanel, PlayTogether } from './ConnectedFeatures'
import ArrowIcon from '../components/ArrowIcon'
import { courses, findChapter, findQuestion, chapterForQuestion } from './lessons'
import { STORAGE_KEY, emptyProgress, readProgress, createSession, needsReview, advance } from './progress'

function CourseIcon({kind}) {
  return <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind==='leaf' ? <><path d="M9 28C3 12 22 6 33 6c1 14-6 30-21 24M9 33 28 13M15 27v-9M21 21h9"/></> : kind==='chart' ? <><path d="M7 7v27h27M13 27v-7M21 27V11M29 27V16"/><circle cx="29" cy="9" r="2"/></> : <><path d="m13 12-8 8 8 8m14-16 8 8-8 8M23 8l-6 24"/></>}</svg>
}
function CoverArt({kind}) {
  return <svg className="obs-cover-art" viewBox="0 0 180 140" fill="none" aria-hidden="true">{kind==='leaf'?<g stroke="currentColor" strokeWidth="1.3"><ellipse cx="90" cy="70" rx="64" ry="48" transform="rotate(-25 90 70)"/><ellipse cx="90" cy="70" rx="53" ry="38" transform="rotate(-25 90 70)"/><ellipse cx="96" cy="66" rx="18" ry="14"/><path d="M44 65q16-24 25-8t17 7m16 29q22-21 27-11M61 91q9-17 17-3M115 41q9 8 16 0"/><circle cx="58" cy="74" r="3"/><circle cx="120" cy="67" r="4"/></g>:kind==='chart'?<g stroke="currentColor" strokeWidth="1.4"><path d="M20 110h140M30 120V20M20 70h140M20 30h140" opacity=".3"/><path d="M25 107C63 107 58 34 91 34s27 73 65 73"/><path d="M40 108V97m15 11V76m15 32V48m15 60V36m15 72V39m15 69V59m15 49V88m15 20v-4" strokeWidth="5"/><circle cx="91" cy="34" r="5" fill="currentColor"/></g>:<g stroke="currentColor" strokeWidth="1.4"><rect x="67" y="48" width="46" height="42" rx="4"/><rect x="18" y="13" width="29" height="25" rx="3"/><rect x="136" y="27" width="27" height="25" rx="3"/><rect x="28" y="102" width="29" height="24" rx="3"/><rect x="130" y="105" width="29" height="24" rx="3"/><path d="M47 26h43v22m23 21h36V52M67 69H42v33m48-12v27h40m-51-57-8 9 8 9m22-18 8 9-8 9"/><circle cx="90" cy="117" r="3" fill="currentColor"/></g>}</svg>
}
function Primary({children,...props}) { return <button className="obs-primary" {...props}>{children}</button> }

export default function Observatory() {
  const [progress,setProgress] = useState(() => { try { return readProgress(localStorage) } catch { return emptyProgress() } })
  const auth = useAuth()
  const [returnScreen,setReturnScreen] = useState('home')
  function openAccount(destination='home') { setReturnScreen(destination); setScreen('account') }
  const [screen,setScreen] = useState('home')
  const [minutes,setMinutes] = useState(10)
  const [storageError,setStorageError] = useState(false)
  const [resetOpen,setResetOpen] = useState(false)
  const heading = useRef(null)
  const course = courses.find(c => c.id === progress.courseId)
  const chapter = findChapter(progress.chapterId)
  const session = progress.session
  const review = Object.values(progress.answers).filter(needsReview)
  const answered = Object.keys(progress.answers).length

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY,JSON.stringify(progress)); setStorageError(false) }
    catch { setStorageError(true) }
  },[progress])
  useEffect(() => { heading.current?.focus(); window.scrollTo?.({top:0,behavior:'instant'}) },[screen,session?.stage,session?.index])

  function chooseCourse(c) { setProgress(p => ({...p,courseId:c.id,chapterId:c.chapters[0].id})) }
  function start(ch=chapter,mode='lesson',ids=null) {
    setProgress(p => ({...p,session:createSession(ch.id,ids ?? ch.questions.slice(0,minutes===5?2:3).map(q=>q.id),mode)}))
    setScreen('session')
  }
  function startReview() {
    if (!review.length) return
    start(chapterForQuestion(review[0].questionId),'review',review.map(r=>r.questionId))
  }
  function updateSession(change) { setProgress(p => ({...p,session:{...p.session,...change}})) }
  function submit(event) {
    event.preventDefault()
    setProgress(p => {
      const s=p.session
      if(s.stage!=='question' || s.selected===null || !s.confidence) return p
      return {...p,session:{...s,stage:'feedback',results:[...s.results,{questionId:s.ids[s.index],selected:s.selected,confidence:s.confidence}]}}
    })
  }
  const sessionInProgress = session && session.stage!=='recap'
  return <><AeroBackdrop/><div className="observatory">
    <a className="obs-skip" href="#observatory-main">Skip to study space</a>
    <header className="obs-header"><a className="obs-brand-link" href="/observatory.html" aria-label="Lumitudy bookshelf home"><Brand/></a><nav aria-label="Study navigation"><button aria-current={screen==='home'?'page':undefined} onClick={()=>setScreen('home')}>My bookshelf</button><button aria-current={screen==='review'?'page':undefined} onClick={()=>setScreen('review')}>Revisit <span className="obs-count">{review.length}</span></button><button aria-current={screen==='play'?'page':undefined} onClick={()=>setScreen('play')} className="obs-play-nav">Play together</button></nav><div className="obs-header-tools"><button className="obs-account-button" onClick={()=>openAccount()}>{auth.loading?'Checking account…':auth.user?'My account':'Log in / Sign up'}</button><ThemeToggle/></div></header>
    <div className="obs-demo-line"><span><span className="obs-status-dot"/> Your own corner of the library</span><span>Sample courses · {storageError?'Progress is temporary':'Progress stays in this browser'}</span></div>
    {storageError&&<p className="obs-warning" role="alert">This browser could not save your progress. You can keep studying, but a reload may lose this session.</p>}
    <main id="observatory-main">
      {screen==='account'&&<AccountPanel auth={auth} heading={heading} onSuccess={()=>setScreen(returnScreen)} onHome={()=>setScreen('home')}/>}
      {screen==='play'&&<PlayTogether key={auth.user || 'guest'} auth={auth} heading={heading} onSignIn={()=>openAccount('play')}/>}
      {screen==='home'&&<>
        <section className="obs-library-heading"><div><p className="obs-eyebrow">THE LUMITUDY LIBRARY</p><h1 ref={heading} tabIndex="-1">A little more curious.</h1><p>Pull up a book. Pick up where you left off.</p></div><span className="obs-library-stamp"><SparkIcon/><span>{progress.history.length} sessions<br/>and counting</span></span></section>
        {sessionInProgress&&<div className="obs-resume obs-glass"><div><span className="obs-eyebrow">YOUR BOOKMARK IS STILL HERE</span><h2>{findChapter(session.chapterId).title}</h2><p>{session.results.length} of {session.ids.length} questions checked. Your place is saved.</p></div><Primary onClick={()=>setScreen('session')}>Continue session <ArrowIcon/></Primary></div>}
        <section className="obs-course-section" aria-labelledby="books-heading"><div className="obs-section-heading"><h2 id="books-heading">On your shelf</h2><span>03 sample volumes · Select a cover</span></div><div className="obs-bookshelf"><div className="obs-books">{courses.map((c,i)=>{
          const count=c.chapters.flatMap(ch=>ch.questions).filter(q=>progress.answers[q.id]).length
          return <button key={c.id} className={`obs-book obs-${c.color} ${course.id===c.id?'is-selected':''}`} aria-label={`${c.subject} ${c.name}, ${count} of 6 questions explored`} aria-pressed={course.id===c.id} onClick={()=>chooseCourse(c)}><span className="obs-book-cover"><span className="obs-book-edition">LUMITUDY / VOL. 0{i+1}</span><span className="obs-book-title">{c.name}</span><CoverArt kind={c.symbol}/><span className="obs-book-subject">{c.subject}</span><span className="obs-book-ribbon" aria-hidden="true"><StarIcon/></span></span><span className="obs-book-caption"><strong>{course.id===c.id?'Open on your desk':'Open this book'}</strong><span>{count}/6 questions explored</span></span></button>
        })}</div><div className="obs-shelf-edge" aria-hidden="true"/></div></section>
        <section className="obs-desk" aria-label="Your study notebook"><div className="obs-desk-label"><span className="obs-eyebrow">OPEN ON YOUR DESK</span><span>{course.subject} · Two chapters</span></div><div className="obs-chapter-tabs" role="group" aria-label="Choose a chapter">{course.chapters.map((ch,i)=><button key={ch.id} aria-pressed={chapter.id===ch.id} onClick={()=>setProgress(p=>({...p,chapterId:ch.id}))}><span>0{i+1}</span>{ch.title}</button>)}</div><div className="obs-workspace"><section className="obs-map-panel"><div className="obs-notebook-top"><span className="obs-eyebrow">{course.name}</span><span>0{course.chapters.indexOf(chapter)+1} / 02</span></div><h2>{chapter.title}</h2><p className="obs-chapter-intro">{chapter.read}</p><div className="obs-notebook-preview"><span className="obs-margin-note">In this chapter</span><p>{chapter.tagline || course.description}</p><div className="obs-chapter-tags"><span>Short reading</span><span>3 recall questions</span><span>Source notes</span></div></div><div className="obs-page-foot"><CourseIcon kind={course.symbol}/><span>{chapter.questions.filter(q=>progress.answers[q.id]).length} of 3 questions explored</span><span>01</span></div></section>
        <aside className="obs-planner"><span className="obs-planner-star"><StarIcon/></span><p className="obs-eyebrow">MAKE A LITTLE ROOM</p><h2>A chapter, a breather.</h2><p>How much time feels right?</p><div className="obs-duration" role="group" aria-label="Session length">{[5,10].map(n=><button key={n} aria-label={`${n} minutes`} aria-pressed={minutes===n} onClick={()=>setMinutes(n)}>{n}<small>minutes</small></button>)}</div><ol className="obs-session-plan"><li><span>01</span><div>Read a little<small>Three short notes to get the idea</small></div></li><li><span>02</span><div>Close the book. Try it.<small>{minutes===5?2:3} questions, at your pace</small></div></li><li><span>03</span><div>Find the connection<small>Reflect, then bookmark what needs a revisit.</small></div></li></ol><Primary disabled={!!sessionInProgress} onClick={()=>start()}>Open this chapter <ArrowIcon/></Primary><small className="obs-helper">{sessionInProgress?'Finish your saved session first, or discard it below.':'A suggested pace, never a countdown.'}</small>{sessionInProgress&&<button className="obs-text-button" onClick={()=>setResetOpen('session')}>Discard saved session</button>}</aside></div></section>
        <section className="obs-bottom-row"><div className="obs-revisit-card"><span className="obs-small-symbol"><SparkIcon/></span><div><h2>{review.length?'A second look can make it click.':'You don’t have to know it all yet.'}</h2><p>{review.length?`${review.length} questions are ready for another try, based on your answers and confidence.`:'Misses and uncertain answers will find a home here. No streaks to lose, no catching up.'}</p></div><button className="obs-secondary" onClick={()=>setScreen('review')}>Visit your review shelf <ArrowIcon/></button></div><div className="obs-history"><div className="obs-section-heading"><h2>Little discoveries</h2><span>{answered} unique questions explored</span></div>{progress.history.length?progress.history.slice(0,3).map(h=><div className="obs-history-row" key={h.id}><span><SparkIcon/></span><strong>{findChapter(h.chapterId).title}</strong><span>{h.correct}/{h.total} correct</span></div>):<p className="obs-muted">Your first completed session will appear here. Progress means what you tried, not a claim of mastery.</p>}</div></section>
      </>}
      {screen==='review'&&<section className="obs-review-page"><p className="obs-eyebrow">THE REVISIT SHELF</p><h1 ref={heading} tabIndex="-1">Let it click,<br/><em>one more time.</em></h1><p className="obs-page-deck">A wrong answer is a useful clue. So is a right answer you weren’t sure about.</p>{review.length?<><div className="obs-review-toolbar"><span>{review.length} questions to revisit</span><Primary disabled={!!sessionInProgress} onClick={startReview}>Practice this shelf <ArrowIcon/></Primary></div>{sessionInProgress&&<p className="obs-warning">You have a session in progress. <button className="obs-text-button" onClick={()=>setScreen('session')}>Continue it first</button></p>}<div className="obs-review-list">{review.map(r=>{const q=findQuestion(r.questionId);return <article className="obs-glass" key={q.id}><span className="obs-eyebrow">{chapterForQuestion(q.id).topic}</span><h2>{q.topic}</h2><p>{q.prompt}</p><span className="obs-review-reason">{r.selected!==q.answer?'Worth another look':'Correct, but you felt unsure'}</span></article>})}</div></>:<div className="obs-empty obs-glass"><span><SparkIcon/></span><h2>A little breathing room.</h2><p>Your review shelf is clear. Try a chapter and we’ll keep track of what could use another look.</p><Primary onClick={()=>setScreen('home')}>Explore your courses <ArrowIcon/></Primary></div>}</section>}
      {screen==='session'&&session&&<Session session={session} heading={heading} onPause={()=>setScreen('home')} onChange={updateSession} onSubmit={submit} onNext={()=>setProgress(advance)} onDone={()=>{setProgress(p=>({...p,session:null}));setScreen('home')}} onReview={()=>{setProgress(p=>({...p,session:null}));setScreen('review')}}/>}
    </main>
    <footer className="obs-footer"><span><strong>A Lumitudy preview.</strong> Bookshelf lessons are samples. Accounts and multiplayer use the connected service.</span><div><a href="https://lumitudy.vercel.app/" target="_blank" rel="noopener noreferrer">Open the current app</a><button onClick={()=>setResetOpen('all')}>Reset demo progress</button></div></footer>
    {resetOpen&&<ResetDialog kind={resetOpen} onCancel={()=>setResetOpen(false)} onConfirm={()=>{setProgress(p=>resetOpen==='all'?emptyProgress():{...p,session:null});setScreen('home');setResetOpen(false)}}/>}
  </div></>
}

function ResetDialog({kind,onCancel,onConfirm}) {
  const ref=useRef(null)
  useEffect(()=>{const dialog=ref.current;dialog.showModal();return()=>dialog.close()},[])
  return <dialog ref={ref} className="obs-dialog" onCancel={e=>{e.preventDefault();onCancel()}} aria-labelledby="reset-title"><h2 id="reset-title">{kind==='all'?'Start this demo fresh?':'Discard this session?'}</h2><p>{kind==='all'?'This clears only bookshelf sample progress in this browser.':'Your unfinished answers will be discarded. Completed sessions will remain.'} Your Lumitudy account and saved sets are unaffected.</p><div><button className="obs-secondary" autoFocus onClick={onCancel}>Keep my progress</button><Primary onClick={onConfirm}>{kind==='all'?'Reset prototype':'Discard session'}</Primary></div></dialog>
}

function Session({session:s,heading,onPause,onChange,onSubmit,onNext,onDone,onReview}) {
  const ch=findChapter(s.chapterId)
  const q=findQuestion(s.ids[s.index])
  const qChapter=chapterForQuestion(q.id)
  const correct=s.selected===q.answer
  const [sourceOpen,setSourceOpen]=useState(false)
  useEffect(()=>setSourceOpen(false),[s.index])
  const correctCount=s.results.filter(r=>r.selected===findQuestion(r.questionId).answer).length
  const revisit=s.results.filter(needsReview)
  return <section className="obs-session"><div className="obs-session-top"><button className="obs-text-button" onClick={onPause}>{s.stage==='recap'?'Back to bookshelf':'Save & leave'}</button><span>{s.mode==='review'?'REVISIT SESSION':ch.topic.toUpperCase()}</span><span>{s.stage==='read'?'Read → Recall → Reflect':`${s.results.length} / ${s.ids.length} checked`}</span></div><div className="obs-progress" role="progressbar" aria-label="Questions checked" aria-valuemin="0" aria-valuemax={s.ids.length} aria-valuenow={s.results.length}><span style={{width:`${s.results.length/s.ids.length*100}%`}}/></div>
    {s.stage==='read'?<div className="obs-reading obs-glass"><span className="obs-reading-symbol"><SparkIcon/></span><p className="obs-eyebrow">01 / MAKE A LITTLE CONNECTION</p><h1 ref={heading} tabIndex="-1">{ch.title}</h1><p className="obs-reading-deck">{ch.read}</p><div className="obs-reading-notes">{ch.notes.map((note,i)=><p key={note}><span>0{i+1}</span>{note}</p>)}</div><div className="obs-reading-bottom"><small>Original demo notes · {ch.topic}<br/>Prepared demo material. No live generation or uploaded files.</small><Primary onClick={()=>onChange({stage:'question'})}>I’m ready to try <ArrowIcon/></Primary></div></div>
    :s.stage==='recap'?<div className="obs-recap obs-glass"><div className="obs-recap-spark"><SparkIcon/></div><p className="obs-eyebrow">A LITTLE CLEARER THAN BEFORE</p><h1 ref={heading} tabIndex="-1">That’s a good<br/>place to pause.</h1><p>You checked {s.results.length} questions. Here’s what this session showed.</p><div className="obs-result-numbers"><div><strong>{correctCount}<small>/{s.results.length}</small></strong><span>Correct this session</span></div><div><strong>{revisit.length}</strong><span>Ready for another look</span></div></div><p className="obs-helper">This records your answers, not a mastery score.</p><div className="obs-result-list">{s.results.map(r=><div key={r.questionId}><span className={needsReview(r)?'obs-review-reason':'obs-settled'}>{needsReview(r)?'Revisit':'Correct & confident'}</span><span>{findQuestion(r.questionId).topic}</span></div>)}</div><div className="obs-recap-actions"><Primary onClick={onDone}>Back to my bookshelf <ArrowIcon/></Primary><button className="obs-secondary" onClick={onReview}>Open review shelf</button></div><small>Saved in this browser. You can pick up another chapter whenever you’re ready.</small></div>
    :<div className="obs-question-layout"><div className="obs-question-card obs-glass"><p className="obs-eyebrow">02 / TRY IT FROM MEMORY · {s.index+1} OF {s.ids.length}</p><h1 ref={heading} tabIndex="-1">{q.prompt}</h1><form onSubmit={onSubmit}><fieldset disabled={s.stage==='feedback'}><legend className="obs-sr-only">Choose an answer</legend><div className="obs-options">{q.options.map((text,i)=><label className={`obs-option ${s.selected===i?'is-selected':''} ${s.stage==='feedback'&&i===q.answer?'is-correct':''} ${s.stage==='feedback'&&s.selected===i&&!correct?'is-missed':''}`} key={text}><input type="radio" name="answer" aria-label={text} value={i} checked={s.selected===i} onChange={()=>onChange({selected:i})}/><span className="obs-option-letter">{String.fromCharCode(65+i)}</span><span>{text}</span>{s.stage==='feedback'&&i===q.answer&&<small>Correct</small>}</label>)}</div></fieldset>{s.stage==='question'&&<><fieldset className="obs-confidence"><legend>How does that answer feel?</legend>{[['sure','I can explain it'],['unsure','I’m not sure yet']].map(([value,label])=><label key={value} className={s.confidence===value?'is-selected':''}><input type="radio" name="confidence" checked={s.confidence===value} onChange={()=>onChange({confidence:value})}/>{label}</label>)}</fieldset><Primary type="submit" disabled={s.selected===null||!s.confidence}>Check my thinking <ArrowIcon/></Primary></>}</form>
    {s.stage==='feedback'&&<div className={`obs-feedback ${correct?'correct':'revisit'}`}><div role="status"><span className="obs-eyebrow">03 / MAKE THE CONNECTION</span><h2>{correct?'You’ve got the idea.':'There’s a useful clue here.'}</h2><p>{q.why}</p></div>{!correct&&<div className="obs-reflection"><h3>What led you there?</h3><p>Choose a reflection to unpack the mistake.</p><div role="group" aria-label="Reflect on your answer">{[['mixed','I mixed up two ideas'],['rushed','I read it too quickly'],['new','This is new to me']].map(([value,label])=><button key={value} aria-pressed={s.reflection===value} onClick={()=>onChange({reflection:value})}>{label}</button>)}</div>{s.reflection&&<p className="obs-reflection-note" role="status">{s.reflection==='mixed'?q.nudge:s.reflection==='rushed'?`Pause on the key distinction: ${q.nudge}`:`Start with this anchor: ${qChapter.notes[q.source]}`}<small>Prepared guidance for this demo, not an AI analysis of your reasoning.</small></p>}</div>}<div className="obs-feedback-bottom"><span>{!correct||s.confidence==='unsure'?'Added to your review shelf when you finish.':'A confident connection.'}</span><Primary onClick={onNext}>{s.index+1===s.ids.length?'See my session recap':'Next question'} <ArrowIcon/></Primary></div></div>}
    </div><aside className="obs-source-panel obs-glass"><span className="obs-source-icon"><CourseIcon kind={courses.find(c=>c.chapters.some(chapter=>chapter.id===qChapter.id)).symbol}/></span><p className="obs-eyebrow">KEEP THE SOURCE CLOSE</p><h2>A place to check your thinking.</h2><p>Try recalling first. The relevant note is here whenever you need it.</p><button className="obs-secondary" aria-expanded={sourceOpen} onClick={()=>setSourceOpen(!sourceOpen)}>{sourceOpen?'Close source note':'Open source note'}</button>{sourceOpen&&<div className="obs-source-quote"><blockquote>{qChapter.notes[q.source]}</blockquote><p>{qChapter.title} · Note {q.source+1}</p><small>Original demo notes. Not a quotation from an uploaded book.</small></div>}</aside></div>}
  </section>
}
