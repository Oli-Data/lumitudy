import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Observatory from './Observatory'
import { STORAGE_KEY, readProgress } from './progress'

vi.mock('../context/AuthContext',()=>({useAuth:()=>({user:null,loading:false})}))

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('scrollTo',vi.fn())
})
afterEach(() => { cleanup();vi.unstubAllGlobals() })

async function shortSession(user) {
  await user.click(screen.getByRole('button',{name:'5 minutes'}))
  await user.click(screen.getByRole('button',{name:/Open this chapter/}))
  await user.click(screen.getByRole('button',{name:/I’m ready to try/}))
}
async function answer(user, name, confidence='I can explain it') {
  await user.click(screen.getByRole('radio',{name}))
  await user.click(screen.getByRole('radio',{name:confidence}))
  await user.click(screen.getByRole('button',{name:/Check my thinking/}))
}

describe('Observatory learning loop',()=>{
  it('keeps missed or uncertain questions for review and removes them after a confident correct retry',async()=>{
    const user=userEvent.setup()
    render(<Observatory/>)
    await shortSession(user)
    expect(screen.getByRole('button',{name:/Check my thinking/}).disabled).toBe(true)
    await answer(user,/^Active transport$/)
    await user.click(screen.getByRole('button',{name:'I mixed up two ideas'}))
    expect(screen.getByText(/Separate the route from the energy requirement/)).toBeTruthy()
    await user.click(screen.getByRole('button',{name:'Open source note'}))
    expect(screen.getByRole('blockquote').textContent).toContain('Facilitated diffusion uses a protein')
    await user.click(screen.getByRole('button',{name:/Next question/}))
    await answer(user,/A small, nonpolar molecule/,'I’m not sure yet')
    await user.click(screen.getByRole('button',{name:/See my session recap/}))
    let saved=JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(saved.history).toHaveLength(1)
    expect(saved.history[0]).toMatchObject({correct:1,total:2})
    await user.click(screen.getByRole('button',{name:'Open review shelf'}))
    expect(screen.getByText('2 questions to revisit')).toBeTruthy()
    await user.click(screen.getByRole('button',{name:/Practice this shelf/}))
    await answer(user,/^Facilitated diffusion$/)
    await user.click(screen.getByRole('button',{name:/Next question/}))
    await answer(user,/A small, nonpolar molecule/)
    await user.click(screen.getByRole('button',{name:/See my session recap/}))
    await user.click(screen.getByRole('button',{name:'Open review shelf'}))
    expect(screen.getByText('Your review shelf is clear. Try a chapter and we’ll keep track of what could use another look.')).toBeTruthy()
    saved=JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(saved.history).toHaveLength(2)
    expect(saved.history[0]).toMatchObject({correct:2,total:2})
  })
  it('restores an in-progress answer without double-counting it after a reload',async()=>{
    const user=userEvent.setup()
    const first=render(<Observatory/>)
    await shortSession(user)
    await answer(user,/^Facilitated diffusion$/)
    await user.click(screen.getByRole('button',{name:'Save & leave'}))
    first.unmount()
    render(<Observatory/>)
    await user.click(screen.getByRole('button',{name:/Continue session/}))
    expect(screen.getByText('You’ve got the idea.')).toBeTruthy()
    await user.click(screen.getByRole('radio',{name:/^Active transport$/}))
    expect(screen.getByRole('radio',{name:/^Facilitated diffusion$/}).checked).toBe(true)
    await user.click(screen.getByRole('button',{name:/Next question/}))
    await answer(user,/A small, nonpolar molecule/)
    await user.click(screen.getByRole('button',{name:/See my session recap/}))
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(saved.history).toHaveLength(1)
    expect(saved.history[0]).toMatchObject({correct:2,total:2})
  })
  it('opens the selected course chapter with its own material',async()=>{
    const user=userEvent.setup()
    render(<Observatory/>)
    await user.click(screen.getByRole('button',{name:/COMPUTER SCIENCE Thinking in systems/}))
    await user.click(screen.getByRole('button',{name:/Remembering a changing world/}))
    await user.click(screen.getByRole('button',{name:/Open this chapter/}))
    expect(screen.getByRole('heading',{level:1,name:'Remembering a changing world'})).toBeTruthy()
    expect(screen.getByText(/It does not automatically synchronize data across devices/)).toBeTruthy()
  })
  it('recovers from malformed saved data while leaving real app keys alone',()=>{
    localStorage.setItem('token','real-app-placeholder')
    localStorage.setItem(STORAGE_KEY,'{"version":1,"session":{}}')
    expect(readProgress(localStorage).session).toBeNull()
    render(<Observatory/>)
    expect(screen.getByRole('heading',{level:1,name:/A little more curious/})).toBeTruthy()
    expect(localStorage.getItem('token')).toBe('real-app-placeholder')
  })
})
