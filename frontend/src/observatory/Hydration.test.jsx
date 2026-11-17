import { StrictMode, act } from 'react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import { fireEvent, within } from '@testing-library/react'
import Observatory from './Observatory'
import { courses } from './lessons'
import { createSession, emptyProgress, STORAGE_KEY } from './progress'

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: null, loading: false }) }))

afterEach(() => {
  localStorage.clear()
  document.documentElement.dataset.theme = 'day'
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('hydrates a saved session and night theme without replacing existing progress', async () => {
  vi.stubGlobal('scrollTo', vi.fn())
  const course = courses[1]
  const chapter = course.chapters[0]
  const progress = {
    ...emptyProgress(), courseId: course.id, chapterId: chapter.id,
    session: createSession(chapter.id, chapter.questions.slice(0, 2).map(q => q.id)),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  localStorage.setItem('lumitudy-theme', 'night')
  document.documentElement.dataset.theme = 'night'
  const write = vi.spyOn(Storage.prototype, 'setItem')
  const recoverable = vi.fn()
  const element = <StrictMode><Observatory /></StrictMode>
  const container = document.createElement('div')
  container.innerHTML = renderToString(element)
  expect(container.textContent).not.toContain('Continue session')
  document.body.append(container)
  let root
  try {
    await act(async () => { root = hydrateRoot(container, element, { onRecoverableError: recoverable }) })
    expect(recoverable).not.toHaveBeenCalled()
    expect(within(container).getByRole('button', { name: /Continue session/ })).toBeTruthy()
    expect(within(container).getByRole('button', { name: 'Switch to day theme' })).toBeTruthy()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(progress)
    const progressWrites = write.mock.calls.filter(([key]) => key === STORAGE_KEY)
    expect(progressWrites.length).toBeGreaterThan(0)
    for (const [, value] of progressWrites) expect(JSON.parse(value).session.id).toBe(progress.session.id)
    expect(localStorage.getItem('lumitudy-theme')).toBe('night')
    await act(async () => { fireEvent.click(within(container).getByRole('button', { name: 'Switch to day theme' })) })
    expect(localStorage.getItem('lumitudy-theme')).toBe('day')
    expect(document.documentElement.dataset.theme).toBe('day')
  } finally {
    if (root) await act(async () => root.unmount())
    container.remove()
  }
})
