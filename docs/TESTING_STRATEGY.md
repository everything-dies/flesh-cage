# Testing Strategy for flesh-cage

> Comprehensive testing guide based on styled-components and emotion test patterns

## Table of Contents

1. [Overview](#overview)
2. [Test Infrastructure](#test-infrastructure)
3. [Testing Patterns from styled-components & emotion](#testing-patterns)
4. [Test Categories for flesh-cage](#test-categories)
5. [Utility Functions](#utility-functions)
6. [Example Tests](#example-tests)
7. [Coverage Goals](#coverage-goals)

## Overview

This document outlines the testing strategy for flesh-cage, directly inspired by how styled-components and emotion test their CSS-in-JS libraries. Both libraries use comprehensive test suites covering:

- **Basic functionality** (component creation, style injection)
- **Dynamic styling** (props, theming, skins)
- **DOM integration** (Shadow DOM, Custom Elements, adoptedStyleSheets)
- **Server-side rendering** (SSR, hydration)
- **Performance** (style caching, deduplication)
- **Edge cases** (error handling, warnings, lifecycle)

## Test Infrastructure

### Current Setup

flesh-cage already has:

- ✅ Vitest configured (vitest.config.ts)
- ✅ jsdom environment
- ✅ Coverage reporting (v8 provider)
- ✅ Testing Library dependencies (@testing-library/react, jest-dom, user-event)

### Additional Setup Needed

```typescript
// packages/flesh-cage/vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/core/__tests__/setup.ts'], // Add this
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/types.ts',
        '**/.size-limit.cjs',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
})
```

### Test File Organization

Based on research, we'll use the `__tests__` pattern (emotion style):

```
packages/flesh-cage/src/core/
├── __tests__/
│   ├── setup.ts                    # Test utilities and mocks
│   ├── utils.ts                    # Test helpers
│   ├── basic.test.tsx              # Core functionality
│   ├── styled.test.tsx             # styled() API
│   ├── sheets.test.ts              # Sheets class & CSSStyleSheet
│   ├── skins.test.tsx              # Skin switching & theming
│   ├── props.test.tsx              # Props handling
│   ├── shadow-dom.test.tsx         # Shadow DOM integration
│   ├── custom-elements.test.tsx    # CustomElement lifecycle
│   ├── abort-controller.test.tsx   # AbortController & race conditions
│   ├── suspense.test.tsx           # Suspendable option
│   ├── provider.test.tsx           # Provider & context
│   ├── ssr.test.tsx                # Server-side rendering
│   ├── rehydration.test.tsx        # Client-side hydration
│   ├── performance.test.tsx        # Caching & optimization
│   ├── warnings.test.tsx           # Dev warnings & errors
│   └── __snapshots__/              # Jest/Vitest snapshots
├── context.ts
├── index.ts
├── provider.tsx
├── sheets.ts
├── styled.tsx
├── types.ts
├── use-context.ts
└── use-core.ts
```

## Testing Patterns

### Pattern 1: Basic Rendering & CSS Output (styled-components style)

**What they test:**

- Component renders without errors
- CSS is injected into Shadow DOM
- Class names are generated
- Styles match expected output

**Key utilities:**

- `render()` from @testing-library/react
- Custom `getShadowCSS()` helper
- Snapshot testing with `toMatchInlineSnapshot()`

### Pattern 2: Dynamic Styling & Props (both libraries)

**What they test:**

- Props are correctly interpolated into styles
- Style changes trigger updates
- Transient/dollar-sign props are filtered

**Key patterns:**

- Render with props
- Rerender with different props
- Assert CSS changes

### Pattern 3: Theme/Skin Switching (styled-components theme tests)

**What they test:**

- Theme provider injects theme
- Components receive theme
- Theme changes update styles
- Multiple theme providers work correctly

### Pattern 4: Shadow DOM & Custom Elements (flesh-cage specific)

**What to test:**

- Shadow root is created
- adoptedStyleSheets are applied
- Custom element lifecycle methods fire
- Event listeners work correctly

### Pattern 5: AbortController & Race Conditions (flesh-cage specific)

**What to test:**

- Previous skin loads are aborted
- Fast switching doesn't cause stale updates
- Promise rejections are handled
- Cleanup happens properly

### Pattern 6: SSR & Hydration (both libraries)

**What they test:**

- Server rendering produces correct HTML
- Client hydration doesn't duplicate styles
- No hydration mismatches
- Styles are preserved

### Pattern 7: Warnings & Errors (emotion warnings.js)

**What they test:**

- Invalid usage triggers warnings
- Console.error is called with correct messages
- Production mode suppresses dev warnings

## Test Categories

### 1. Basic Functionality Tests

File: `__tests__/basic.test.tsx`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { styled } from '../styled'
import { getShadowCSS, clearShadowDOM } from './utils'

describe('basic functionality', () => {
  beforeEach(() => {
    clearShadowDOM()
  })

  it('creates a styled component', () => {
    const Button = styled('button', {
      name: 'test-button',
      skins: {
        default: `
          color: blue;
          background: white;
        `,
      },
    })

    const { container } = render(<Button>Click me</Button>)

    const element = container.querySelector('test-button')
    expect(element).toBeInTheDocument()
    expect(element?.shadowRoot).toBeTruthy()
  })

  it('injects styles into shadow DOM', () => {
    const Button = styled('button', {
      name: 'test-button',
      skins: {
        default: `
          color: blue;
        `,
      },
    })

    const { container } = render(<Button>Click me</Button>)
    const element = container.querySelector('test-button')
    const css = getShadowCSS(element?.shadowRoot)

    expect(css).toContain('color: blue')
  })

  it('renders children via portal', () => {
    const Button = styled('button', {
      name: 'test-button',
      skins: {
        default: `color: blue;`,
      },
    })

    const { getByText } = render(<Button>Click me</Button>)

    expect(getByText('Click me')).toBeInTheDocument()
  })

  it('forwards refs correctly', () => {
    const Button = styled('button', {
      name: 'test-button',
      skins: {
        default: `color: blue;`,
      },
    })

    const ref = React.createRef<HTMLElement>()
    render(<Button ref={ref}>Click me</Button>)

    expect(ref.current).toBeInstanceOf(HTMLElement)
    expect(ref.current?.tagName.toLowerCase()).toBe('test-button')
  })
})
```

### 2. Skin Switching Tests

File: `__tests__/skins.test.tsx`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { styled, Provider } from '../index'
import { getShadowCSS, waitForStylesheet } from './utils'

describe('skin switching', () => {
  beforeEach(() => {
    clearShadowDOM()
  })

  it('applies default skin', async () => {
    const Button = styled('button', {
      name: 'test-button',
      skins: {
        default: `color: blue;`,
        dark: `color: white;`,
      },
    })

    const { container } = render(<Button>Test</Button>)
    await waitForStylesheet(container.querySelector('test-button'))

    const css = getShadowCSS(container.querySelector('test-button')?.shadowRoot)
    expect(css).toContain('color: blue')
  })

  it('switches skins via provider', async () => {
    const Button = styled('button', {
      name: 'test-button',
      skins: {
        default: `color: blue;`,
        dark: `color: white;`,
      },
    })

    const { container, rerender } = render(
      <Provider skin="default">
        <Button>Test</Button>
      </Provider>
    )

    await waitForStylesheet(container.querySelector('test-button'))
    let css = getShadowCSS(container.querySelector('test-button')?.shadowRoot)
    expect(css).toContain('color: blue')

    rerender(
      <Provider skin="dark">
        <Button>Test</Button>
      </Provider>
    )

    await waitForStylesheet(container.querySelector('test-button'))
    css = getShadowCSS(container.querySelector('test-button')?.shadowRoot)
    expect(css).toContain('color: white')
  })

  it('handles rapid skin switching without stale updates', async () => {
    const Button = styled('button', {
      name: 'test-button',
      skins: {
        default: `color: blue;`,
        dark: `color: white;`,
        light: `color: gray;`,
      },
    })

    const { container, rerender } = render(
      <Provider skin="default">
        <Button>Test</Button>
      </Provider>
    )

    // Rapidly switch skins
    rerender(<Provider skin="dark"><Button>Test</Button></Provider>)
    rerender(<Provider skin="light"><Button>Test</Button></Provider>)
    rerender(<Provider skin="default"><Button>Test</Button></Provider>)

    await waitForStylesheet(container.querySelector('test-button'))

    const css = getShadowCSS(container.querySelector('test-button')?.shadowRoot)
    // Should have the final skin, not an intermediate one
    expect(css).toContain('color: blue')
    expect(css).not.toContain('color: white')
    expect(css).not.toContain('color: gray')
  })

  it('rejects invalid skin names', () => {
    const Button = styled('button', {
      name: 'test-button',
      skins: {
        default: `color: blue;`,
      },
    })

    const { container } = render(
      <Provider skin="invalid">
        <Button>Test</Button>
      </Provider>
    )

    const element = container.querySelector('test-button')
    // Should fallback to empty or default skin
    expect(element?.shadowRoot?.adoptedStyleSheets).toBeDefined()
  })
})
```

### 3. AbortController Tests

File: `__tests__/abort-controller.test.tsx`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { styled, Provider } from '../index'
import { getShadowCSS } from './utils'

describe('AbortController & race conditions', () => {
  beforeEach(() => {
    clearShadowDOM()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('aborts previous skin load when switching', async () => {
    // Mock slow stylesheet loading
    const slowSkin = new Promise(resolve => setTimeout(resolve, 1000))
    const fastSkin = Promise.resolve()

    const Button = styled('button', {
      name: 'test-button',
      skins: {
        slow: `color: red;`,
        fast: `color: blue;`,
      },
    })

    const { container, rerender } = render(
      <Provider skin="slow">
        <Button>Test</Button>
      </Provider>
    )

    // Immediately switch to fast skin before slow completes
    rerender(
      <Provider skin="fast">
        <Button>Test</Button>
      </Provider>
    )

    vi.advanceTimersByTime(1500)
    await waitFor(() => {
      const css = getShadowCSS(container.querySelector('test-button')?.shadowRoot)
      // Should have fast skin, not slow
      expect(css).toContain('color: blue')
      expect(css).not.toContain('color: red')
    })
  })

  it('handles AbortError gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const Button = styled('button', {
      name: 'test-button',
      skins: {
        default: `color: blue;`,
        dark: `color: white;`,
      },
    })

    const { rerender } = render(
      <Provider skin="default">
        <Button>Test</Button>
      </Provider>
    )

    // Rapid switches that cause aborts
    for (let i = 0; i < 10; i++) {
      rerender(
        <Provider skin={i % 2 === 0 ? 'default' : 'dark'}>
          <Button>Test</Button>
        </Provider>
      )
    }

    // Should not log errors for AbortError
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it('cleans up controllers on unmount', () => {
    const Button = styled('button', {
      name: 'test-button',
      skins: {
        default: `color: blue;`,
      },
    })

    const { unmount } = render(<Button>Test</Button>)

    // Should not throw when unmounting
    expect(() => unmount()).not.toThrow()
  })
})
```

### 4. Shadow DOM Tests

File: `__tests__/shadow-dom.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { styled } from '../styled'

describe('Shadow DOM integration', () => {
  it('creates shadow root in open mode', () => {
    const Button = styled('button', {
      name: 'test-button',
      skins: {
        default: `color: blue;`,
      },
    })

    const { container } = render(<Button>Test</Button>)
    const element = container.querySelector('test-button')

    expect(element?.shadowRoot).toBeTruthy()
    expect(element?.shadowRoot?.mode).toBe('open')
  })

  it('uses adoptedStyleSheets for styles', async () => {
    const Button = styled('button', {
      name: 'test-button',
      skins: {
        default: `color: blue;`,
      },
    })

    const { container } = render(<Button>Test</Button>)
    const element = container.querySelector('test-button')

    await waitFor(() => {
      const sheets = element?.shadowRoot?.adoptedStyleSheets
      expect(sheets).toBeDefined()
      expect(sheets?.length).toBeGreaterThan(0)
    })
  })

  it('isolates styles from global scope', () => {
    // Add global style
    const globalStyle = document.createElement('style')
    globalStyle.textContent = 'button { color: red !important; }'
    document.head.appendChild(globalStyle)

    const Button = styled('button', {
      name: 'test-button',
      skins: {
        default: `color: blue;`,
      },
    })

    const { container } = render(<Button>Test</Button>)
    const element = container.querySelector('test-button')
    const buttonInShadow = element?.shadowRoot?.querySelector('button')

    // Shadow DOM button should not inherit global styles
    const computedStyle = window.getComputedStyle(buttonInShadow!)
    expect(computedStyle.color).not.toBe('rgb(255, 0, 0)') // not red

    document.head.removeChild(globalStyle)
  })

  it('renders children inside shadow root', () => {
    const Button = styled('button', {
      name: 'test-button',
      skins: {
        default: `color: blue;`,
      },
    })

    const { container, getByText } = render(<Button>Click me</Button>)
    const element = container.querySelector('test-button')

    // Text should be in shadow DOM
    expect(element?.shadowRoot?.textContent).toContain('Click me')
    expect(getByText('Click me')).toBeInTheDocument()
  })
})
```

### 5. Custom Elements Tests

File: `__tests__/custom-elements.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { styled, Provider } from '../index'

describe('Custom Elements lifecycle', () => {
  it('defines custom element', () => {
    const Button = styled('button', {
      name: 'test-button-lifecycle',
      skins: {
        default: `color: blue;`,
      },
    })

    render(<Button>Test</Button>)

    expect(customElements.get('test-button-lifecycle')).toBeDefined()
  })

  it('calls connectedCallback when mounted', async () => {
    const Button = styled('button', {
      name: 'test-button-connected',
      skins: {
        default: `color: blue;`,
      },
    })

    const { container } = render(<Button>Test</Button>)
    const element = container.querySelector('test-button-connected')

    // Element should be connected
    expect(element?.isConnected).toBe(true)
  })

  it('calls disconnectedCallback when unmounted', () => {
    const Button = styled('button', {
      name: 'test-button-disconnected',
      skins: {
        default: `color: blue;`,
      },
    })

    const { container, unmount } = render(<Button>Test</Button>)
    const element = container.querySelector('test-button-disconnected')

    unmount()

    // Element should be disconnected
    expect(element?.isConnected).toBe(false)
  })

  it('calls attributeChangedCallback when skin attribute changes', async () => {
    const Button = styled('button', {
      name: 'test-button-attr',
      skins: {
        default: `color: blue;`,
        dark: `color: white;`,
      },
    })

    const { container, rerender } = render(
      <Provider skin="default">
        <Button>Test</Button>
      </Provider>
    )

    const element = container.querySelector('test-button-attr')
    expect(element?.getAttribute('skin')).toBe('default')

    rerender(
      <Provider skin="dark">
        <Button>Test</Button>
      </Provider>
    )

    await waitFor(() => {
      expect(element?.getAttribute('skin')).toBe('dark')
    })
  })

  it('observes only skin attribute', () => {
    const Button = styled('button', {
      name: 'test-button-observed',
      skins: {
        default: `color: blue;`,
      },
    })

    render(<Button>Test</Button>)

    const ElementClass = customElements.get('test-button-observed')
    expect(ElementClass?.observedAttributes).toEqual(['skin'])
  })
})
```

### 6. Suspense Tests

File: `__tests__/suspense.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { Suspense } from 'react'
import { styled, Provider } from '../index'

describe('suspendable option', () => {
  it('suspends when suspendable is true', async () => {
    const Button = styled('button', {
      name: 'test-suspendable',
      suspendable: true,
      skins: {
        default: `color: blue;`,
      },
    })

    const { getByText } = render(
      <Suspense fallback={<div>Loading...</div>}>
        <Provider skin="default">
          <Button>Test</Button>
        </Provider>
      </Suspense>
    )

    // Should show fallback initially
    expect(getByText('Loading...')).toBeInTheDocument()

    // Should resolve and show button
    await waitFor(() => {
      expect(getByText('Test')).toBeInTheDocument()
    })
  })

  it('does not suspend when suspendable is false', () => {
    const Button = styled('button', {
      name: 'test-not-suspendable',
      suspendable: false,
      skins: {
        default: `color: blue;`,
      },
    })

    const { getByText, queryByText } = render(
      <Suspense fallback={<div>Loading...</div>}>
        <Button>Test</Button>
      </Suspense>
    )

    // Should not show fallback
    expect(queryByText('Loading...')).not.toBeInTheDocument()
    expect(getByText('Test')).toBeInTheDocument()
  })

  it('suspends on skin change when suspendable', async () => {
    const Button = styled('button', {
      name: 'test-suspend-change',
      suspendable: true,
      skins: {
        default: `color: blue;`,
        dark: `color: white;`,
      },
    })

    const { getByText, rerender } = render(
      <Suspense fallback={<div>Loading...</div>}>
        <Provider skin="default">
          <Button>Test</Button>
        </Provider>
      </Suspense>
    )

    await waitFor(() => {
      expect(getByText('Test')).toBeInTheDocument()
    })

    // Change skin
    rerender(
      <Suspense fallback={<div>Loading...</div>}>
        <Provider skin="dark">
          <Button>Test</Button>
        </Provider>
      </Suspense>
    )

    // Might show loading again (depends on caching)
    await waitFor(() => {
      expect(getByText('Test')).toBeInTheDocument()
    })
  })
})
```

### 7. Props Tests

File: `__tests__/props.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { styled } from '../styled'

describe('props handling', () => {
  it('passes through standard HTML props', () => {
    const Button = styled('button', {
      name: 'test-button-props',
      skins: {
        default: `color: blue;`,
      },
    })

    const { container } = render(
      <Button id="my-button" className="custom-class" data-testid="btn">
        Test
      </Button>
    )

    const element = container.querySelector('test-button-props')
    expect(element?.id).toBe('my-button')
    expect(element?.className).toContain('custom-class')
    expect(element?.getAttribute('data-testid')).toBe('btn')
  })

  it('passes through React props', () => {
    const Button = styled('button', {
      name: 'test-button-children',
      skins: {
        default: `color: blue;`,
      },
    })

    const { getByText } = render(
      <Button>
        <span>Child content</span>
      </Button>
    )

    expect(getByText('Child content')).toBeInTheDocument()
  })

  it('merges className prop', () => {
    const Button = styled('button', {
      name: 'test-button-classname',
      skins: {
        default: `color: blue;`,
      },
    })

    const { container } = render(
      <Button className="custom-class">Test</Button>
    )

    const element = container.querySelector('test-button-classname')
    expect(element?.className).toContain('custom-class')
  })
})
```

## Utility Functions

File: `__tests__/utils.ts`

```typescript
import { waitFor } from '@testing-library/react'

/**
 * Extracts CSS from a shadow root's adoptedStyleSheets
 */
export function getShadowCSS(
  shadowRoot: ShadowRoot | null | undefined
): string {
  if (!shadowRoot) return ''

  const sheets = shadowRoot.adoptedStyleSheets
  if (!sheets || sheets.length === 0) return ''

  return Array.from(sheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join('\n')
      } catch (e) {
        return ''
      }
    })
    .join('\n')
}

/**
 * Waits for adoptedStyleSheets to be populated
 */
export async function waitForStylesheet(
  element: Element | null | undefined,
  timeout = 3000
): Promise<void> {
  if (!element) throw new Error('Element not found')

  await waitFor(
    () => {
      const shadowRoot = (element as HTMLElement).shadowRoot
      expect(shadowRoot?.adoptedStyleSheets).toBeDefined()
      expect(shadowRoot?.adoptedStyleSheets?.length).toBeGreaterThan(0)
    },
    { timeout }
  )
}

/**
 * Clears all Shadow DOM content from document
 */
export function clearShadowDOM(): void {
  const elements = document.querySelectorAll('*')
  elements.forEach((el) => {
    if (el.shadowRoot) {
      el.shadowRoot.adoptedStyleSheets = []
    }
  })
  document.body.innerHTML = ''
}

/**
 * Normalizes CSS for comparison (removes whitespace)
 */
export function normalizeCSS(css: string): string {
  return css
    .replace(/\s+/g, ' ')
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*;\s*/g, ';')
    .trim()
}

/**
 * Creates a mock CSSStyleSheet for testing
 */
export function createMockStyleSheet(css: string): CSSStyleSheet {
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(css)
  return sheet
}

/**
 * Simulates slow stylesheet loading
 */
export function delayedStyleSheet(
  css: string,
  delay: number
): Promise<CSSStyleSheet> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const sheet = new CSSStyleSheet()
      sheet.replaceSync(css)
      resolve(sheet)
    }, delay)
  })
}
```

File: `__tests__/setup.ts`

```typescript
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
  // Clear any custom elements
  document.body.innerHTML = ''
})

// Mock console methods to track warnings/errors
global.console = {
  ...console,
  error: vi.fn(console.error),
  warn: vi.fn(console.warn),
}

// Polyfill for constructable stylesheets if needed
if (!('adoptedStyleSheets' in Document.prototype)) {
  Object.defineProperty(Document.prototype, 'adoptedStyleSheets', {
    value: [],
    writable: true,
  })
}

if (!('adoptedStyleSheets' in ShadowRoot.prototype)) {
  Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', {
    value: [],
    writable: true,
  })
}

// Add custom matchers
expect.extend({
  toHaveShadowRoot(element: Element) {
    const pass = !!(element as HTMLElement).shadowRoot
    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to have shadow root`
          : `Expected element to have shadow root`,
    }
  },
})
```

## Coverage Goals

Based on styled-components and emotion test suites, aim for:

- **Lines**: 80%+
- **Functions**: 80%+
- **Branches**: 75%+
- **Statements**: 80%+

### Priority Test Coverage

1. ✅ **Critical Path** (must have 90%+ coverage):
   - styled() function
   - Sheets class
   - CustomElement lifecycle
   - Shadow DOM integration

2. ✅ **Core Features** (must have 80%+ coverage):
   - Skin switching
   - Provider & context
   - AbortController logic
   - Suspense integration

3. ⚠️ **Edge Cases** (should have 70%+ coverage):
   - Error handling
   - Warnings
   - Performance optimizations
   - SSR/hydration

## Next Steps

1. **Create test infrastructure**:
   - [ ] Add `__tests__` directory
   - [ ] Create `setup.ts` and `utils.ts`
   - [ ] Update vitest.config.ts

2. **Implement basic tests first**:
   - [ ] basic.test.tsx
   - [ ] styled.test.tsx
   - [ ] shadow-dom.test.tsx

3. **Add advanced tests**:
   - [ ] skins.test.tsx
   - [ ] abort-controller.test.tsx
   - [ ] suspense.test.tsx

4. **Add integration tests**:
   - [ ] ssr.test.tsx
   - [ ] rehydration.test.tsx
   - [ ] performance.test.tsx

5. **Add edge case tests**:
   - [ ] warnings.test.tsx
   - [ ] custom-elements.test.tsx

## References

- [styled-components tests](https://github.com/styled-components/styled-components/tree/main/packages/styled-components/src/test)
- [emotion tests](https://github.com/emotion-js/emotion/tree/main/packages/react/__tests__)
- [Testing Library docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest docs](https://vitest.dev/)
