import { courses, findChapter, findQuestion } from './lessons'
export const STORAGE_KEY = 'lumitudy-observatory-v1'
export const emptyProgress = () => ({ version:1, courseId:'biology', chapterId:'membranes', session:null, answers:{}, history:[] })
const validResult = r => r && findQuestion(r.questionId) && Number.isInteger(r.selected) && r.selected >= 0 && r.selected < findQuestion(r.questionId).options.length && ['sure','unsure'].includes(r.confidence)
export function readProgress(storage) {
  try {
    const value = JSON.parse(storage.getItem(STORAGE_KEY))
    const course = courses.find(c => c.id === value?.courseId)
    if (value?.version !== 1 || !course?.chapters.some(ch => ch.id === value.chapterId)) return emptyProgress()
    if (!value.answers || Array.isArray(value.answers) || typeof value.answers !== 'object' || !Object.entries(value.answers).every(([id,r]) => id === r.questionId && validResult(r))) return emptyProgress()
    if (!Array.isArray(value.history) || value.history.length > 50 || !value.history.every(h => typeof h.id === 'string' && findChapter(h.chapterId) && Number.isInteger(h.total) && h.total > 0 && h.total <= 18 && Number.isInteger(h.correct) && h.correct >= 0 && h.correct <= h.total)) return emptyProgress()
    const s = value.session
    if (s !== null) {
      if (!s || typeof s.id !== 'string' || !findChapter(s.chapterId) || !['lesson','review'].includes(s.mode) || !Array.isArray(s.ids) || !s.ids.length || s.ids.length > 18 || new Set(s.ids).size !== s.ids.length || !s.ids.every(id => findQuestion(id)) || !['read','question','feedback','recap'].includes(s.stage) || !Number.isInteger(s.index) || s.index < 0 || s.index >= s.ids.length || !Array.isArray(s.results)) return emptyProgress()
      const expected = s.stage === 'read' || s.stage === 'question' ? s.index : s.stage === 'feedback' ? s.index + 1 : s.ids.length
      if (s.results.length !== expected || !s.results.every((r,i) => validResult(r) && r.questionId === s.ids[i])) return emptyProgress()
      if (s.selected !== null && (!Number.isInteger(s.selected) || s.selected < 0 || s.selected >= findQuestion(s.ids[s.index]).options.length)) return emptyProgress()
      if (s.confidence !== null && !['sure','unsure'].includes(s.confidence)) return emptyProgress()
      if (s.stage === 'feedback' && (s.selected !== s.results.at(-1).selected || s.confidence !== s.results.at(-1).confidence)) return emptyProgress()
      if (s.reflection !== null && !['mixed','rushed','new'].includes(s.reflection)) return emptyProgress()
    }
    return value
  } catch { return emptyProgress() }
}
export const needsReview = result => result.selected !== findQuestion(result.questionId).answer || result.confidence === 'unsure'
export function createSession(chapterId, ids, mode='lesson') {
  return {id:crypto.randomUUID(),chapterId,ids,mode,index:0,stage:mode === 'review' ? 'question':'read',selected:null,confidence:null,results:[],reflection:null}
}
export function advance(progress) {
  const s = progress.session
  if (!s || s.stage !== 'feedback') return progress
  if (s.index + 1 < s.ids.length) return {...progress,session:{...s,index:s.index+1,stage:'question',selected:null,confidence:null,reflection:null}}
  const answers = {...progress.answers}
  s.results.forEach(r => { answers[r.questionId] = r })
  const record = {id:s.id,chapterId:s.chapterId,total:s.results.length,correct:s.results.filter(r => r.selected === findQuestion(r.questionId).answer).length}
  return {...progress,answers,history:[record,...progress.history.filter(h => h.id !== s.id)].slice(0,50),session:{...s,stage:'recap'}}
}
