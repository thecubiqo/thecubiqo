/**
 * Auth UI smoke test
 *
 * Simulates the magic-link flow (mocked) and verifies that:
 * 1. The Sign In button is shown for unauthenticated users
 * 2. After auth state change, the user avatar replaces the Sign In button
 *    without a full page refresh (reactive via onAuthStateChange)
 * 3. Non-standard auth events without session still resolve loading state
 * 4. Safety timeout resolves loading if onAuthStateChange never fires
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AuthProvider } from '@/contexts/AuthContext'
import { AuthButton } from '@/components/AuthButton.client'

// --- Supabase mock with stateful session ---

type AuthSession = { user: { id: string; email: string } } | null
type AuthCallback = (event: string, session: AuthSession) => void

/** Simulated current session — new subscribers receive it immediately */
let currentSession: AuthSession = null
let listeners: AuthCallback[] = []
/** Controls whether onAuthStateChange fires the initial event */
let suppressInitialEvent = false

function simulateSignIn(user: { id: string; email: string }) {
  currentSession = { user }
  listeners.forEach(cb => cb('SIGNED_IN', currentSession))
}

function simulateAuthEvent(event: string, session: AuthSession) {
  listeners.forEach(cb => cb(event, session))
}

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => true,
  createClient: () => ({
    auth: {
      onAuthStateChange: (cb: AuthCallback) => {
        listeners.push(cb)
        // Deliver current state to new subscriber asynchronously
        if (!suppressInitialEvent) {
          const session = currentSession
          Promise.resolve().then(() => {
            if (session) {
              cb('INITIAL_SESSION', session)
            } else {
              cb('INITIAL_SESSION', null)
            }
          })
        }
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                listeners = listeners.filter(l => l !== cb)
              },
            },
          },
        }
      },
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'not found' } }),
        }),
      }),
    }),
  }),
}))

// --- Helper wrapper ---

function TestApp() {
  return (
    <AuthProvider>
      <AuthButton onSignInClick={() => { }} onUserClick={() => { }} />
    </AuthProvider>
  )
}

// --- Tests ---

describe('AuthButton smoke test', () => {
  beforeEach(() => {
    currentSession = null
    listeners = []
    suppressInitialEvent = false
  })

  it('shows Sign In button when user is not authenticated', async () => {
    render(<TestApp />)

    await waitFor(() => {
      expect(screen.getByTestId('sign-in-button')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('user-avatar')).not.toBeInTheDocument()
  })

  it('replaces Sign In button with user avatar after magic-link auth', async () => {
    render(<TestApp />)

    // Wait for initial guest state
    await waitFor(() => {
      expect(screen.getByTestId('sign-in-button')).toBeInTheDocument()
    })

    // Simulate magic-link callback: Supabase fires SIGNED_IN with user session
    await act(async () => {
      simulateSignIn({ id: 'user-123', email: 'alice@example.com' })
      // Allow microtasks (profile fetch, re-subscription) to settle
      await new Promise(r => setTimeout(r, 50))
    })

    // User avatar should now be visible
    await waitFor(() => {
      expect(screen.getByTestId('user-avatar')).toBeInTheDocument()
    })

    // Sign In button should be gone
    expect(screen.queryByTestId('sign-in-button')).not.toBeInTheDocument()

    // Avatar should show user initial
    expect(screen.getByTestId('user-avatar')).toHaveTextContent('A')

    // Username portion should be visible
    expect(screen.getByText('alice')).toBeInTheDocument()
  })

  it('shows Sign In when non-standard auth event fires without session', async () => {
    render(<TestApp />)

    // Fire a TOKEN_REFRESHED event with no session (instead of INITIAL_SESSION)
    // Previously this would leave isLoading stuck at true forever
    await act(async () => {
      simulateAuthEvent('TOKEN_REFRESHED', null)
      await new Promise(r => setTimeout(r, 10))
    })

    // Should show Sign In button (not stuck on loading)
    await waitFor(() => {
      expect(screen.getByTestId('sign-in-button')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('auth-button-loading')).not.toBeInTheDocument()
  })

  it('falls back to Sign In after timeout if onAuthStateChange never fires', async () => {
    // Suppress the initial event to simulate Supabase being unreachable
    suppressInitialEvent = true

    render(<TestApp />)

    // Initially should show loading state
    expect(screen.getByTestId('auth-button-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('sign-in-button')).not.toBeInTheDocument()

    // Wait for the 4-second safety timeout to resolve loading
    await waitFor(() => {
      expect(screen.getByTestId('sign-in-button')).toBeInTheDocument()
    }, { timeout: 6000 })

    expect(screen.queryByTestId('auth-button-loading')).not.toBeInTheDocument()
  }, 10000) // Increase test timeout to 10s for this test
})
