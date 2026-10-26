import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios, { getSession, setSession } from '../api'
import { AuthProvider } from '../context/AuthContext'
import Observatory from './Observatory'

vi.mock('../api',()=>({default:{get:vi.fn(),post:vi.fn()},getSession:vi.fn(),setSession:vi.fn()}))
let sockets
class Socket {
  constructor(url) { this.url=url;this.close=vi.fn();this.send=vi.fn();sockets.push(this) }
}
const identity={email:'reader@example.test',username:'reader',friend_code:'LUMI-1234'}
const session={user:identity,csrf_token:'test-csrf'}
function app() { return render(<AuthProvider><Observatory/></AuthProvider>) }
async function fillLogin(user) {
  await user.type(screen.getByLabelText('Email address'),'reader@example.test')
  await user.type(screen.getByLabelText('Password'),'test-password')
}
async function signedIn(user) {
  getSession.mockResolvedValue(session)
  app()
  await screen.findByRole('button',{name:'My account'})
  await user.click(screen.getByRole('button',{name:'Play together'}))
}
beforeEach(()=>{
  localStorage.clear();vi.clearAllMocks();sockets=[]
  vi.stubEnv('VITE_API_URL','/api')
  vi.stubGlobal('WebSocket',Socket);vi.stubGlobal('scrollTo',vi.fn())
  axios.get.mockResolvedValue({data:[]})
  getSession.mockResolvedValue({user:null,csrf_token:'anonymous-csrf'})
  axios.post.mockResolvedValue({data:session})
})
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.unstubAllEnvs()})

it('returns from login to multiplayer and joins with a code without loading a textbook',async()=>{
  const user=userEvent.setup();app()
  await user.click(screen.getByRole('button',{name:'Play together'}))
  await user.click(screen.getByRole('button',{name:'Log in or sign up to play'}))
  await fillLogin(user)
  await user.click(screen.getByRole('button',{name:'Log in to Lumitudy'}))
  await user.click(await screen.findByRole('button',{name:/Join with a code/}))
  await user.type(screen.getByLabelText('Game code'),' game-ab12 ')
  await user.click(screen.getByRole('button',{name:'Join game'}))
  expect(axios.post).toHaveBeenCalledWith('/auth/login',{email:identity.email,password:'test-password'})
  expect(axios.get).not.toHaveBeenCalledWith('/upload/files',expect.anything())
  expect(sockets).toHaveLength(1)
  expect(sockets[0].url).toContain('/api/game/ws/GAME-AB12/reader')
  expect(new URL(sockets[0].url).search).toBe('')
  expect(localStorage.getItem('token')).toBeNull()
  await act(async()=>{sockets[0].onopen();sockets[0].onmessage({data:JSON.stringify({type:'player_joined',players:['host','reader']})})})
  expect(screen.getByText('Game Lobby')).toBeTruthy()
  await user.click(screen.getByRole('button',{name:'My bookshelf'}))
  expect(sockets[0].close).toHaveBeenCalledOnce()
})

it('creates an account through the existing endpoint and logs out without erasing sample progress',async()=>{
  const user=userEvent.setup();app()
  await user.click(await screen.findByRole('button',{name:'Log in / Sign up'}))
  await user.click(screen.getByRole('button',{name:'Sign up',exact:true}))
  await fillLogin(user);await user.type(screen.getByLabelText('Username'),'reader')
  await user.click(screen.getByRole('button',{name:'Create your account'}))
  await user.click(await screen.findByRole('button',{name:'My account'}))
  expect(axios.post).toHaveBeenCalledWith('/auth/register',{email:identity.email,username:'reader',password:'test-password'})
  expect(screen.getByText('LUMI-1234')).toBeTruthy()
  await user.click(screen.getByRole('button',{name:'Log out'}))
  expect(localStorage.getItem('token')).toBeNull()
  expect(localStorage.getItem('lumitudy-observatory-v1')).toBeTruthy()
  expect(screen.getByLabelText('Email address')).toBeTruthy()
})

it('loads account textbooks for hosting and sends the selected chapter to create a room',async()=>{
  const user=userEvent.setup();await signedIn(user)
  axios.get.mockResolvedValue({data:[{id:4,filename:'Biology.pdf',file_path:'/uploads/4/book.pdf',chapters:['Cells','Enzymes']}]})
  await user.click(screen.getByRole('button',{name:/Host a game/}))
  await user.click(await screen.findByRole('button',{name:/Biology.pdf/}))
  await user.selectOptions(screen.getByLabelText('Chapter to play'),'Enzymes')
  axios.post.mockResolvedValue({data:{game_code:'GAME-AB12'}})
  await user.click(screen.getByRole('button',{name:'Create game'}))
  await waitFor(()=>expect(sockets).toHaveLength(1))
  expect(axios.post).toHaveBeenCalledWith('/game/create',{file_path:'/uploads/4/book.pdf',chapter:'Enzymes',num_questions:10})
  expect(screen.queryByLabelText('Game code')).toBeNull()
})

it('shows library errors with retry and makes socket disconnects recoverable',async()=>{
  const user=userEvent.setup();await signedIn(user)
  axios.get.mockRejectedValueOnce(new Error('offline'))
  await user.click(screen.getByRole('button',{name:/Host a game/}))
  expect(await screen.findByRole('alert')).toBeTruthy()
  await user.click(screen.getByRole('button',{name:'Retry library'}))
  expect(await screen.findByText('Your library is ready for its first textbook.')).toBeTruthy()
  await user.click(screen.getByRole('button',{name:'Back to play together / Leave game'}))
  await user.click(screen.getByRole('button',{name:/Join with a code/}))
  await user.type(screen.getByLabelText('Game code'),'GAME-AB12')
  await user.click(screen.getByRole('button',{name:'Join game'}))
  await act(async()=>sockets[0].onclose())
  expect(screen.getByRole('alert').textContent).toContain('connection closed')
  expect(screen.getByRole('button',{name:'Join game'}).disabled).toBe(false)
})


it('keeps the account visible and explains a failed server logout',async()=>{
  const user=userEvent.setup();await signedIn(user)
  await user.click(screen.getByRole('button',{name:'My account'}))
  axios.post.mockRejectedValueOnce(new Error('offline'))
  await user.click(screen.getByRole('button',{name:'Log out'}))
  expect((await screen.findByRole('alert')).textContent).toContain('session is still active')
  expect(screen.getByText(identity.email)).toBeTruthy()
})

it('restores the server session and removes legacy local credentials',async()=>{
  localStorage.setItem('token','old-token')
  getSession.mockResolvedValue(session)
  app()
  expect(await screen.findByRole('button',{name:'My account'})).toBeTruthy()
  expect(localStorage.getItem('token')).toBeNull()
})
