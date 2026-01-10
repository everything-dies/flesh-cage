import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import { styled } from '../../styled'
import { Provider } from '../index'
import {
  getShadowCSS,
  normalizeCSS,
  waitForStyles,
  createMockSkin,
} from '../../__tests__/utils'

/**
 * Provider nesting behavior tests
 * Tests how nested Providers override parent Provider values
 * Extracted from provider.test.tsx for better organization
 */
describe('Provider - nesting behavior', () => {
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

    const element = container.querySelector('test-provider-deep')

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

  it('deeply nested Providers follow closest ancestor', async () => {
    const Button = styled('button', {
      name: 'test-provider-ancestor',
      skins: {
        level1: createMockSkin('font-size: 10px;'),
        level2: createMockSkin('font-size: 20px;'),
        level3: createMockSkin('font-size: 30px;'),
      },
    })

    const { container } = render(
      <Provider skin="level1">
        <Button>Level 1</Button>
        <Provider skin="level2">
          <Button>Level 2</Button>
          <Provider skin="level3">
            <Button>Level 3</Button>
          </Provider>
        </Provider>
      </Provider>
    )

    const elements = container.querySelectorAll('test-provider-ancestor')

    await act(async () => {
      await waitForStyles(elements[0])
      await waitForStyles(elements[1])
      await waitForStyles(elements[2])
    })

    const css1 = normalizeCSS(getShadowCSS(elements[0]?.shadowRoot))
    const css2 = normalizeCSS(getShadowCSS(elements[1]?.shadowRoot))
    const css3 = normalizeCSS(getShadowCSS(elements[2]?.shadowRoot))

    expect(css1).toContain('10px')
    expect(css2).toContain('20px')
    expect(css3).toContain('30px')
  })

  it('sibling components outside nested Provider use parent skin', async () => {
    const Button = styled('button', {
      name: 'test-provider-sibling',
      skins: {
        parent: createMockSkin('color: orange;'),
        nested: createMockSkin('color: purple;'),
      },
    })

    const { container } = render(
      <Provider skin="parent">
        <Button>Before</Button>
        <Provider skin="nested">
          <Button>Inside</Button>
        </Provider>
        <Button>After</Button>
      </Provider>
    )

    const elements = container.querySelectorAll('test-provider-sibling')

    await act(async () => {
      await waitForStyles(elements[0])
      await waitForStyles(elements[1])
      await waitForStyles(elements[2])
    })

    const cssBefore = normalizeCSS(getShadowCSS(elements[0]?.shadowRoot))
    const cssInside = normalizeCSS(getShadowCSS(elements[1]?.shadowRoot))
    const cssAfter = normalizeCSS(getShadowCSS(elements[2]?.shadowRoot))

    expect(cssBefore).toContain('orange') // Parent skin
    expect(cssInside).toContain('purple') // Nested skin
    expect(cssAfter).toContain('orange') // Back to parent skin
  })
})
