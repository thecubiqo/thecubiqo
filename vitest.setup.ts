// Vitest setup file
// Add any global test setup here
import '@testing-library/jest-dom/vitest'

// Polyfill ResizeObserver for tests using @react-three/fiber / react-use-measure
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
