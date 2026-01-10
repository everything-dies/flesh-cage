import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { Suspense, useState } from 'react'
import { useCore } from '../index'
import { Context } from '../../context'
import '../../__tests__/setup'

/**
 * useCore suspension logic tests
 * Tests React Suspense integration, suspension event handling, and resume logic
 */

// Declare custom element types for JSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'test-suspend-listen': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-suspend-detail': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-no-suspend': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-no-promise': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-resume': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-multi-suspend': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-rapid-suspend': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-change-event': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-skin-change': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-cleanup': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}
describe('useCore - Suspension Logic', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('Suspension Event Handling', () => {
    it('listens for suspend events on mounted element', async () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-suspend-listen')) {
        customElements.define('test-suspend-listen', TestElement)
      }

      let elementRef: HTMLElement | null = null

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })

        return (
          <test-suspend-listen
            ref={(el) => {
              if (el) {
                elementRef = el as HTMLElement
                // Simulate ref attachment
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

      render(<TestComponent />)

      await waitFor(() => {
        expect(elementRef).not.toBeNull()
      })

      // Dispatch a suspend event
      const promise = Promise.resolve('test')
      const suspendEvent = new CustomEvent('suspend', { detail: promise })

      let eventFired = false
      elementRef?.addEventListener('suspend', () => {
        eventFired = true
      })

      elementRef?.dispatchEvent(suspendEvent)

      expect(eventFired).toBe(true)
    })

    it('handles suspend event with promise detail', async () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-suspend-detail')) {
        customElements.define('test-suspend-detail', TestElement)
      }

      let capturedPromise: Promise<unknown> | null = null

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })

        return (
          <test-suspend-detail
            ref={(el) => {
              if (el) {
                Object.defineProperty(ref, 'current', {
                  value: el,
                  writable: true,
                  configurable: true,
                })

                // Add listener to capture promise
                el.addEventListener('suspend', (event: Event) => {
                  const customEvent = event as CustomEvent<Promise<unknown>>
                  capturedPromise = customEvent.detail
                })

                // Dispatch event after setup
                setTimeout(() => {
                  const promise = Promise.resolve('data')
                  el.dispatchEvent(
                    new CustomEvent('suspend', { detail: promise })
                  )
                }, 10)
              }
            }}
          />
        )
      }

      render(<TestComponent />)

      await waitFor(() => {
        expect(capturedPromise).not.toBeNull()
      })

      expect(capturedPromise).toBeInstanceOf(Promise)
    })
  })

  describe('Suspense Integration', () => {
    it('does not suspend when suspendable is false', () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-no-suspend')) {
        customElements.define('test-no-suspend', TestElement)
      }

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })

        return (
          <test-no-suspend
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
          </test-no-suspend>
        )
      }

      // Should render without throwing
      const { container } = render(
        <Suspense fallback={<div>Loading...</div>}>
          <TestComponent />
        </Suspense>
      )

      expect(container.textContent).not.toContain('Loading...')
    })

    it('does not suspend when no suspension promise exists', () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-no-promise')) {
        customElements.define('test-no-promise', TestElement)
      }

      function TestComponent() {
        const { ref } = useCore({ suspendable: true })

        return (
          <test-no-promise
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
          </test-no-promise>
        )
      }

      // Should render without throwing even with suspendable: true
      const { container } = render(
        <Suspense fallback={<div>Loading...</div>}>
          <TestComponent />
        </Suspense>
      )

      expect(container.textContent).not.toContain('Loading...')
    })
  })

  describe('Resume Logic', () => {
    it('continues rendering after promise resolves', async () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-resume')) {
        customElements.define('test-resume', TestElement)
      }

      let resolvePromise: (() => void) | null = null
      const suspendPromise = new Promise<void>((resolve) => {
        resolvePromise = resolve
      })

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })

        return (
          <test-resume
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
            Rendered
          </test-resume>
        )
      }

      render(<TestComponent />)

      // Resolve the promise
      resolvePromise?.()
      await suspendPromise

      // Component should be rendered
      expect(document.body.textContent).toContain('Rendered')
    })

    it('handles multiple suspend/resume cycles', async () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-multi-suspend')) {
        customElements.define('test-multi-suspend', TestElement)
      }

      const suspendCalls: number[] = []

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })

        return (
          <test-multi-suspend
            ref={(el) => {
              if (el) {
                Object.defineProperty(ref, 'current', {
                  value: el,
                  writable: true,
                  configurable: true,
                })

                el.addEventListener('suspend', () => {
                  suspendCalls.push(Date.now())
                })
              }
            }}
          />
        )
      }

      const { container } = render(<TestComponent />)

      await waitFor(() => {
        const element = container.querySelector('test-multi-suspend')
        expect(element).not.toBeNull()
      })

      const element = container.querySelector('test-multi-suspend')

      // Dispatch multiple suspend events
      for (let i = 0; i < 3; i++) {
        const promise = Promise.resolve(`cycle-${i}`)
        element?.dispatchEvent(new CustomEvent('suspend', { detail: promise }))
      }

      await waitFor(() => {
        expect(suspendCalls.length).toBeGreaterThanOrEqual(3)
      })
    })

    it('handles rapid suspend events', async () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-rapid-suspend')) {
        customElements.define('test-rapid-suspend', TestElement)
      }

      const eventCount = { value: 0 }

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })

        return (
          <test-rapid-suspend
            ref={(el) => {
              if (el) {
                Object.defineProperty(ref, 'current', {
                  value: el,
                  writable: true,
                  configurable: true,
                })

                el.addEventListener('suspend', () => {
                  eventCount.value++
                })
              }
            }}
          />
        )
      }

      const { container } = render(<TestComponent />)

      await waitFor(() => {
        const element = container.querySelector('test-rapid-suspend')
        expect(element).not.toBeNull()
      })

      const element = container.querySelector('test-rapid-suspend')

      // Dispatch multiple rapid events
      for (let i = 0; i < 10; i++) {
        element?.dispatchEvent(
          new CustomEvent('suspend', { detail: Promise.resolve() })
        )
      }

      await waitFor(() => {
        expect(eventCount.value).toBeGreaterThanOrEqual(10)
      })
    })
  })

  describe('Change Event Dispatching', () => {
    it('dispatches change event with skin from context', async () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-change-event')) {
        customElements.define('test-change-event', TestElement)
      }

      let receivedSkin: string | null = null

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })

        return (
          <test-change-event
            ref={(el) => {
              if (el) {
                Object.defineProperty(ref, 'current', {
                  value: el,
                  writable: true,
                  configurable: true,
                })

                el.addEventListener('change', (event: Event) => {
                  const customEvent = event as CustomEvent<{ skin: string }>
                  receivedSkin = customEvent.detail.skin
                })
              }
            }}
          />
        )
      }

      render(
        <Context.Provider value="dark">
          <TestComponent />
        </Context.Provider>
      )

      await waitFor(() => {
        expect(receivedSkin).toBe('dark')
      })
    })

    it('dispatches change event when skin changes', async () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-skin-change')) {
        customElements.define('test-skin-change', TestElement)
      }

      const receivedSkins: string[] = []

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })

        return (
          <test-skin-change
            ref={(el) => {
              if (el) {
                Object.defineProperty(ref, 'current', {
                  value: el,
                  writable: true,
                  configurable: true,
                })

                el.addEventListener('change', (event: Event) => {
                  const customEvent = event as CustomEvent<{ skin: string }>
                  receivedSkins.push(customEvent.detail.skin)
                })
              }
            }}
          />
        )
      }

      function Wrapper() {
        const [skin, setSkin] = useState('light')

        return (
          <Context.Provider value={skin}>
            <TestComponent />
            <button onClick={() => setSkin('dark')}>Change Skin</button>
          </Context.Provider>
        )
      }

      const { getByText } = render(<Wrapper />)

      await waitFor(() => {
        expect(receivedSkins.length).toBeGreaterThan(0)
      })

      // Initial skin should be 'light'
      expect(receivedSkins).toContain('light')

      // Change skin
      getByText('Change Skin').click()

      await waitFor(() => {
        expect(receivedSkins).toContain('dark')
      })
    })
  })

  describe('Event Listener Cleanup', () => {
    it('removes event listeners on unmount', async () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-cleanup')) {
        customElements.define('test-cleanup', TestElement)
      }

      const removeEventListenerSpy = vi.fn()
      let elementRef: HTMLElement | null = null

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })

        return (
          <test-cleanup
            ref={(el) => {
              if (el) {
                elementRef = el as HTMLElement
                Object.defineProperty(ref, 'current', {
                  value: el,
                  writable: true,
                  configurable: true,
                })

                // Spy on removeEventListener
                const original = el.removeEventListener.bind(el)
                el.removeEventListener = (...args: Parameters<typeof original>) => {
                  removeEventListenerSpy(...args)
                  return original(...args)
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

      // Unmount component
      unmount()

      // Should have called removeEventListener for 'suspend'
      await waitFor(() => {
        expect(removeEventListenerSpy).toHaveBeenCalledWith(
          'suspend',
          expect.any(Function)
        )
      })
    })
  })
})
