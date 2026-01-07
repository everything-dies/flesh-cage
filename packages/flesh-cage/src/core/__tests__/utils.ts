import { waitFor } from '@testing-library/react'
import { expect } from 'vitest'

/**
 * Extracts CSS from a shadow root's adoptedStyleSheets
 */
export function getShadowCSS(
  shadowRoot: ShadowRoot | null | undefined
): string {
  if (!shadowRoot) return ''

  const sheets = shadowRoot.adoptedStyleSheets
  if (sheets.length === 0) return ''

  return Array.from(sheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join('\n')
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        return ''
      }
    })
    .join('\n')
}

/**
 * Waits for adoptedStyleSheets to be populated
 */
export async function waitForStylesheet(
  element: Element | null | undefined,
  timeout = 3000
): Promise<void> {
  if (!element) throw new Error('Element not found')

  await waitFor(
    () => {
      const shadowRoot = (element as HTMLElement).shadowRoot
      if (!shadowRoot) throw new Error('Shadow root not found')

      expect(shadowRoot.adoptedStyleSheets).toBeDefined()
      expect(shadowRoot.adoptedStyleSheets.length).toBeGreaterThan(0)
    },
    { timeout }
  )
}

/**
 * Clears all Shadow DOM content from document
 */
export function clearShadowDOM(): void {
  const elements = document.querySelectorAll('*')
  elements.forEach((el) => {
    if (el.shadowRoot) {
      el.shadowRoot.adoptedStyleSheets = []
    }
  })
  document.body.innerHTML = ''
}

/**
 * Normalizes CSS for comparison (removes whitespace)
 */
export function normalizeCSS(css: string): string {
  return css
    .replace(/\s+/g, ' ')
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*;\s*/g, ';')
    .trim()
}

/**
 * Creates a mock CSSStyleSheet for testing
 */
export function createMockStyleSheet(css: string): CSSStyleSheet {
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(css)
  return sheet
}

/**
 * Simulates slow stylesheet loading
 */
export function delayedStyleSheet(
  css: string,
  delay: number
): Promise<CSSStyleSheet> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const sheet = new CSSStyleSheet()
      sheet.replaceSync(css)
      resolve(sheet)
    }, delay)
  })
}
