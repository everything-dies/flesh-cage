import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { verify, Stylable } from '../index'

// Unique element name generator to avoid conflicts
let uniqueId = 0
const uniqueName = () => `test-stylable-${String(uniqueId++)}`

// Concrete implementation for testing
class TestStylableElement extends Stylable<'light' | 'dark' | 'invalid-test'> {
  validSkins = new Set(['light', 'dark'])
  loadFn = vi.fn()

  protected validate(skin: 'light' | 'dark' | 'invalid-test'): boolean {
    return this.validSkins.has(skin as 'light' | 'dark')
  }

  protected load(
    skin: 'light' | 'dark' | 'invalid-test'
  ): Promise<CSSStyleSheet> | CSSStyleSheet {
    this.loadFn(skin)
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(
      `.${skin} { color: ${skin === 'light' ? 'black' : 'white'}; }`
    )
    return sheet
  }
}

describe('verify function', () => {
  it('should resolve for AbortError', async () => {
    const abortError = new DOMException('Aborted', 'AbortError')
    const result = await verify(abortError)
    expect(result).toBe(abortError)
  })

  it('should reject for other DOMExceptions', async () => {
    const otherError = new DOMException('Network error', 'NetworkError')
    await expect(verify(otherError)).rejects.toBe(otherError)
  })

  it('should reject for regular Errors', async () => {
    const regularError = new Error('Something went wrong')
    await expect(verify(regularError)).rejects.toBe(regularError)
  })

  it('should reject for TypeError', async () => {
    const typeError = new TypeError('Invalid type')
    await expect(verify(typeError)).rejects.toBe(typeError)
  })
})

describe('Stylable class', () => {
  let elementName: string
  let element: TestStylableElement

  beforeEach(() => {
    elementName = uniqueName()
    if (!customElements.get(elementName)) {
      customElements.define(elementName, class extends TestStylableElement {})
    }
    element = document.createElement(elementName) as TestStylableElement
    document.body.appendChild(element)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('instantiation', () => {
    it('should create a shadow root on construction', () => {
      expect(element.shadow).toBeInstanceOf(ShadowRoot)
      expect(element.shadowRoot).toBe(element.shadow)
    })

    it('should have an AbortController instance', () => {
      expect(element.controller).toBeInstanceOf(AbortController)
    })

    it('should have observedAttributes containing skin', () => {
      expect(Stylable.observedAttributes).toContain('skin')
    })

    it('should create shadow root in open mode', () => {
      expect(element.shadowRoot).not.toBeNull()
    })
  })

  describe('adorn method', () => {
    it('should call validate with the skin name', async () => {
      const validateSpy = vi.spyOn(
        element,
        'validate' as keyof TestStylableElement
      )
      await element.adorn('light')
      expect(validateSpy).toHaveBeenCalledWith('light')
    })

    it('should reject if validate returns false', async () => {
      await expect(element.adorn('invalid-test')).rejects.toThrow(
        'Invalid skin'
      )
    })

    it('should call load if validate returns true', async () => {
      await element.adorn('light')
      expect(element.loadFn).toHaveBeenCalledWith('light')
    })

    it('should apply stylesheet to shadow DOM', async () => {
      await element.adorn('light')
      expect(element.shadow.adoptedStyleSheets).toHaveLength(1)
    })

    it('should abort previous load on new request', async () => {
      const firstController = element.controller
      const abortSpy = vi.spyOn(firstController, 'abort')

      // Start first load
      const firstLoad = element.adorn('light')

      // Start second load before first completes
      const secondLoad = element.adorn('dark')

      expect(abortSpy).toHaveBeenCalled()
      expect(element.controller).not.toBe(firstController)

      // Both should complete (first aborted, second succeeds)
      await Promise.all([firstLoad, secondLoad])
    })

    it('should handle AbortError gracefully', async () => {
      // Create an element with async loading that can be aborted
      const asyncElementName = uniqueName()

      class AsyncTestElement extends Stylable<'slow'> {
        protected validate(): boolean {
          return true
        }

        protected load(): Promise<CSSStyleSheet> {
          // Simulate slow load
          return new Promise((resolve) => {
            setTimeout(() => {
              const sheet = new CSSStyleSheet()
              sheet.replaceSync('.slow { color: gray; }')
              resolve(sheet)
            }, 100)
          })
        }
      }

      customElements.define(asyncElementName, AsyncTestElement)
      const asyncElement = document.createElement(
        asyncElementName
      ) as AsyncTestElement
      document.body.appendChild(asyncElement)

      // Start slow load then abort
      const loadPromise = asyncElement.adorn('slow')
      asyncElement.controller.abort()

      // Should resolve with AbortError (not reject)
      const result = await loadPromise
      expect(result).toBeInstanceOf(DOMException)
      expect((result as DOMException).name).toBe('AbortError')
    })
  })

  describe('change method', () => {
    it('should read skin from attribute first', async () => {
      element.setAttribute('skin', 'dark')
      const adornSpy = vi.spyOn(element, 'adorn')

      await new Promise<void>((resolve) => {
        element.addEventListener('suspend', () => resolve(), { once: true })
        element.dispatchEvent(
          new CustomEvent('change', { detail: { skin: 'light' } })
        )
      })

      // Should use 'dark' from attribute, not 'light' from event detail
      expect(adornSpy).toHaveBeenCalledWith('dark')
    })

    it('should fall back to event detail skin if no attribute', async () => {
      const adornSpy = vi.spyOn(element, 'adorn')

      await new Promise<void>((resolve) => {
        element.addEventListener('suspend', () => resolve(), { once: true })
        element.dispatchEvent(
          new CustomEvent('change', { detail: { skin: 'light' } })
        )
      })

      expect(adornSpy).toHaveBeenCalledWith('light')
    })

    it('should call suspend with adorn promise', () => {
      const suspendSpy = vi.spyOn(element, 'suspend')

      element.dispatchEvent(
        new CustomEvent('change', { detail: { skin: 'light' } })
      )

      expect(suspendSpy).toHaveBeenCalled()
    })
  })

  describe('lifecycle methods', () => {
    it('disconnectedCallback should clear stylesheets', async () => {
      await element.adorn('light')
      expect(element.shadow.adoptedStyleSheets).toHaveLength(1)

      element.disconnectedCallback()
      expect(element.shadow.adoptedStyleSheets).toHaveLength(0)
    })

    it('attributeChangedCallback should trigger adorn for skin changes', async () => {
      const adornSpy = vi.spyOn(element, 'adorn')

      await new Promise<void>((resolve) => {
        element.addEventListener('suspend', () => resolve(), { once: true })
        element.attributeChangedCallback('skin', '', 'dark')
      })

      expect(adornSpy).toHaveBeenCalledWith('dark')
    })

    it('attributeChangedCallback should handle skin attribute case-insensitively', async () => {
      const adornSpy = vi.spyOn(element, 'adorn')

      await new Promise<void>((resolve) => {
        element.addEventListener('suspend', () => resolve(), { once: true })
        element.attributeChangedCallback('SKIN', '', 'light')
      })

      expect(adornSpy).toHaveBeenCalledWith('light')
    })
  })

  describe('suspend and resume', () => {
    it('should dispatch suspend event with promise in detail', async () => {
      // Use a slow promise to ensure the event with detail is captured
      // before the resume event (which has no detail)
      let resolvePromise: () => void = () => {}
      const slowPromise = new Promise<void>((resolve) => {
        resolvePromise = resolve
      })

      const events: CustomEvent[] = []
      element.addEventListener('suspend', (e) => {
        events.push(e as CustomEvent)
      })

      element.suspend(slowPromise)

      // Wait for the first microtask (event dispatch)
      await new Promise((resolve) => queueMicrotask(resolve))

      // First event should have detail (the promise)
      expect(events.length).toBeGreaterThanOrEqual(1)
      expect(events[0].detail).toBeInstanceOf(Promise)

      // Now resolve the promise to trigger resume
      resolvePromise()
      await slowPromise
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    it('should dispatch suspend event on completion via resume', () => {
      let eventCount = 0
      element.addEventListener('suspend', () => {
        eventCount++
      })

      element.resume()
      expect(eventCount).toBe(1)
    })

    it('should call resume when promise resolves', async () => {
      const resumeSpy = vi.spyOn(element, 'resume')

      let resolvePromise: () => void = () => {}
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve
      })

      element.suspend(promise)

      // Wait for initial event dispatch
      await new Promise((resolve) => queueMicrotask(resolve))

      // Resume should not have been called yet
      expect(resumeSpy).not.toHaveBeenCalled()

      // Now resolve the promise
      resolvePromise()
      await promise
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(resumeSpy).toHaveBeenCalled()
    })

    it('should call resume when promise settles (finally behavior)', async () => {
      // This test verifies that resume is called via Promise.finally()
      // which runs regardless of resolution or rejection.
      // We use resolution here since rejection handling in suspend()
      // passes the promise to event.detail which has no catch handler.
      const resumeSpy = vi.spyOn(element, 'resume')

      let resolvePromise: () => void = () => {}
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve
      })

      element.suspend(promise)

      // Wait for initial event dispatch
      await new Promise((resolve) => queueMicrotask(resolve))

      // Resume should not have been called yet (promise not settled)
      expect(resumeSpy).not.toHaveBeenCalled()

      // Settle the promise
      resolvePromise()
      await promise
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Resume should be called after promise settles (via finally)
      expect(resumeSpy).toHaveBeenCalled()
    })
  })
})
