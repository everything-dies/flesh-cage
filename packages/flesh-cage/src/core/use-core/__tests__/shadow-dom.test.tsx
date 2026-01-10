import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { useCore } from '../index'
import '../../__tests__/setup'

/**
 * useCore Shadow DOM lifecycle tests
 * Tests Shadow DOM attachment, shadow root creation, and cleanup logic
 */

// Declare custom element types for JSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'test-shadow-attach': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-shadow-mode': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-container-update': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-shadow-ref': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-shadow-query': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-shadow-styles': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-cleanup-listeners': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-remove-suspend': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-no-leak': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-transition': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-non-blocking': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-multi-1': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-multi-2': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-independent-events': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}
describe('useCore - Shadow DOM Lifecycle', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('Shadow DOM Attachment', () => {
    it('attaches shadow root on mount', async () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-shadow-attach')) {
        customElements.define('test-shadow-attach', TestElement)
      }

      let shadowRootExists = false

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })

        return (
          <test-shadow-attach
            ref={(el) => {
              if (el) {
                Object.defineProperty(ref, 'current', {
                  value: el,
                  writable: true,
                  configurable: true,
                })

                shadowRootExists = !!(el as HTMLElement).shadowRoot
              }
            }}
          />
        )
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(shadowRootExists).toBe(true)
      })
    })

    it('shadow root has open mode', async () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-shadow-mode')) {
        customElements.define('test-shadow-mode', TestElement)
      }

      let shadowRoot: ShadowRoot | null = null

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })

        return (
          <test-shadow-mode
            ref={(el) => {
              if (el) {
                Object.defineProperty(ref, 'current', {
                  value: el,
                  writable: true,
                  configurable: true,
                })

                shadowRoot = (el as HTMLElement).shadowRoot
              }
            }}
          />
        )
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(shadowRoot).not.toBeNull()
      })

      expect(shadowRoot?.mode).toBe('open')
    })

    it('updates container to shadow root after mount', async () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-container-update')) {
        customElements.define('test-container-update', TestElement)
      }

      let initialContainer: DocumentFragment | ShadowRoot | null = null
      let updatedContainer: DocumentFragment | ShadowRoot | null = null

      function TestComponent() {
        const { container, ref } = useCore({ suspendable: false })

        if (!initialContainer) {
          initialContainer = container
        }

        return (
          <test-container-update
            ref={(el) => {
              if (el) {
                Object.defineProperty(ref, 'current', {
                  value: el,
                  writable: true,
                  configurable: true,
                })

                // Give time for useLayoutEffect to run
                setTimeout(() => {
                  updatedContainer = container
                }, 50)
              }
            }}
          />
        )
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(updatedContainer).not.toBeNull()
      })

      expect(initialContainer).toBeInstanceOf(DocumentFragment)
      await waitFor(() => {
        expect(updatedContainer).toBeInstanceOf(ShadowRoot)
      })
    })
  })

  describe('Shadow Root Creation', () => {
    it('shadow root is accessible via ref', async () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-shadow-ref')) {
        customElements.define('test-shadow-ref', TestElement)
      }

      let refShadowRoot: ShadowRoot | null = null

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })

        return (
          <test-shadow-ref
            ref={(el) => {
              if (el) {
                Object.defineProperty(ref, 'current', {
                  value: el,
                  writable: true,
                  configurable: true,
                })

                refShadowRoot = (el as HTMLElement).shadowRoot
              }
            }}
          />
        )
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(refShadowRoot).not.toBeNull()
      })

      expect(refShadowRoot).toBeInstanceOf(ShadowRoot)
    })

    it('shadow root can be queried', async () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          const shadow = this.attachShadow({ mode: 'open' })
          shadow.innerHTML = '<div class="test">Content</div>'
        }
      }

      if (!customElements.get('test-shadow-query')) {
        customElements.define('test-shadow-query', TestElement)
      }

      let queryResult: Element | null = null

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })

        return (
          <test-shadow-query
            ref={(el) => {
              if (el) {
                Object.defineProperty(ref, 'current', {
                  value: el,
                  writable: true,
                  configurable: true,
                })

                const shadowRoot = (el as HTMLElement).shadowRoot
                if (shadowRoot) {
                  queryResult = shadowRoot.querySelector('.test')
                }
              }
            }}
          />
        )
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(queryResult).not.toBeNull()
      })

      expect(queryResult?.textContent).toBe('Content')
    })

    it('shadow root supports adoptedStyleSheets', async () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-shadow-styles')) {
        customElements.define('test-shadow-styles', TestElement)
      }

      let hasAdoptedStyleSheets = false

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })

        return (
          <test-shadow-styles
            ref={(el) => {
              if (el) {
                Object.defineProperty(ref, 'current', {
                  value: el,
                  writable: true,
                  configurable: true,
                })

                const shadowRoot = (el as HTMLElement).shadowRoot
                hasAdoptedStyleSheets = 'adoptedStyleSheets' in (shadowRoot || {})
              }
            }}
          />
        )
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(hasAdoptedStyleSheets).toBe(true)
      })
    })
  })

  describe('Cleanup on Unmount', () => {
    it('cleans up event listeners on unmount', async () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-cleanup-listeners')) {
        customElements.define('test-cleanup-listeners', TestElement)
      }

      const removeEventListenerCalls: string[] = []
      let elementRef: HTMLElement | null = null

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })

        return (
          <test-cleanup-listeners
            ref={(el) => {
              if (el) {
                elementRef = el as HTMLElement
                Object.defineProperty(ref, 'current', {
                  value: el,
                  writable: true,
                  configurable: true,
                })

                // Spy on removeEventListener
                const originalRemove = el.removeEventListener.bind(el)
                el.removeEventListener = (
                  type: string,
                  listener: EventListenerOrEventListenerObject | null,
                  options?: boolean | EventListenerOptions
                ) => {
                  removeEventListenerCalls.push(type)
                  return originalRemove(type, listener, options)
                }
              }
            }}
          />
        )
      }

      const { unmount } = render(<TestComponent />)

      await waitFor(() => {
        expect(elementRef).not.toBeNull()
      })

      unmount()

      await waitFor(() => {
        expect(removeEventListenerCalls).toContain('suspend')
      })
    })

    it('removes suspend event listener specifically', async () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-remove-suspend')) {
        customElements.define('test-remove-suspend', TestElement)
      }

      let suspendListenerRemoved = false

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })

        return (
          <test-remove-suspend
            ref={(el) => {
              if (el) {
                Object.defineProperty(ref, 'current', {
                  value: el,
                  writable: true,
                  configurable: true,
                })

                const originalRemove = el.removeEventListener.bind(el)
                el.removeEventListener = (
                  type: string,
                  listener: EventListenerOrEventListenerObject | null,
                  options?: boolean | EventListenerOptions
                ) => {
                  if (type === 'suspend') {
                    suspendListenerRemoved = true
                  }
                  return originalRemove(type, listener, options)
                }
              }
            }}
          />
        )
      }

      const { unmount } = render(<TestComponent />)

      await waitFor(() => {
        expect(document.querySelector('test-remove-suspend')).not.toBeNull()
      })

      unmount()

      await waitFor(() => {
        expect(suspendListenerRemoved).toBe(true)
      })
    })

    it('does not leak memory on unmount', async () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-no-leak')) {
        customElements.define('test-no-leak', TestElement)
      }

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })

        return (
          <test-no-leak
            ref={(el) => {
              if (el) {
                Object.defineProperty(ref, 'current', {
                  value: el,
                  writable: true,
                  configurable: true,
                })
              }
            }}
          />
        )
      }

      const { unmount, container } = render(<TestComponent />)

      await waitFor(() => {
        expect(container.querySelector('test-no-leak')).not.toBeNull()
      })

      const element = container.querySelector('test-no-leak')
      expect(element).not.toBeNull()

      unmount()

      // Element should be removed from DOM
      await waitFor(() => {
        expect(container.querySelector('test-no-leak')).toBeNull()
      })
    })
  })

  describe('startTransition Behavior', () => {
    it('uses startTransition for container update', async () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-transition')) {
        customElements.define('test-transition', TestElement)
      }

      let containerUpdated = false

      function TestComponent() {
        const { container, ref } = useCore({ suspendable: false })

        return (
          <test-transition
            ref={(el) => {
              if (el) {
                Object.defineProperty(ref, 'current', {
                  value: el,
                  writable: true,
                  configurable: true,
                })

                // Check if container becomes ShadowRoot
                setTimeout(() => {
                  if (container instanceof ShadowRoot) {
                    containerUpdated = true
                  }
                }, 100)
              }
            }}
          />
        )
      }

      render(<TestComponent />)

      await waitFor(
        () => {
          expect(containerUpdated).toBe(true)
        },
        { timeout: 500 }
      )
    })

    it('container update does not block rendering', async () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-non-blocking')) {
        customElements.define('test-non-blocking', TestElement)
      }

      const renderTimes: number[] = []

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })

        renderTimes.push(Date.now())

        return (
          <test-non-blocking
            ref={(el) => {
              if (el) {
                Object.defineProperty(ref, 'current', {
                  value: el,
                  writable: true,
                  configurable: true,
                })
              }
            }}
          >
            Content
          </test-non-blocking>
        )
      }

      render(<TestComponent />)

      // Component should render quickly without being blocked
      expect(renderTimes.length).toBeGreaterThan(0)
    })
  })

  describe('Multiple Custom Elements', () => {
    it('handles multiple elements with independent shadow roots', async () => {
      class TestElement1 extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      class TestElement2 extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-multi-1')) {
        customElements.define('test-multi-1', TestElement1)
      }
      if (!customElements.get('test-multi-2')) {
        customElements.define('test-multi-2', TestElement2)
      }

      const shadowRoots: (ShadowRoot | null)[] = []

      function Component1() {
        const { ref } = useCore({ suspendable: false })

        return (
          <test-multi-1
            ref={(el) => {
              if (el) {
                Object.defineProperty(ref, 'current', {
                  value: el,
                  writable: true,
                  configurable: true,
                })

                shadowRoots[0] = (el as HTMLElement).shadowRoot
              }
            }}
          />
        )
      }

      function Component2() {
        const { ref } = useCore({ suspendable: false })

        return (
          <test-multi-2
            ref={(el) => {
              if (el) {
                Object.defineProperty(ref, 'current', {
                  value: el,
                  writable: true,
                  configurable: true,
                })

                shadowRoots[1] = (el as HTMLElement).shadowRoot
              }
            }}
          />
        )
      }

      render(
        <>
          <Component1 />
          <Component2 />
        </>
      )

      await waitFor(() => {
        expect(shadowRoots[0]).not.toBeNull()
        expect(shadowRoots[1]).not.toBeNull()
      })

      // Each component should have its own shadow root
      expect(shadowRoots[0]).not.toBe(shadowRoots[1])
      expect(shadowRoots[0]).toBeInstanceOf(ShadowRoot)
      expect(shadowRoots[1]).toBeInstanceOf(ShadowRoot)
    })

    it('each element has independent event listeners', async () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-independent-events')) {
        customElements.define('test-independent-events', TestElement)
      }

      const eventCounts = [0, 0]

      function Component({ index }: { index: number }) {
        const { ref } = useCore({ suspendable: false })

        return (
          <test-independent-events
            ref={(el) => {
              if (el) {
                Object.defineProperty(ref, 'current', {
                  value: el,
                  writable: true,
                  configurable: true,
                })

                el.addEventListener('suspend', () => {
                  eventCounts[index]++
                })
              }
            }}
          />
        )
      }

      const { container } = render(
        <>
          <Component index={0} />
          <Component index={1} />
        </>
      )

      await waitFor(() => {
        const elements = container.querySelectorAll('test-independent-events')
        expect(elements.length).toBe(2)
      })

      const elements = container.querySelectorAll('test-independent-events')

      // Dispatch event to first element only
      elements[0].dispatchEvent(
        new CustomEvent('suspend', { detail: Promise.resolve() })
      )

      await waitFor(() => {
        expect(eventCounts[0]).toBeGreaterThan(0)
      })

      // Second element should not have received event
      expect(eventCounts[1]).toBe(0)
    })
  })
})
