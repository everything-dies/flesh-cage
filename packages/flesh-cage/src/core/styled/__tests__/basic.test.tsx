import { describe, it, expect } from 'vitest'
import { render, act, waitFor } from '@testing-library/react'
import React from 'react'
import { styled } from '../index'
import { Provider } from '../../provider'
import {
  getShadowCSS,
  normalizeCSS,
  waitForStyles,
  findCustomElement,
  createMockSkin,
} from '../../__tests__/utils'

let uniqueId = 0
const uniqueName = (prefix: string) => `${prefix}-${String(uniqueId++)}`

/**
 * Basic functionality tests
 * Inspired by styled-components and emotion test patterns,
 * but adapted for Shadow DOM + Custom Elements architecture
 */
describe('styled - basic functionality', () => {
  it('creates a custom element with shadow DOM', async () => {
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

    await waitFor(() => {
      expect(element).toBeInTheDocument()
      expect(element?.shadowRoot).toBeTruthy()
      expect(element?.shadowRoot?.mode).toBe('open')
    })
  })

  it('defines custom element in registry', async () => {
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

    await waitFor(() => {
      expect(customElements.get('test-button-registry')).toBeDefined()
    })
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

  it.skip('forwards refs to inner component (not custom element)', async () => {
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
        {/* @ts-expect-error - ref forwarding not yet implemented */}
        <Button ref={ref}>Test</Button>
      </Provider>
    )

    await waitFor(() => {
      expect(ref.current).toBeInstanceOf(HTMLElement)
      expect(ref.current?.tagName.toLowerCase()).toBe('button')
      // The button is inside the shadow DOM
      expect(ref.current?.getRootNode()).toHaveProperty('mode', 'open')
    })
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

  it('forwards configured attributes to the custom element', async () => {
    const name = uniqueName('test-attrs')
    const Button = styled('button', {
      name,
      skins: {
        default: createMockSkin('color: navy;'),
      },
      exportparts: 'label, surface',
      className: 'alpha beta',
      'data-variant': 'primary',
      'aria-label': 'Primary action',
    })

    const { container } = render(
      <Provider skin="default">
        <Button>Attrs</Button>
      </Provider>
    )

    const element = findCustomElement(container, name)

    await waitFor(() => {
      expect(element).toBeInTheDocument()
      expect(element?.getAttribute('exportparts')).toBe('label, surface')
      expect(element?.getAttribute('class')).toContain('alpha')
      expect(element?.getAttribute('class')).toContain('beta')
      expect(element?.getAttribute('data-variant')).toBe('primary')
      expect(element?.getAttribute('aria-label')).toBe('Primary action')
    })
  })

  it('updates styles when skin attribute changes directly', async () => {
    const name = uniqueName('test-attr-skin')
    const Button = styled('button', {
      name,
      skins: {
        first: createMockSkin('color: red;'),
        second: createMockSkin('color: blue;'),
      },
    })

    const { container } = render(
      <Provider skin="first">
        <Button>Attribute Switch</Button>
      </Provider>
    )

    const element = findCustomElement(container, name)

    await waitFor(() => {
      expect(element).toBeInTheDocument()
    })

    await act(async () => {
      await waitForStyles(element, 1000)
    })

    let css = normalizeCSS(getShadowCSS(element?.shadowRoot))
    expect(css).toContain('red')

    await act(async () => {
      element?.setAttribute('skin', 'second')
      await waitForStyles(element, 1000)
    })

    css = normalizeCSS(getShadowCSS(element?.shadowRoot))
    expect(css).toContain('blue')
    expect(css).not.toContain('red')
  })

  it('throws when defining the same custom element name twice', () => {
    const name = uniqueName('test-dup')
    const skins = { default: createMockSkin('color: black;') }

    styled('button', { name, skins })

    expect(() => styled('button', { name, skins })).toThrow()
  })

  it('does not adopt styles for invalid skins', async () => {
    const name = uniqueName('test-invalid-skin')
    const Button = styled('button', {
      name,
      skins: {
        valid: createMockSkin('color: teal;'),
      },
    })

    let invalidRejection = false
    let unexpectedRejection: unknown
    const handleUnhandledRejection = (reason: unknown) => {
      if (reason instanceof Error && reason.message === 'Invalid skin') {
        invalidRejection = true
        return
      }
      unexpectedRejection = reason
    }

    process.on('unhandledRejection', handleUnhandledRejection)

    try {
      const { container } = render(
        <Provider skin="missing">
          <Button>Invalid</Button>
        </Provider>
      )

      const element = findCustomElement(container, name)

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
      })

      const sheets = element?.shadowRoot?.adoptedStyleSheets ?? []
      expect(sheets.length).toBe(0)
      expect(invalidRejection).toBe(true)
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

  it('clears adoptedStyleSheets on disconnect', async () => {
    const name = uniqueName('test-disconnect')
    const Button = styled('button', {
      name,
      skins: {
        default: createMockSkin('color: orange;'),
      },
    })

    const { container, unmount } = render(
      <Provider skin="default">
        <Button>Disconnect</Button>
      </Provider>
    )

    const element = findCustomElement(container, name)

    await act(async () => {
      await waitForStyles(element)
    })

    const sheetsBefore = element?.shadowRoot?.adoptedStyleSheets ?? []
    expect(sheetsBefore.length).toBeGreaterThan(0)

    act(() => {
      unmount()
    })

    const sheetsAfter = element?.shadowRoot?.adoptedStyleSheets ?? []
    expect(sheetsAfter.length).toBe(0)
  })
})
