import '@testing-library/jest-dom/vitest'

// Mock Constructable Stylesheets if not available in JSDOM
if (typeof CSSStyleSheet === 'undefined') {
  class MockCSSStyleSheet {
    cssRules: unknown[] = []

    replace(_css: string) {
      // Mock implementation
      return Promise.resolve(this)
    }

    replaceSync(_css: string) {
      // Mock implementation
    }
  }

  // @ts-expect-error - Mocking global
  global.CSSStyleSheet = MockCSSStyleSheet
}
