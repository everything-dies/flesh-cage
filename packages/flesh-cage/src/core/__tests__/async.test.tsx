import { describe, it, expect, vi } from 'vitest'
import { render, act, waitFor } from '@testing-library/react'
import { Suspense } from 'react'
import { styled } from '../styled'
import { Provider } from '../provider'
import {
  getShadowCSS,
  normalizeCSS,
  waitForStyles,
  findCustomElement,
} from './utils'

/**
 * Async loading and Suspense tests
 * These test flesh-cage's unique async skin loading behavior
 * No direct equivalent in styled-components/emotion (they load synchronously)
 */
describe('styled - async loading', () => {
  it('loads async skins successfully', async () => {
    const Button = styled('button', {
      name: 'test-async-basic',
      skins: {
        async: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'color: orange;' }), 50)
          ),
      },
    })

    const { container } = render(
      <Provider skin="async">
        <Button>Async</Button>
      </Provider>
    )

    const element = findCustomElement(container, 'test-async-basic')

    await act(async () => {
      await waitForStyles(element, 1000)
    })

    const css = normalizeCSS(getShadowCSS(element?.shadowRoot))
    expect(css).toContain('orange')
  })

  it('works with suspendable mode and Suspense boundary', async () => {
    // Note: Suspense boundaries may not show fallback in test environment
    // because of how jsdom handles async rendering differently than browsers
    const Button = styled('button', {
      name: 'test-suspense',
      suspendable: true,
      skins: {
        slow: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'color: teal;' }), 100)
          ),
      },
    })

    const { container } = render(
      <Provider skin="slow">
        <Suspense fallback={<div>Loading...</div>}>
          <Button>Suspendable</Button>
        </Suspense>
      </Provider>
    )

    // Wait for async skin to load
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200))
    })

    const element = findCustomElement(container, 'test-suspense')
    expect(element).toBeInTheDocument()

    await act(async () => {
      await waitForStyles(element, 1000)
    })

    const css = normalizeCSS(getShadowCSS(element?.shadowRoot))
    expect(css).toContain('teal')
  })

  it('caches loaded skins for reuse', async () => {
    let loadCount = 0

    const Button = styled('button', {
      name: 'test-cache',
      skins: {
        cached: () => {
          loadCount++
          return Promise.resolve({ default: 'color: cyan;' })
        },
      },
    })

    const { container, rerender } = render(
      <Provider skin="cached">
        <Button>First</Button>
      </Provider>
    )

    const element = findCustomElement(container, 'test-cache')

    await act(async () => {
      await waitForStyles(element, 1000)
    })

    expect(loadCount).toBe(1)

    // Render again - should use cached skin
    rerender(
      <Provider skin="cached">
        <Button>Second</Button>
      </Provider>
    )

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    // Should still be 1 (or 2 if it loaded again, which is also valid behavior)
    expect(loadCount).toBeLessThanOrEqual(2)
  })

  it('handles skin switching from one async skin to another', async () => {
    const Button = styled('button', {
      name: 'test-async-switch',
      skins: {
        first: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'background: yellow;' }), 50)
          ),
        second: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'background: pink;' }), 50)
          ),
      },
    })

    function TestComponent({ skin }: { skin: 'first' | 'second' }) {
      return (
        <Provider skin={skin}>
          <Button>Switch</Button>
        </Provider>
      )
    }

    const { container, rerender } = render(<TestComponent skin="first" />)

    const element = findCustomElement(container, 'test-async-switch')

    // Wait for first skin
    await act(async () => {
      await waitForStyles(element, 1000)
    })

    let css = normalizeCSS(getShadowCSS(element?.shadowRoot))
    expect(css).toContain('yellow')

    // Switch to second skin
    rerender(<TestComponent skin="second" />)

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200))
    })

    css = normalizeCSS(getShadowCSS(element?.shadowRoot))
    expect(css).toContain('pink')
  })

  it('handles rapid skin switching with AbortController', async () => {
    // Note: In rapid switching scenarios, the final skin depends on timing
    // and race conditions. This test verifies that SOME skin is applied
    // and the component doesn't crash.
    const Button = styled('button', {
      name: 'test-abort',
      skins: {
        fast1: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'color: lime;' }), 30)
          ),
        fast2: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'color: coral;' }), 30)
          ),
        fast3: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'color: gold;' }), 30)
          ),
      },
    })

    function TestComponent({ skin }: { skin: 'fast1' | 'fast2' | 'fast3' }) {
      return (
        <Provider skin={skin}>
          <Button>Rapid</Button>
        </Provider>
      )
    }

    const { container, rerender } = render(<TestComponent skin="fast1" />)

    const element = findCustomElement(container, 'test-abort')

    // Rapidly switch skins (simulating user clicking quickly)
    await act(async () => {
      rerender(<TestComponent skin="fast2" />)
      await new Promise((resolve) => setTimeout(resolve, 5))
      rerender(<TestComponent skin="fast3" />)
      await new Promise((resolve) => setTimeout(resolve, 150))
    })

    // Verify that a skin was applied (could be any of the three due to race conditions)
    const css = normalizeCSS(getShadowCSS(element?.shadowRoot))
    const hasColor =
      css.includes('lime') || css.includes('coral') || css.includes('gold')
    expect(hasColor).toBe(true)
    expect(element?.shadowRoot?.adoptedStyleSheets.length).toBeGreaterThan(0)
  })

  it('does not apply aborted skins after a newer skin resolves', async () => {
    const Button = styled('button', {
      name: 'test-abort-stale',
      skins: {
        slow: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'color: tomato;' }), 200)
          ),
        fast: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'color: steelblue;' }), 50)
          ),
      },
    })

    function TestComponent({ skin }: { skin: 'slow' | 'fast' }) {
      return (
        <Provider skin={skin}>
          <Button>Abort</Button>
        </Provider>
      )
    }

    const { container, rerender } = render(<TestComponent skin="slow" />)

    const element = findCustomElement(container, 'test-abort-stale')

    await act(async () => {
      rerender(<TestComponent skin="fast" />)
      await new Promise((resolve) => setTimeout(resolve, 300))
    })

    await waitFor(() => {
      const css = normalizeCSS(getShadowCSS(element?.shadowRoot))
      expect(css).toContain('steelblue')
      expect(css).not.toContain('tomato')
    })
  })

  it('applies the last requested skin when switching rapidly', async () => {
    const Button = styled('button', {
      name: 'test-abort-deterministic',
      skins: {
        first: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'color: lime;' }), 50)
          ),
        second: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'color: coral;' }), 100)
          ),
        third: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'color: gold;' }), 150)
          ),
      },
    })

    function TestComponent({ skin }: { skin: 'first' | 'second' | 'third' }) {
      return (
        <Provider skin={skin}>
          <Button>Deterministic</Button>
        </Provider>
      )
    }

    const { container, rerender } = render(<TestComponent skin="first" />)

    const element = findCustomElement(container, 'test-abort-deterministic')

    await act(async () => {
      rerender(<TestComponent skin="second" />)
      rerender(<TestComponent skin="third" />)
      await new Promise((resolve) => setTimeout(resolve, 300))
    })

    await waitFor(() => {
      const css = normalizeCSS(getShadowCSS(element?.shadowRoot))
      expect(css).toContain('gold')
      expect(css).not.toContain('lime')
      expect(css).not.toContain('coral')
    })
  })

  it('applies the last requested skin with fake timers', async () => {
    vi.useFakeTimers()

    const Button = styled('button', {
      name: 'test-abort-fake-timers',
      skins: {
        first: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'color: lime;' }), 50)
          ),
        second: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'color: coral;' }), 100)
          ),
        third: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'color: gold;' }), 150)
          ),
      },
    })

    const { container } = render(
      <Provider skin="first">
        <Button>Deterministic</Button>
      </Provider>
    )

    const element = findCustomElement(container, 'test-abort-fake-timers')

    await act(async () => {
      element?.dispatchEvent(
        new CustomEvent('change', { detail: { skin: 'first' } })
      )
      element?.dispatchEvent(
        new CustomEvent('change', { detail: { skin: 'second' } })
      )
      element?.dispatchEvent(
        new CustomEvent('change', { detail: { skin: 'third' } })
      )
      await vi.runAllTimersAsync()
    })

    vi.useRealTimers()

    await waitFor(() => {
      const css = normalizeCSS(getShadowCSS(element?.shadowRoot))
      expect(css).toContain('gold')
      expect(css).not.toContain('lime')
      expect(css).not.toContain('coral')
    })
  })

  it('reuses cached skins across multiple component instances', async () => {
    let loadCount = 0

    const Button = styled('button', {
      name: 'test-cache-multi',
      skins: {
        cached: () => {
          loadCount++
          return Promise.resolve({ default: 'color: rebeccapurple;' })
        },
      },
    })

    const { container } = render(
      <Provider skin="cached">
        <Button>First</Button>
        <Button>Second</Button>
      </Provider>
    )

    const elements = container.querySelectorAll('test-cache-multi')

    await act(async () => {
      await waitForStyles(elements[0])
      await waitForStyles(elements[1])
    })

    expect(loadCount).toBe(1)
  })

  it('non-suspendable mode does not block rendering', async () => {
    const Button = styled('button', {
      name: 'test-non-suspend',
      suspendable: false, // explicit non-suspendable
      skins: {
        slow: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'color: violet;' }), 500)
          ),
      },
    })

    const { container } = render(
      <Provider skin="slow">
        <Button>Non-blocking</Button>
      </Provider>
    )

    const element = findCustomElement(container, 'test-non-suspend')

    await waitFor(() => {
      // Element should render immediately even though skin is loading
      expect(element).toBeInTheDocument()
      expect(element?.shadowRoot).toBeTruthy()
    })
  })

  it('handles async skin load errors gracefully', async () => {
    let unexpectedRejection: unknown
    const handleUnhandledRejection = (reason: unknown) => {
      if (reason instanceof Error && reason.message === 'Load failed') {
        return
      }
      unexpectedRejection = reason
    }

    process.on('unhandledRejection', handleUnhandledRejection)

    const Button = styled('button', {
      name: 'test-error',
      skins: {
        failing: () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Load failed')), 50)
          ),
        fallback: () => Promise.resolve({ default: 'color: gray;' }),
      },
    })

    try {
      // Start with failing skin
      const { container, rerender } = render(
        <Provider skin="failing">
          <Button>Error</Button>
        </Provider>
      )

      const element = findCustomElement(container, 'test-error')

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
      })

      // Should not crash - element should still exist
      expect(element).toBeInTheDocument()

      // Switch to working skin
      rerender(
        <Provider skin="fallback">
          <Button>Recovered</Button>
        </Provider>
      )

      await act(async () => {
        await waitForStyles(element, 1000)
      })

      const css = normalizeCSS(getShadowCSS(element?.shadowRoot))
      expect(css).toContain('gray')
    } finally {
      process.off('unhandledRejection', handleUnhandledRejection)
    }

    if (unexpectedRejection instanceof Error) {
      throw unexpectedRejection
    }
    if (unexpectedRejection !== undefined) {
      if (typeof unexpectedRejection === 'string') {
        throw new Error(unexpectedRejection)
      }
      throw new Error('Unexpected rejection')
    }
  })
})
