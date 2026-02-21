import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('PWAInstallPrompt', () => {
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    // Default: not standalone, not iOS
    originalMatchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockReturnValue({ matches: false })
    localStorage.clear()
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
      configurable: true,
    })
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    vi.restoreAllMocks()
  })

  it('renders nothing by default (no beforeinstallprompt fired)', () => {
    const { container } = render(<PWAInstallPrompt />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when already in standalone mode', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    const { container } = render(<PWAInstallPrompt />)
    expect(container.innerHTML).toBe('')
  })

  it('shows install banner when beforeinstallprompt fires', async () => {
    render(<PWAInstallPrompt />)

    await act(async () => {
      const event = new Event('beforeinstallprompt') as any
      event.preventDefault = vi.fn()
      event.prompt = vi.fn().mockResolvedValue(undefined)
      event.userChoice = Promise.resolve({ outcome: 'dismissed' as const })
      window.dispatchEvent(event)
    })

    // Component has <h3>Install CubiQo</h3> and <button>Install CubiQo</button>
    const installElements = screen.getAllByText('Install CubiQo')
    expect(installElements.length).toBeGreaterThanOrEqual(1)
    // The heading is an h3
    expect(installElements.some(el => el.tagName === 'H3')).toBe(true)
    // The action button
    expect(installElements.some(el => el.tagName === 'BUTTON')).toBe(true)
    // Dismiss button says "Later"
    expect(screen.getByText('Later')).toBeDefined()
  })

  it('hides banner when dismissed and sets localStorage cooldown', async () => {
    render(<PWAInstallPrompt />)

    await act(async () => {
      const event = new Event('beforeinstallprompt') as any
      event.preventDefault = vi.fn()
      event.prompt = vi.fn().mockResolvedValue(undefined)
      event.userChoice = Promise.resolve({ outcome: 'dismissed' as const })
      window.dispatchEvent(event)
    })

    // Title heading appears in banner
    const heading = screen.getAllByText('Install CubiQo').find(el => el.tagName === 'H3')
    expect(heading).toBeDefined()

    await act(async () => {
      fireEvent.click(screen.getByText('Later'))
    })

    expect(localStorage.getItem('pwa-install-dismissed')).toBeTruthy()
  })

  it('does not show banner if dismissed within 24h', async () => {
    localStorage.setItem('pwa-install-dismissed', String(Date.now()))

    render(<PWAInstallPrompt />)

    await act(async () => {
      const event = new Event('beforeinstallprompt') as any
      event.preventDefault = vi.fn()
      event.prompt = vi.fn().mockResolvedValue(undefined)
      event.userChoice = Promise.resolve({ outcome: 'dismissed' as const })
      window.dispatchEvent(event)
    })

    expect(screen.queryAllByText('Install CubiQo')).toHaveLength(0)
  })

  it('shows banner if dismiss cooldown has expired', async () => {
    // Set dismissed timestamp to 25 hours ago
    localStorage.setItem('pwa-install-dismissed', String(Date.now() - 25 * 60 * 60 * 1000))

    render(<PWAInstallPrompt />)

    await act(async () => {
      const event = new Event('beforeinstallprompt') as any
      event.preventDefault = vi.fn()
      event.prompt = vi.fn().mockResolvedValue(undefined)
      event.userChoice = Promise.resolve({ outcome: 'dismissed' as const })
      window.dispatchEvent(event)
    })

    const installElements = screen.getAllByText('Install CubiQo')
    expect(installElements.length).toBeGreaterThanOrEqual(1)
  })

  it('shows iOS instructions on iOS Safari', async () => {
    vi.useFakeTimers()

    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true,
    })

    render(<PWAInstallPrompt />)

    await act(async () => {
      vi.advanceTimersByTime(3500)
    })

    expect(screen.getByText(/Add to Home Screen/i)).toBeDefined()

    vi.useRealTimers()
  })

  it('has accessible role and aria-label', async () => {
    render(<PWAInstallPrompt />)

    await act(async () => {
      const event = new Event('beforeinstallprompt') as any
      event.preventDefault = vi.fn()
      event.prompt = vi.fn().mockResolvedValue(undefined)
      event.userChoice = Promise.resolve({ outcome: 'dismissed' as const })
      window.dispatchEvent(event)
    })

    const banner = screen.getByRole('alert')
    expect(banner.getAttribute('aria-label')).toBe('Install CubiQo app')
  })
})
