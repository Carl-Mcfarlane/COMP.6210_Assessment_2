import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProtectedRoute from '../../src/components/ProtectedRoute.jsx'
import { useAuth } from '../../src/hooks/useAuth.js'

vi.mock('../../src/hooks/useAuth.js', () => ({ useAuth: vi.fn() }))

function renderRoute(adminOnly = false) {
  return render(
    <MemoryRouter initialEntries={['/secret']}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/catalogue" element={<p>Catalogue page</p>} />
        <Route
          path="/secret"
          element={(
            <ProtectedRoute adminOnly={adminOnly}>
              <p>Secret content</p>
            </ProtectedRoute>
          )}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => vi.resetAllMocks())

  it('renders nothing while the session is still loading', () => {
    useAuth.mockReturnValue({ user: null, role: null, loading: true })
    const { container } = renderRoute()
    expect(container).toBeEmptyDOMElement()
  })

  it('sends signed-out visitors to the login page', () => {
    useAuth.mockReturnValue({ user: null, role: null, loading: false })
    renderRoute()
    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument()
  })

  it('lets any signed-in user through', () => {
    useAuth.mockReturnValue({ user: { id: 'u1' }, role: 'user', loading: false })
    renderRoute()
    expect(screen.getByText('Secret content')).toBeInTheDocument()
  })

  it('keeps ordinary users out of admin-only routes', () => {
    useAuth.mockReturnValue({ user: { id: 'u1' }, role: 'user', loading: false })
    renderRoute(true)
    expect(screen.getByText('Catalogue page')).toBeInTheDocument()
  })

  it('lets admins into admin-only routes', () => {
    useAuth.mockReturnValue({ user: { id: 'a1' }, role: 'admin', loading: false })
    renderRoute(true)
    expect(screen.getByText('Secret content')).toBeInTheDocument()
  })
})
