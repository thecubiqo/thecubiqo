// Vitest setup file
// Add any global test setup here
import '@testing-library/jest-dom/vitest'

// Polyfill ResizeObserver for R3F/react-use-measure in jsdom
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}
