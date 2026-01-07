import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import React from 'react'
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
 * Basic functionality tests
 * Inspired by styled-components and emotion test patterns,
 * but adapted for Shadow DOM + Custom Elements architecture
 */
describe('styled - basic functionality', () => {
  it('creates a custom element with shadow DOM', () => {
    const Button = styled('button', {
      name: 'test-button-basic',
      skins: {
        default: createMockSkin('color: blue;'),
      },
    })

    const { container } = render(
      <Provider skin="default">
        <Button>Click me</Button>
      </Provider>
    )

    const element = findCustomElement(container, 'test-button-basic')

    expect(element).toBeInTheDocument()
    expect(element?.shadowRoot).toBeTruthy()
    expect(element?.shadowRoot?.mode).toBe('open')
  })

  it('defines custom element in registry', () => {
    const Button = styled('button', {
      name: 'test-button-registry',
      skins: {
        default: createMockSkin('color: red;'),
      },
    })

    render(
      <Provider skin="default">
        <Button>Test</Button>
      </Provider>
    )

    expect(customElements.get('test-button-registry')).toBeDefined()
  })

  it('renders children via portal into shadow DOM', async () => {
    const Button = styled('button', {
      name: 'test-button-children',
      skins: {
        default: createMockSkin('color: green;'),
      },
    })

    const { container } = render(
      <Provider skin="default">
        <Button>Click me</Button>
      </Provider>
    )

    const element = findCustomElement(container, 'test-button-children')

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    // Children should be in shadow DOM, not light DOM
    const shadowButton = element?.shadowRoot?.querySelector('button')
    expect(shadowButton).toBeTruthy()
    expect(shadowButton?.textContent).toBe('Click me')
  })

  it('injects styles into shadow DOM via adoptedStyleSheets', async () => {
    const Button = styled('button', {
      name: 'test-button-styles',
      skins: {
        default: createMockSkin(`
          button {
            color: blue;
            background: white;
          }
        `),
      },
    })

    const { container } = render(
      <Provider skin="default">
        <Button>Styled</Button>
      </Provider>
    )

    const element = findCustomElement(container, 'test-button-styles')

    await act(async () => {
      await waitForStyles(element)
    })

    const css = getShadowCSS(element?.shadowRoot)
    const normalized = normalizeCSS(css)

    expect(normalized).toContain('color')
    expect(normalized).toContain('blue')
    const sheets = element?.shadowRoot?.adoptedStyleSheets
    expect(sheets).toBeDefined()
    if (sheets) {
      expect(sheets.length).toBeGreaterThan(0)
    }
  })

  it('forwards refs to inner component (not custom element)', () => {
    // Note: Unlike traditional styled components, flesh-cage forwards refs
    // to the inner component (inside shadow DOM), not the custom element wrapper.
    // This gives users direct access to the actual interactive element.
    const Button = styled('button', {
      name: 'test-button-ref',
      skins: {
        default: createMockSkin('color: purple;'),
      },
    })

    const ref = React.createRef<HTMLButtonElement>()

    render(
      <Provider skin="default">
        <Button ref={ref}>Test</Button>
      </Provider>
    )

    expect(ref.current).toBeInstanceOf(HTMLElement)
    expect(ref.current?.tagName.toLowerCase()).toBe('button')
    // The button is inside the shadow DOM
    expect(ref.current?.getRootNode()).toHaveProperty('mode', 'open')
  })

  it('applies correct styles based on skin from Provider', async () => {
    const Button = styled('button', {
      name: 'test-button-provider',
      skins: {
        primary: createMockSkin('color: blue; background: navy;'),
        secondary: createMockSkin('color: gray; background: silver;'),
      },
    })

    const { container } = render(
      <Provider skin="primary">
        <Button>Primary</Button>
      </Provider>
    )

    const element = findCustomElement(container, 'test-button-provider')

    await act(async () => {
      await waitForStyles(element)
    })

    const css = normalizeCSS(getShadowCSS(element?.shadowRoot))

    expect(css).toContain('blue')
    expect(css).toContain('navy')
    expect(css).not.toContain('gray')
    expect(css).not.toContain('silver')
  })

  it('works with different base components', async () => {
    const CustomDiv = (props: React.ComponentProps<'div'>) => (
      <div data-custom="true" {...props} />
    )

    const StyledDiv = styled(CustomDiv, {
      name: 'test-styled-div',
      skins: {
        default: createMockSkin('padding: 10px;'),
      },
    })

    const { container } = render(
      <Provider skin="default">
        <StyledDiv>Content</StyledDiv>
      </Provider>
    )

    const element = findCustomElement(container, 'test-styled-div')

    await act(async () => {
      await waitForStyles(element)
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    const innerDiv = element?.shadowRoot?.querySelector('[data-custom="true"]')
    expect(innerDiv).toBeTruthy()
    expect(innerDiv?.textContent).toBe('Content')
  })

  it('handles multiple styled components with different skins', async () => {
    const Button1 = styled('button', {
      name: 'test-multi-button-1',
      skins: {
        default: createMockSkin('color: red;'),
      },
    })

    const Button2 = styled('button', {
      name: 'test-multi-button-2',
      skins: {
        default: createMockSkin('color: blue;'),
      },
    })

    const { container } = render(
      <Provider skin="default">
        <Button1>Red</Button1>
        <Button2>Blue</Button2>
      </Provider>
    )

    const element1 = findCustomElement(container, 'test-multi-button-1')
    const element2 = findCustomElement(container, 'test-multi-button-2')

    await act(async () => {
      await waitForStyles(element1)
      await waitForStyles(element2)
    })

    const css1 = normalizeCSS(getShadowCSS(element1?.shadowRoot))
    const css2 = normalizeCSS(getShadowCSS(element2?.shadowRoot))

    expect(css1).toContain('red')
    expect(css2).toContain('blue')
  })
})
