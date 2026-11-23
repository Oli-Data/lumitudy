import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import App from './App'
import { useAuth } from './context/AuthContext'

vi.mock('./context/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('./api', () => ({ default: { get: vi.fn().mockResolvedValue({ data: [] }) } }))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it('lands at the upload controls after authentication without opening the picker', () => {
  const scrollIntoView = vi.fn()
  const scrollDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView')
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView })
  try {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click')
    useAuth.mockReturnValue({ user: null, loading: false })
    const { rerender } = render(<App uploadIntent />)

    const navigation = screen.getByRole('navigation', { name: 'Study navigation' })
    expect(screen.getByRole('link', { name: 'My textbooks' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('link', { name: 'My bookshelf' }).getAttribute('href')).toBe('/')
    expect(screen.getByText('Log in or create an account to upload your textbook.')).toBeTruthy()
    expect(screen.queryByLabelText('Upload textbook')).toBeNull()

    useAuth.mockReturnValue({ user: 'test@example.test', loading: false })
    rerender(<App uploadIntent />)

    expect(screen.getByRole('navigation', { name: 'Study navigation' })).toBe(navigation)
    expect(document.activeElement).toBe(screen.getByRole('region', { name: 'Start with your textbook.' }))
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' })
    expect(screen.getByLabelText('Upload textbook').value).toBe('')
    expect(click).not.toHaveBeenCalled()
  } finally {
    if (scrollDescriptor) Object.defineProperty(Element.prototype, 'scrollIntoView', scrollDescriptor)
    else delete Element.prototype.scrollIntoView
  }
})
