import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import { styled } from '../styled'
import { getShadowCSS, clearShadowDOM, waitForStylesheet } from './utils'

describe('basic functionality', () => {
  beforeEach(() => {
    clearShadowDOM()
  })

  it('creates a styled component', () => {
    const Button = styled('button', {
      name: 'test-button-basic',
      skins: {
        default: `
          color: blue;
          background: white;
        `,
      },
    })

    const { container } = render(<Button>Click me</Button>)

    const element = container.querySelector('test-button-basic')
    expect(element).toBeInTheDocument()
    expect(element?.shadowRoot).toBeTruthy()
  })

  it('injects styles into shadow DOM', async () => {
    const Button = styled('button', {
      name: 'test-button-styles',
      skins: {
        default: `
          color: blue;
        `,
      },
    })

    const { container } = render(<Button>Click me</Button>)
    const element = container.querySelector('test-button-styles')

    await waitForStylesheet(element)

    const css = getShadowCSS(element?.shadowRoot)
    expect(css).toContain('color')
    expect(css).toContain('blue')
  })

  it('renders children via portal', () => {
    const Button = styled('button', {
      name: 'test-button-children',
      skins: {
        default: `color: blue;`,
      },
    })

    const { getByText } = render(<Button>Click me</Button>)

    expect(getByText('Click me')).toBeInTheDocument()
  })

  it('forwards refs correctly', () => {
    const Button = styled('button', {
      name: 'test-button-ref',
      skins: {
        default: `color: blue;`,
      },
    })

    const ref = React.createRef<HTMLElement>()
    render(<Button ref={ref}>Click me</Button>)

    expect(ref.current).toBeInstanceOf(HTMLElement)
    expect(ref.current?.tagName.toLowerCase()).toBe('test-button-ref')
  })

  it('creates shadow root in open mode', () => {
    const Button = styled('button', {
      name: 'test-button-shadow',
      skins: {
        default: `color: blue;`,
      },
    })

    const { container } = render(<Button>Test</Button>)
    const element = container.querySelector('test-button-shadow')

    expect(element?.shadowRoot).toBeTruthy()
    expect(element?.shadowRoot?.mode).toBe('open')
  })

  it('uses adoptedStyleSheets for styles', async () => {
    const Button = styled('button', {
      name: 'test-button-adopted',
      skins: {
        default: `color: blue;`,
      },
    })

    const { container } = render(<Button>Test</Button>)
    const element = container.querySelector('test-button-adopted')

    await waitForStylesheet(element)

    const sheets = element?.shadowRoot?.adoptedStyleSheets
    expect(sheets).toBeDefined()
    expect(sheets?.length).toBeGreaterThan(0)
  })

  it('defines custom element', () => {
    const Button = styled('button', {
      name: 'test-button-custom-element',
      skins: {
        default: `color: blue;`,
      },
    })

    render(<Button>Test</Button>)

    expect(customElements.get('test-button-custom-element')).toBeDefined()
  })
})
