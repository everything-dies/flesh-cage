import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import { useState } from 'react'
import { styled } from '../../styled'
import { Provider } from '../index'
import {
  getShadowCSS,
  normalizeCSS,
  waitForStyles,
  findCustomElement,
  createMockSkin,
} from '../../__tests__/utils'

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
