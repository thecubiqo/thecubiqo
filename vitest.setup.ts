// Vitest setup file
// Add any global test setup here
import '@testing-library/jest-dom/vitest'

// Polyfill ResizeObserver for jsdom (required by @react-three/fiber)
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    constructor(_callback: ResizeObserverCallback) {}
    observe(_target: Element, _options?: ResizeObserverOptions) {}
    unobserve(_target: Element) {}
    disconnect() {}
  }
}
