import '@testing-library/jest-dom/vitest'

// Mock Constructable Stylesheets if not available in JSDOM
if (typeof CSSStyleSheet === 'undefined' || !CSSStyleSheet.prototype.replace) {
  class MockCSSStyleSheet {
    cssRules: unknown[] = []

    async replace(css: string) {
      // Mock implementation
      return this
    }

    replaceSync(css: string) {
      // Mock implementation
    }
  }

  // @ts-expect-error - Mocking global
  global.CSSStyleSheet = MockCSSStyleSheet
}
