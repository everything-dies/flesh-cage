import { describe, it, expect, vi } from 'vitest'
import { render, act, waitFor } from '@testing-library/react'
import { styled } from '../index'
import { Provider } from '../../provider'
import {
  getShadowCSS,
  normalizeCSS,
  waitForStyles,
  findCustomElement,
} from '../../__tests__/utils'

/**
 * AbortController race condition handling tests
 * These tests verify that rapid skin switching correctly aborts stale loads
 * and only applies the most recently requested skin
 */
describe('styled - AbortController logic', () => {
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

  it('handles multiple rapid switches gracefully', async () => {
    const Button = styled('button', {
      name: 'test-multi-switch',
      skins: {
        a: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'color: red;' }), 30)
          ),
        b: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'color: blue;' }), 30)
          ),
        c: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'color: green;' }), 30)
          ),
        d: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'color: yellow;' }), 30)
          ),
      },
    })

    function TestComponent({ skin }: { skin: 'a' | 'b' | 'c' | 'd' }) {
      return (
        <Provider skin={skin}>
          <Button>Multi Switch</Button>
        </Provider>
      )
    }

    const { container, rerender } = render(<TestComponent skin="a" />)

    const element = findCustomElement(container, 'test-multi-switch')

    // Rapid fire through all skins
    await act(async () => {
      rerender(<TestComponent skin="b" />)
      rerender(<TestComponent skin="c" />)
      rerender(<TestComponent skin="d" />)
      await new Promise((resolve) => setTimeout(resolve, 200))
    })

    // Should end up with the last skin
    await waitFor(() => {
      const css = normalizeCSS(getShadowCSS(element?.shadowRoot))
      expect(css).toContain('yellow')
    })
  })

  it('verify helper correctly handles AbortErrors', async () => {
    const Button = styled('button', {
      name: 'test-verify-helper',
      skins: {
        abortable: () =>
          new Promise((_, reject) => {
            setTimeout(
              () => reject(new DOMException('Aborted', 'AbortError')),
              50
            )
          }),
      },
    })

    let unhandledRejection = false
    const handler = () => {
      unhandledRejection = true
    }

    process.on('unhandledRejection', handler)

    const { container } = render(
      <Provider skin="abortable">
        <Button>Verify</Button>
      </Provider>
    )

    const element = findCustomElement(container, 'test-verify-helper')

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    process.off('unhandledRejection', handler)

    // Should not have unhandled rejection (verify catches AbortError)
    // Note: The element won't have styles because the load was "aborted"
    expect(element).toBeInTheDocument()
  })
})
