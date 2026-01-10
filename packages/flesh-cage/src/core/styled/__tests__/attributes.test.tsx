import { describe, it, expect } from 'vitest'
import { render, act, waitFor } from '@testing-library/react'
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
 * Attribute forwarding tests
 * Tests that verify HTML attributes are correctly forwarded from styled config
 * to the custom element wrapper
 */
describe('styled - attribute forwarding', () => {
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

  it('forwards className attribute', async () => {
    const name = uniqueName('test-class')
    const Button = styled('button', {
      name,
      skins: {
        default: createMockSkin('color: blue;'),
      },
      className: 'btn btn-primary interactive',
    })

    const { container } = render(
      <Provider skin="default">
        <Button>Class Test</Button>
      </Provider>
    )

    const element = findCustomElement(container, name)

    await waitFor(() => {
      expect(element).toBeInTheDocument()
      const classAttr = element?.getAttribute('class')
      expect(classAttr).toContain('btn')
      expect(classAttr).toContain('btn-primary')
      expect(classAttr).toContain('interactive')
    })
  })

  it('forwards data attributes', async () => {
    const name = uniqueName('test-data')
    const Button = styled('button', {
      name,
      skins: {
        default: createMockSkin('color: green;'),
      },
      'data-testid': 'submit-button',
      'data-variant': 'primary',
      'data-size': 'large',
    })

    const { container } = render(
      <Provider skin="default">
        <Button>Data Attrs</Button>
      </Provider>
    )

    const element = findCustomElement(container, name)

    await waitFor(() => {
      expect(element).toBeInTheDocument()
      expect(element?.getAttribute('data-testid')).toBe('submit-button')
      expect(element?.getAttribute('data-variant')).toBe('primary')
      expect(element?.getAttribute('data-size')).toBe('large')
    })
  })

  it('forwards aria attributes for accessibility', async () => {
    const name = uniqueName('test-aria')
    const Button = styled('button', {
      name,
      skins: {
        default: createMockSkin('color: purple;'),
      },
      'aria-label': 'Submit form',
      'aria-pressed': 'false',
      'aria-disabled': 'false',
    })

    const { container } = render(
      <Provider skin="default">
        <Button>Aria Test</Button>
      </Provider>
    )

    const element = findCustomElement(container, name)

    await waitFor(() => {
      expect(element).toBeInTheDocument()
      expect(element?.getAttribute('aria-label')).toBe('Submit form')
      expect(element?.getAttribute('aria-pressed')).toBe('false')
      expect(element?.getAttribute('aria-disabled')).toBe('false')
    })
  })

  it('forwards exportparts attribute for shadow DOM styling', async () => {
    const name = uniqueName('test-parts')
    const Card = styled('div', {
      name,
      skins: {
        default: createMockSkin('div { padding: 20px; }'),
      },
      exportparts: 'header, body, footer',
    })

    const { container } = render(
      <Provider skin="default">
        <Card>Parts Test</Card>
      </Provider>
    )

    const element = findCustomElement(container, name)

    await waitFor(() => {
      expect(element).toBeInTheDocument()
      expect(element?.getAttribute('exportparts')).toBe('header, body, footer')
    })
  })

  it('forwards multiple attribute types simultaneously', async () => {
    const name = uniqueName('test-multi-attrs')
    const Button = styled('button', {
      name,
      skins: {
        default: createMockSkin('button { color: teal; }'),
      },
      className: 'btn interactive',
      'data-testid': 'multi-button',
      'data-variant': 'outline',
      'aria-label': 'Multi-attribute button',
      exportparts: 'label',
      role: 'button',
      tabIndex: 0,
    })

    const { container } = render(
      <Provider skin="default">
        <Button>Multi Attrs</Button>
      </Provider>
    )

    const element = findCustomElement(container, name)

    await waitFor(() => {
      expect(element).toBeInTheDocument()
      expect(element?.getAttribute('class')).toContain('btn')
      expect(element?.getAttribute('class')).toContain('interactive')
      expect(element?.getAttribute('data-testid')).toBe('multi-button')
      expect(element?.getAttribute('data-variant')).toBe('outline')
      expect(element?.getAttribute('aria-label')).toBe(
        'Multi-attribute button'
      )
      expect(element?.getAttribute('exportparts')).toBe('label')
      expect(element?.getAttribute('role')).toBe('button')
      expect(element?.getAttribute('tabindex')).toBe('0')
    })
  })

  it('does not forward skin and suspendable as HTML attributes', async () => {
    const name = uniqueName('test-no-forward')
    const Button = styled('button', {
      name,
      suspendable: true,
      skins: {
        default: createMockSkin('color: orange;'),
      },
    })

    const { container } = render(
      <Provider skin="default">
        <Button>No Forward</Button>
      </Provider>
    )

    const element = findCustomElement(container, name)

    await waitFor(() => {
      expect(element).toBeInTheDocument()
      // suspendable is a config flag, not an HTML attribute
      expect(element?.getAttribute('suspendable')).toBeNull()
      // skins is internal config, not an HTML attribute
      expect(element?.getAttribute('skins')).toBeNull()
    })
  })

  it('handles attributes with special characters', async () => {
    const name = uniqueName('test-special-chars')
    const Button = styled('button', {
      name,
      skins: {
        default: createMockSkin('color: red;'),
      },
      'data-value': 'hello-world_123',
      'aria-labelledby': 'label-id-123',
    })

    const { container } = render(
      <Provider skin="default">
        <Button>Special Chars</Button>
      </Provider>
    )

    const element = findCustomElement(container, name)

    await waitFor(() => {
      expect(element).toBeInTheDocument()
      expect(element?.getAttribute('data-value')).toBe('hello-world_123')
      expect(element?.getAttribute('aria-labelledby')).toBe('label-id-123')
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

    // Change skin attribute directly on the element
    await act(async () => {
      element?.setAttribute('skin', 'second')
      await waitForStyles(element, 1000)
    })

    css = normalizeCSS(getShadowCSS(element?.shadowRoot))
    expect(css).toContain('blue')
    expect(css).not.toContain('red')
  })
})
