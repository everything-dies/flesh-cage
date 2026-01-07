import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
  // Clear any custom elements
  document.body.innerHTML = ''
})

// Mock console methods to track warnings/errors
global.console = {
  ...console,
  error: vi.fn(console.error),
  warn: vi.fn(console.warn),
}

// Polyfill for constructable stylesheets if needed
if (!('adoptedStyleSheets' in Document.prototype)) {
  Object.defineProperty(Document.prototype, 'adoptedStyleSheets', {
    value: [],
    writable: true,
  })
}

if (!('adoptedStyleSheets' in ShadowRoot.prototype)) {
  Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', {
    value: [],
    writable: true,
  })
}

// Add custom matchers
expect.extend({
  toHaveShadowRoot(element: Element) {
    const pass = !!(element as HTMLElement).shadowRoot
    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to have shadow root`
          : `Expected element to have shadow root`,
    }
  },
})
