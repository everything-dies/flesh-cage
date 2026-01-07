import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import React, { useState } from 'react'
import { styled } from '../styled'
import { Provider } from '../provider'
import {
  getShadowCSS,
  normalizeCSS,
  waitForStyles,
  findCustomElement,
  createMockSkin,
} from './utils'

/**
 * Provider and skin switching tests
 * Inspired by styled-components theme.test.tsx
 * Tests skin propagation, switching, and nesting
 */
describe('Provider - skin switching', () => {
  it('provides skin to styled components', async () => {
    const Button = styled('button', {
      name: 'test-provider-basic',
      skins: {
        primary: createMockSkin('color: blue;'),
      },
    })

    const { container } = render(
      <Provider skin="primary">
        <Button>Test</Button>
      </Provider>
    )

    const element = findCustomElement(container, 'test-provider-basic')

    await act(async () => {
      await waitForStyles(element)
    })

    const css = normalizeCSS(getShadowCSS(element?.shadowRoot))
    expect(css).toContain('blue')
  })

  it('updates styles when skin changes', async () => {
    const Button = styled('button', {
      name: 'test-provider-switch',
      skins: {
        light: createMockSkin('background: white; color: black;'),
        dark: createMockSkin('background: black; color: white;'),
      },
    })

    function TestComponent() {
      const [skin, setSkin] = useState<'light' | 'dark'>('light')

      return (
        <div>
          <button onClick={() => setSkin('dark')}>Switch</button>
          <Provider skin={skin}>
            <Button>Themed</Button>
          </Provider>
        </div>
      )
    }

    const { container, getByText } = render(<TestComponent />)

    const element = findCustomElement(container, 'test-provider-switch')

    // Check initial light skin
    await act(async () => {
      await waitForStyles(element)
    })

    let css = normalizeCSS(getShadowCSS(element?.shadowRoot))
    expect(css).toContain('white')
    expect(css).toContain('black')

    // Switch to dark skin
    await act(async () => {
      getByText('Switch').click()
      await new Promise((resolve) => setTimeout(resolve, 200))
    })

    css = normalizeCSS(getShadowCSS(element?.shadowRoot))
    // Should now have dark skin
    expect(css).toContain('background: black')
    expect(css).toContain('color: white')
  })

  it('supports nested Providers with skin override', async () => {
    const Button = styled('button', {
      name: 'test-provider-nested',
      skins: {
        outer: createMockSkin('color: red;'),
        inner: createMockSkin('color: blue;'),
      },
    })

    const { container } = render(
      <Provider skin="outer">
        <div>
          <Button>Outer</Button>
          <Provider skin="inner">
            <Button>Inner</Button>
          </Provider>
        </div>
      </Provider>
    )

    const elements = container.querySelectorAll('test-provider-nested')
    const outerElement = elements[0]
    const innerElement = elements[1]

    await act(async () => {
      await waitForStyles(outerElement)
      await waitForStyles(innerElement)
    })

    const outerCSS = normalizeCSS(getShadowCSS(outerElement?.shadowRoot))
    const innerCSS = normalizeCSS(getShadowCSS(innerElement?.shadowRoot))

    expect(outerCSS).toContain('red')
    expect(innerCSS).toContain('blue')
  })

  it('only affects components within Provider scope', async () => {
    const Button = styled('button', {
      name: 'test-provider-scope',
      skins: {
        themed: createMockSkin('color: purple;'),
      },
    })

    const { container } = render(
      <div>
        <Provider skin="themed">
          <Button>Inside</Button>
        </Provider>
        {/* This button is outside Provider - no skin context */}
      </div>
    )

    const element = findCustomElement(container, 'test-provider-scope')

    await act(async () => {
      await waitForStyles(element)
    })

    const css = normalizeCSS(getShadowCSS(element?.shadowRoot))
    expect(css).toContain('purple')
  })

  it('propagates skin to deeply nested components', async () => {
    const Button = styled('button', {
      name: 'test-provider-deep',
      skins: {
        deep: createMockSkin('border: 1px solid red;'),
      },
    })

    const { container } = render(
      <Provider skin="deep">
        <div>
          <div>
            <div>
              <div>
                <Button>Deep</Button>
              </div>
            </div>
          </div>
        </div>
      </Provider>
    )

    const element = findCustomElement(container, 'test-provider-deep')

    await act(async () => {
      await waitForStyles(element)
    })

    const css = normalizeCSS(getShadowCSS(element?.shadowRoot))
    expect(css).toContain('border')
    expect(css).toContain('red')
  })

  it('handles multiple Providers with different skins independently', async () => {
    const Button = styled('button', {
      name: 'test-provider-multi',
      skins: {
        red: createMockSkin('color: red;'),
        blue: createMockSkin('color: blue;'),
        green: createMockSkin('color: green;'),
      },
    })

    const { container } = render(
      <div>
        <Provider skin="red">
          <Button>Red</Button>
        </Provider>
        <Provider skin="blue">
          <Button>Blue</Button>
        </Provider>
        <Provider skin="green">
          <Button>Green</Button>
        </Provider>
      </div>
    )

    const elements = container.querySelectorAll('test-provider-multi')

    await act(async () => {
      await waitForStyles(elements[0])
      await waitForStyles(elements[1])
      await waitForStyles(elements[2])
    })

    const css1 = normalizeCSS(getShadowCSS(elements[0]?.shadowRoot))
    const css2 = normalizeCSS(getShadowCSS(elements[1]?.shadowRoot))
    const css3 = normalizeCSS(getShadowCSS(elements[2]?.shadowRoot))

    expect(css1).toContain('red')
    expect(css2).toContain('blue')
    expect(css3).toContain('green')
  })

  it('re-renders when Provider skin prop changes', async () => {
    const Button = styled('button', {
      name: 'test-provider-rerender',
      skins: {
        initial: createMockSkin('font-size: 12px;'),
        updated: createMockSkin('font-size: 16px;'),
      },
    })

    function TestComponent() {
      const [skin, setSkin] = useState<'initial' | 'updated'>('initial')

      return (
        <>
          <button data-testid="toggle" onClick={() => setSkin('updated')}>
            Update
          </button>
          <Provider skin={skin}>
            <Button>Test</Button>
          </Provider>
        </>
      )
    }

    const { container, getByTestId } = render(<TestComponent />)

    const element = findCustomElement(container, 'test-provider-rerender')

    // Initial state
    await act(async () => {
      await waitForStyles(element)
    })

    let css = normalizeCSS(getShadowCSS(element?.shadowRoot))
    expect(css).toContain('12px')

    // Update state
    await act(async () => {
      getByTestId('toggle').click()
      await new Promise((resolve) => setTimeout(resolve, 200))
    })

    css = normalizeCSS(getShadowCSS(element?.shadowRoot))
    expect(css).toContain('16px')
  })
})
