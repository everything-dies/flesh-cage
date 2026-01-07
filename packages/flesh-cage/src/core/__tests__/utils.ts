import { waitFor } from '@testing-library/react'

/**
 * Extracts CSS from a shadow root's adoptedStyleSheets
 * Similar to styled-components' getCSS but for Shadow DOM
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
 * Normalizes CSS for comparison (inspired by styled-components)
 * Removes whitespace variations to focus on actual CSS content
 */
export function normalizeCSS(css: string): string {
  return css
    .replace(/\s+/g, ' ')
    .replace(/\s*{\s*/g, ' { ')
    .replace(/\s*}\s*/g, ' }')
    .replace(/\s*:\s*/g, ': ')
    .replace(/\s*;\s*/g, '; ')
    .replace(/;\s*}/g, '; }')
    .trim()
}

/**
 * Waits for a custom element to be defined and connected
 */
export async function waitForCustomElement(
  tagName: string,
  timeout = 3000
): Promise<void> {
  await waitFor(
    async () => {
      await customElements.whenDefined(tagName)
    },
    { timeout }
  )
}

/**
 * Waits for adoptedStyleSheets to be populated in shadow DOM
 * Handles the async nature of skin loading and style adoption
 */
export async function waitForStyles(
  element: Element | null | undefined,
  timeout = 5000
): Promise<void> {
  if (!element) throw new Error('Element not found')

  const htmlElement = element as HTMLElement
  const shadowRoot = htmlElement.shadowRoot

  if (!shadowRoot) throw new Error('Shadow root not found')

  // Give the component time to mount and dispatch change event
  await new Promise((resolve) => setTimeout(resolve, 50))

  await waitFor(
    () => {
      const sheets = shadowRoot.adoptedStyleSheets
      if (sheets.length === 0) {
        throw new Error('No adopted stylesheets found')
      }
    },
    { timeout, interval: 50 }
  )
}

/**
 * Extracts all CSS from all custom elements in the document
 * Similar to styled-components' getRenderedCSS
 */
export function getRenderedCSS(): string {
  const allElements = document.querySelectorAll('*')
  const cssBlocks: string[] = []

  allElements.forEach((el) => {
    if ((el as HTMLElement).shadowRoot) {
      const css = getShadowCSS((el as HTMLElement).shadowRoot)
      if (css) cssBlocks.push(css)
    }
  })

  return cssBlocks.join('\n\n')
}

/**
 * Finds a custom element in the container
 */
export function findCustomElement(
  container: HTMLElement,
  tagName: string
): HTMLElement | null {
  return container.querySelector(tagName)
}

/**
 * Creates a mock skin module (for async import simulation)
 */
export function createMockSkin(css: string) {
  return () => Promise.resolve({ default: css })
}
