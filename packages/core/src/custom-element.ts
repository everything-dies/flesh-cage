import type { CustomElementConfig } from './types'

/**
 * Create a custom element with Shadow DOM
 *
 * @example
 * ```ts
 * const ButtonElement = createCustomElement({
 *   name: 'button-element',
 *   mode: 'open',
 *   parts: ['surface', 'label'],
 * })
 *
 * customElements.define('button-element', ButtonElement)
 * ```
 */
export function createCustomElement(config: CustomElementConfig): CustomElementConstructor {
  const { name, mode = 'open', delegatesFocus = false, slotAssignment = 'named', parts } = config

  if (!name.includes('-')) {
    throw new Error(
      `[createCustomElement] Custom element name must contain a hyphen: "${name}"`
    )
  }

  class ShadowElement extends HTMLElement {
    static observedAttributes = ['skin']

    #shadowRoot: ShadowRoot

    constructor() {
      super()

      this.#shadowRoot = this.attachShadow({
        mode,
        delegatesFocus,
        slotAssignment,
      })

      // Export parts if specified
      if (parts && parts.length > 0) {
        this.setAttribute('exportparts', parts.join(','))
      }
    }

    get shadowRoot(): ShadowRoot {
      return this.#shadowRoot
    }

    connectedCallback(): void {
      // Subclasses can override
    }

    disconnectedCallback(): void {
      // Subclasses can override
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
      // Subclasses can override
      if (oldValue === newValue) return
    }
  }

  // Set a readable name for debugging
  Object.defineProperty(ShadowElement, 'name', {
    value: name
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('') + 'Element',
    writable: false,
  })

  return ShadowElement
}
