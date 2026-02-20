// Vitest setup file
// Add any global test setup here
import '@testing-library/jest-dom/vitest'

// Polyfill ResizeObserver for jsdom (used by @react-three/fiber Canvas)
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}
