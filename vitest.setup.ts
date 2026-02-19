// Vitest setup file
// Add any global test setup here
import '@testing-library/jest-dom/vitest'

// Mock ResizeObserver (not available in jsdom, required by @react-three/fiber)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
