import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from '../../src/components/shared/ProtectedRoute'
import { AuthContext } from '../../src/contexts/authContextDef'
import type { AuthContextValue } from '../../src/contexts/authContextDef'
import { vi } from 'vitest'

function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    accessToken: null,
    isLoading: false,
    signIn: vi.fn(),
    register: vi.fn(),
    signOut: vi.fn(),
    getToken: vi.fn(() => null),
    ...overrides,
  }
}

function renderRoute(auth: AuthContextValue) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
          <Route path="/auth" element={<div>Auth Page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

describe('ProtectedRoute', () => {
  it('renders nothing while auth is loading', () => {
    const { container } = renderRoute(makeAuth({ isLoading: true }))
    expect(container).toBeEmptyDOMElement()
  })

  it('redirects to /auth when there is no user', () => {
    renderRoute(makeAuth({ user: null, isLoading: false }))
    expect(screen.getByText('Auth Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders the outlet when a user is logged in', () => {
    const user = { id: '1', nickname: 'tester', avatar_id: 0 }
    renderRoute(makeAuth({ user, isLoading: false }))
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(screen.queryByText('Auth Page')).not.toBeInTheDocument()
  })
})
