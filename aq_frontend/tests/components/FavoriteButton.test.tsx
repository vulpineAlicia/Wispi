import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import FavoriteButton from '../../src/components/shared/FavoriteButton'
import { AuthContext } from '../../src/contexts/authContextDef'
import type { AuthContextValue } from '../../src/contexts/authContextDef'
import { FavoritesContext } from '../../src/contexts/favoritesContextDef'
import type { FavoritesContextValue } from '../../src/contexts/favoritesContextDef'

const DEFAULT_PROPS = { name: 'London', country: 'GB', lat: 51.5, lon: -0.1 }

const LOGGED_IN_USER = { id: '1', nickname: 'tester', avatar_id: 0 }

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

function makeFavorites(overrides: Partial<FavoritesContextValue> = {}): FavoritesContextValue {
  return {
    favorites: [],
    loading: false,
    error: null,
    canAdd: true,
    isFavorite: vi.fn(() => false),
    getFavoriteId: vi.fn(() => undefined),
    add: vi.fn(),
    remove: vi.fn(),
    ...overrides,
  }
}

function renderButton(
  auth: AuthContextValue,
  favorites: FavoritesContextValue,
  props = DEFAULT_PROPS,
) {
  return render(
    <AuthContext.Provider value={auth}>
      <FavoritesContext.Provider value={favorites}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<FavoriteButton {...props} />} />
            <Route path="/auth" element={<div>Auth Page</div>} />
          </Routes>
        </MemoryRouter>
      </FavoritesContext.Provider>
    </AuthContext.Provider>
  )
}

describe('FavoriteButton', () => {
  it('shows "Sign in to save cities" title when no user is logged in', () => {
    renderButton(makeAuth(), makeFavorites())
    expect(screen.getByRole('button', { name: 'Sign in to save cities' })).toBeInTheDocument()
  })

  it('shows "Add to favourites" when user is logged in and city is not saved', () => {
    renderButton(
      makeAuth({ user: LOGGED_IN_USER }),
      makeFavorites({ isFavorite: vi.fn(() => false), canAdd: true }),
    )
    expect(screen.getByRole('button', { name: 'Add to favourites' })).toBeInTheDocument()
  })

  it('shows "Remove from favourites" when city is already saved', () => {
    renderButton(
      makeAuth({ user: LOGGED_IN_USER }),
      makeFavorites({ isFavorite: vi.fn(() => true), getFavoriteId: vi.fn(() => 'fav-1') }),
    )
    expect(screen.getByRole('button', { name: 'Remove from favourites' })).toBeInTheDocument()
  })

  it('shows "Favourites limit reached (10)" and disables the button when canAdd is false', () => {
    renderButton(
      makeAuth({ user: LOGGED_IN_USER }),
      makeFavorites({ isFavorite: vi.fn(() => false), canAdd: false }),
    )
    const btn = screen.getByRole('button', { name: 'Favourites limit reached (10)' })
    expect(btn).toBeDisabled()
  })

  it('navigates to /auth when unauthenticated user clicks the button', () => {
    renderButton(makeAuth({ user: null }), makeFavorites())
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Auth Page')).toBeInTheDocument()
  })

  it('calls add() with correct city data when clicking an unsaved city', async () => {
    const add = vi.fn()
    renderButton(
      makeAuth({ user: LOGGED_IN_USER, getToken: vi.fn(() => 'tok') }),
      makeFavorites({ isFavorite: vi.fn(() => false), canAdd: true, add }),
    )
    await act(async () => { fireEvent.click(screen.getByRole('button')) })
    expect(add).toHaveBeenCalledWith({ name: 'London', country: 'GB', lat: 51.5, lon: -0.1 })
  })

  it('calls remove() with the favorite id when clicking a saved city', async () => {
    const remove = vi.fn()
    renderButton(
      makeAuth({ user: LOGGED_IN_USER, getToken: vi.fn(() => 'tok') }),
      makeFavorites({ isFavorite: vi.fn(() => true), getFavoriteId: vi.fn(() => 'fav-99'), remove }),
    )
    await act(async () => { fireEvent.click(screen.getByRole('button')) })
    expect(remove).toHaveBeenCalledWith('fav-99')
  })

  it('renders a filled heart SVG when the city is favorited', () => {
    const { container } = renderButton(
      makeAuth({ user: LOGGED_IN_USER }),
      makeFavorites({ isFavorite: vi.fn(() => true) }),
    )
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('fill')).toBe('currentColor')
  })

  it('renders an outlined heart SVG when the city is not favorited', () => {
    const { container } = renderButton(
      makeAuth({ user: LOGGED_IN_USER }),
      makeFavorites({ isFavorite: vi.fn(() => false) }),
    )
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('fill')).toBe('none')
  })
})
