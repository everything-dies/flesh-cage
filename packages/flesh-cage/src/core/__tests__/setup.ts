import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

/**
 * Base test element that mimics Stylable's interface for useCore tests
 */
export class TestStylable extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  change(_context: { skin?: string }) {
    // No-op for tests - useCore calls this but we don't need it to do anything
  }
}

// Cleanup after each test
afterEach(() => {
  cleanup()
  // Clear custom element registry is not possible, but clear DOM
  document.body.innerHTML = ''
})

// Polyfill for constructable stylesheets in jsdom
// Check if CSSStyleSheet.prototype has replace method
const needsPolyfill =
  typeof CSSStyleSheet !== 'undefined' &&
  !('replace' in CSSStyleSheet.prototype)

if (needsPolyfill) {
  class PolyfillCSSStyleSheet {
    cssRules: CSSRule[] = []

    replaceSync(css: string) {
      // Parse CSS and create rules (simplified)
      this.cssRules = css
        .split('}')
        .filter(Boolean)
        .map((rule) => ({
          cssText: rule.trim() + '}',
        })) as CSSRule[]
    }

    replace(css: string): Promise<this> {
      return Promise.resolve().then(() => {
        this.replaceSync(css)
        return this
      })
    }
  }

  // @ts-expect-error - Polyfill for jsdom
  globalThis.CSSStyleSheet = PolyfillCSSStyleSheet
}

// Ensure adoptedStyleSheets is writable on ShadowRoot prototype
// Use a WeakMap to avoid polluting the ShadowRoot objects
const adoptedStyleSheetsMap = new WeakMap<ShadowRoot, CSSStyleSheet[]>()

if (!('adoptedStyleSheets' in ShadowRoot.prototype)) {
  Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', {
    get(this: ShadowRoot) {
      return adoptedStyleSheetsMap.get(this) || []
    },
    set(this: ShadowRoot, sheets: CSSStyleSheet[]) {
      adoptedStyleSheetsMap.set(this, sheets)
    },
    configurable: true,
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
