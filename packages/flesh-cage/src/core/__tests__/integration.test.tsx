import { describe, it, expect } from 'vitest'
import { render, act, waitFor } from '@testing-library/react'
import { useState, Suspense } from 'react'
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
 * Integration tests - Full-stack behavior across all modules
 *
 * These tests verify that all core modules work together correctly:
 * - types/ (via TypeScript compilation)
 * - context/ (Provider distributes skin)
 * - use-context/ (Components read active skin)
 * - provider/ (Wraps component tree)
 * - sheets/ (Loads and caches stylesheets)
 * - use-core/ (Manages Shadow DOM lifecycle)
 * - styled/ (Factory creates components)
 *
 * Unlike unit tests that test individual modules in isolation,
 * these tests verify the complete user-facing behavior and
 * cross-module interactions.
 */

let integrationTestCounter = 0
const uniqueIntegrationName = () => `integration-test-${String(integrationTestCounter++)}`

describe('Core Integration - Full Stack', () => {
  it('complete flow: Provider → Context → useCore → styled → Shadow DOM → rendering', async () => {
    // Test the entire pipeline from component definition to rendering

    const tagName = uniqueIntegrationName()

    // 1. Define a styled component (styled module)
    const Button = styled('button', {
      name: tagName,
      skins: {
        primary: createMockSkin('background: blue; color: white;'),
        secondary: createMockSkin('background: gray; color: black;'),
      },
    })

    // 2. Render with Provider (provider module)
    const { container } = render(
      <Provider skin="primary">
        <Button>Integration Test</Button>
      </Provider>
    )

    // 3. Verify Custom Element exists (styled module output)
    const element = findCustomElement(container, tagName)
    expect(element).toBeInTheDocument()

    // 4. Verify Shadow DOM is attached (use-core module)
    const shadowRoot = (element as HTMLElement)?.shadowRoot
    expect(shadowRoot).toBeTruthy()
    expect(shadowRoot?.mode).toBe('open')

    // 5. Wait for stylesheet loading (sheets module)
    await act(async () => {
      await waitForStyles(element)
    })

    // 6. Verify styles are adopted into shadow DOM
    expect(shadowRoot?.adoptedStyleSheets).toHaveLength(1)
    const css = normalizeCSS(getShadowCSS(shadowRoot))
    expect(css).toContain('blue')
    expect(css).toContain('white')

    // 7. Verify children are rendered inside shadow DOM (portal)
    const button = shadowRoot?.querySelector('button')
    expect(button).toBeTruthy()
    expect(button?.textContent).toBe('Integration Test')
  })

  it('cross-module interaction: Provider context flows through useCore to styled CustomElement', async () => {
    // Test that context value changes propagate correctly through the system

    const tagName = uniqueIntegrationName()

    const Card = styled('div', {
      name: tagName,
      skins: {
        light: createMockSkin('background: white; border: 1px solid gray;'),
        dark: createMockSkin('background: black; border: 1px solid silver;'),
      },
    })

    function TestApp() {
      const [theme, setTheme] = useState<'light' | 'dark'>('light')

      return (
        <div>
          <button data-testid="switcher" onClick={() => setTheme('dark')}>
            Switch to Dark
          </button>
          <Provider skin={theme}>
            <Card>Card Content</Card>
          </Provider>
        </div>
      )
    }

    const { container, getByTestId } = render(<TestApp />)

    // Initial state: light theme
    const element = findCustomElement(container, tagName)
    await act(async () => {
      await waitForStyles(element)
    })

    let css = normalizeCSS(getShadowCSS((element as HTMLElement)?.shadowRoot))
    expect(css).toContain('white')
    expect(css).toContain('gray')

    // Switch theme
    await act(async () => {
      getByTestId('switcher').click()
    })

    // Wait for new stylesheet to load
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    // Verify theme changed
    css = normalizeCSS(getShadowCSS((element as HTMLElement)?.shadowRoot))
    expect(css).toContain('black')
    expect(css).toContain('silver')
  })

  it('multiple components with different skins render independently', async () => {
    // Test that multiple styled components can coexist with different skins

    const buttonTagName = uniqueIntegrationName()
    const cardTagName = uniqueIntegrationName()

    const Button = styled('button', {
      name: buttonTagName,
      skins: {
        primary: createMockSkin('background: blue;'),
        danger: createMockSkin('background: red;'),
      },
    })

    const Card = styled('div', {
      name: cardTagName,
      skins: {
        primary: createMockSkin('border: 2px solid blue;'),
        danger: createMockSkin('border: 2px solid red;'),
      },
    })

    const { container } = render(
      <Provider skin="primary">
        <Button>Primary Button</Button>
        <Card>Primary Card</Card>
      </Provider>
    )

    // Find both elements
    const button = findCustomElement(container, buttonTagName)
    const card = findCustomElement(container, cardTagName)

    // Wait for both to load styles
    await act(async () => {
      await waitForStyles(button)
      await waitForStyles(card)
    })

    // Both should have the primary theme styles
    const buttonCSS = normalizeCSS(
      getShadowCSS((button as HTMLElement)?.shadowRoot)
    )
    const cardCSS = normalizeCSS(
      getShadowCSS((card as HTMLElement)?.shadowRoot)
    )

    expect(buttonCSS).toContain('blue')
    expect(cardCSS).toContain('blue')

    // Verify they have different styles (button has background, card has border)
    expect(buttonCSS).toContain('background')
    expect(cardCSS).toContain('border')
  })

  it('dynamic skin switching across entire component tree', async () => {
    // Test that changing Provider skin affects all descendant components

    const headerTagName = uniqueIntegrationName()
    const footerTagName = uniqueIntegrationName()
    const sidebarTagName = uniqueIntegrationName()

    const Header = styled('header', {
      name: headerTagName,
      skins: {
        light: createMockSkin('background: lightgray;'),
        dark: createMockSkin('background: darkgray;'),
      },
    })

    const Footer = styled('footer', {
      name: footerTagName,
      skins: {
        light: createMockSkin('background: lightblue;'),
        dark: createMockSkin('background: darkblue;'),
      },
    })

    const Sidebar = styled('aside', {
      name: sidebarTagName,
      skins: {
        light: createMockSkin('background: lightyellow;'),
        dark: createMockSkin('background: darkyellow;'),
      },
    })

    function App() {
      const [theme, setTheme] = useState<'light' | 'dark'>('light')

      return (
        <Provider skin={theme}>
          <button data-testid="theme-toggle" onClick={() => setTheme('dark')}>
            Toggle
          </button>
          <Header>Header</Header>
          <Sidebar>Sidebar</Sidebar>
          <Footer>Footer</Footer>
        </Provider>
      )
    }

    const { container, getByTestId } = render(<App />)

    // Get all elements
    const header = findCustomElement(container, headerTagName)
    const footer = findCustomElement(container, footerTagName)
    const sidebar = findCustomElement(container, sidebarTagName)

    // Wait for initial styles
    await act(async () => {
      await Promise.all([
        waitForStyles(header),
        waitForStyles(footer),
        waitForStyles(sidebar),
      ])
    })

    // Verify initial light theme
    expect(
      normalizeCSS(getShadowCSS((header as HTMLElement)?.shadowRoot))
    ).toContain('lightgray')
    expect(
      normalizeCSS(getShadowCSS((footer as HTMLElement)?.shadowRoot))
    ).toContain('lightblue')
    expect(
      normalizeCSS(getShadowCSS((sidebar as HTMLElement)?.shadowRoot))
    ).toContain('lightyellow')

    // Switch to dark theme
    await act(async () => {
      getByTestId('theme-toggle').click()
    })

    // Wait for theme change
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    // Verify all components switched to dark theme
    expect(
      normalizeCSS(getShadowCSS((header as HTMLElement)?.shadowRoot))
    ).toContain('darkgray')
    expect(
      normalizeCSS(getShadowCSS((footer as HTMLElement)?.shadowRoot))
    ).toContain('darkblue')
    expect(
      normalizeCSS(getShadowCSS((sidebar as HTMLElement)?.shadowRoot))
    ).toContain('darkyellow')
  })

  it('nested Providers override parent skin correctly', async () => {
    // Test that nested Providers create proper theme boundaries

    const tagName = uniqueIntegrationName()

    const Button = styled('button', {
      name: tagName,
      skins: {
        light: createMockSkin('color: black;'),
        dark: createMockSkin('color: white;'),
      },
    })

    const { container } = render(
      <Provider skin="light">
        <Button data-testid="outer">Outer Light</Button>

        <Provider skin="dark">
          <Button data-testid="inner">Inner Dark</Button>
        </Provider>
      </Provider>
    )

    // Find both buttons
    const buttons = container.querySelectorAll(tagName)
    expect(buttons).toHaveLength(2)

    const outerButton = buttons[0]
    const innerButton = buttons[1]

    // Wait for styles
    await act(async () => {
      await Promise.all([waitForStyles(outerButton), waitForStyles(innerButton)])
    })

    // Outer should be light
    const outerCSS = normalizeCSS(
      getShadowCSS((outerButton as HTMLElement)?.shadowRoot)
    )
    expect(outerCSS).toContain('black')

    // Inner should be dark (overridden)
    const innerCSS = normalizeCSS(
      getShadowCSS((innerButton as HTMLElement)?.shadowRoot)
    )
    expect(innerCSS).toContain('white')
  })

  it('Suspense integration with async skin loading', async () => {
    // Test React 18 Suspense integration

    const tagName = uniqueIntegrationName()

    const HeavyComponent = styled('div', {
      name: tagName,
      suspendable: true,
      skins: {
        heavy: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'font-size: 20px;' }), 100)
          ),
      },
    })

    const { container } = render(
      <Provider skin="heavy">
        <Suspense fallback={<div data-testid="fallback">Loading...</div>}>
          <HeavyComponent>Heavy Content</HeavyComponent>
        </Suspense>
      </Provider>
    )

    // Component should eventually render after loading
    await waitFor(
      async () => {
        const element = findCustomElement(container, tagName)
        expect(element).toBeInTheDocument()
      },
      { timeout: 5000 }
    )

    const element = findCustomElement(container, tagName)
    await act(async () => {
      await waitForStyles(element, 5000)
    })

    const css = normalizeCSS(getShadowCSS((element as HTMLElement)?.shadowRoot))
    expect(css).toContain('20px')
  })

  it('stylesheet caching across multiple component instances', async () => {
    // Test that Sheets module caches stylesheets correctly

    const tagName = uniqueIntegrationName()

    const Button = styled('button', {
      name: tagName,
      skins: {
        primary: createMockSkin('background: purple;'),
      },
    })

    const { container } = render(
      <Provider skin="primary">
        <Button>Button 1</Button>
        <Button>Button 2</Button>
        <Button>Button 3</Button>
      </Provider>
    )

    const buttons = container.querySelectorAll(tagName)
    expect(buttons).toHaveLength(3)

    // Wait for all to load
    await act(async () => {
      await Promise.all(
        Array.from(buttons).map((button) => waitForStyles(button))
      )
    })

    // All should have the same stylesheet content
    const cssContents = Array.from(buttons).map((button) =>
      normalizeCSS(getShadowCSS((button as HTMLElement)?.shadowRoot))
    )

    // All should contain 'purple'
    cssContents.forEach((css) => {
      expect(css).toContain('purple')
    })

    // All should be identical (same cached stylesheet)
    expect(cssContents[0]).toBe(cssContents[1])
    expect(cssContents[1]).toBe(cssContents[2])
  })

  it('Custom Element attributes are properly forwarded', async () => {
    // Test that config attributes flow through to the Custom Element

    const tagName = uniqueIntegrationName()

    const Icon = styled('span', {
      name: tagName,
      skins: {
        default: createMockSkin('display: inline-block;'),
      },
      role: 'img',
      'aria-label': 'Icon',
      'data-testid': 'custom-icon',
    })

    const { container } = render(
      <Provider skin="default">
        <Icon />
      </Provider>
    )

    const element = findCustomElement(container, tagName)
    expect(element).toBeInTheDocument()

    // Verify attributes are present
    expect(element?.getAttribute('role')).toBe('img')
    expect(element?.getAttribute('aria-label')).toBe('Icon')
    expect(element?.getAttribute('data-testid')).toBe('custom-icon')
  })

  it('rapid theme switching with AbortController prevents race conditions', async () => {
    // Test that AbortController in styled module prevents stale skin loads

    const tagName = uniqueIntegrationName()

    const Component = styled('div', {
      name: tagName,
      skins: {
        fast: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'color: green;' }), 10)
          ),
        slow: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'color: red;' }), 200)
          ),
      },
    })

    function RapidSwitcher() {
      const [skin, setSkin] = useState<'fast' | 'slow'>('slow')

      return (
        <Provider skin={skin}>
          <button
            data-testid="switch"
            onClick={() => setSkin((prev) => (prev === 'slow' ? 'fast' : 'slow'))}
          >
            Switch
          </button>
          <Component>Content</Component>
        </Provider>
      )
    }

    const { getByTestId, container } = render(<RapidSwitcher />)

    // Trigger load of 'slow' skin
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    // Rapidly switch to 'fast' before 'slow' completes
    await act(async () => {
      getByTestId('switch').click()
    })

    // Wait for 'fast' to complete (and for 'slow' to be aborted)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    // Final state should be 'fast' (green), not 'slow' (red)
    const element = findCustomElement(container, tagName)

    // Wait for final styles
    await act(async () => {
      await waitForStyles(element, 5000)
    })

    const css = normalizeCSS(getShadowCSS((element as HTMLElement)?.shadowRoot))

    // Should have 'fast' skin (green), not 'slow' skin (red)
    expect(css).toContain('green')
    expect(css).not.toContain('red')
  })
})
