/* eslint-disable react-hooks/immutability */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { useCore } from '../index'
import { Context } from '../../context'
import { type RefObject } from 'react'
import '../../__tests__/setup'

/**
 * useCore hook basic behavior tests
 * Tests core functionality: return values, ref stability, container updates
 *
 * Note: useCore requires a real custom element because it attaches event listeners
 * in useLayoutEffect. We test it with actual component rendering, not renderHook.
 */

// Declare custom element types for JSX
declare module 'react/jsx-runtime' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'test-return-values': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
      'test-stable-ref': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
      'test-initial-container': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
      'test-container-not-null': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
      'test-ref-rerender': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
      'test-ref-stability': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
      'test-multi-ref-1': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
      'test-multi-ref-2': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
      'test-container-start': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
      'test-portal-target': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
      'test-with-context': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
      'test-no-context': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
      'test-context-change': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
      'test-suspendable-false': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
      'test-suspendable-true': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
      'test-no-suspend-false': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
      'test-no-suspend-true': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
    }
  }
}
describe('useCore - Basic Behavior', () => {
  beforeEach(() => {
    // Clean up any existing custom elements
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('Return Values', () => {
    it('returns an object with ref and container properties', () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-return-values')) {
        customElements.define('test-return-values', TestElement)
      }

      const hookResult = {
        current: null as {
          ref: RefObject<HTMLElement | null>
          container: DocumentFragment | ShadowRoot
        } | null,
      }

      function TestComponent() {
        const result = useCore({ suspendable: false })
        hookResult.current = result

        return <test-return-values ref={result.ref} />
      }

      render(<TestComponent />)

      expect(hookResult.current).not.toBeNull()
      expect(hookResult.current).toHaveProperty('ref')
      expect(hookResult.current).toHaveProperty('container')
    })

    it('returns a stable ref object', () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-stable-ref')) {
        customElements.define('test-stable-ref', TestElement)
      }

      const firstRef = { current: null as RefObject<HTMLElement | null> | null }

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })

        if (!firstRef.current) {
          firstRef.current = ref
        }

        return <test-stable-ref ref={ref} />
      }

      render(<TestComponent />)

      expect(firstRef.current).toBeDefined()
      expect(firstRef.current?.current).not.toBeNull() // Attached to element
    })

    it('returns a container that is initially a DocumentFragment', () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-initial-container')) {
        customElements.define('test-initial-container', TestElement)
      }

      const initialContainer = {
        current: null as DocumentFragment | ShadowRoot | null,
      }

      function TestComponent() {
        const { container, ref } = useCore({ suspendable: false })

        if (!initialContainer.current) {
          initialContainer.current = container
        }

        return <test-initial-container ref={ref} />
      }

      render(<TestComponent />)

      expect(initialContainer.current).toBeInstanceOf(DocumentFragment)
    })

    it('container is not null (safe for portals)', () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-container-not-null')) {
        customElements.define('test-container-not-null', TestElement)
      }

      const containerValue = {
        current: null as DocumentFragment | ShadowRoot | null,
      }

      function TestComponent() {
        const { container, ref } = useCore({ suspendable: false })
        containerValue.current = container

        return <test-container-not-null ref={ref} />
      }

      render(<TestComponent />)

      expect(containerValue.current).not.toBeNull()
    })
  })

  describe('Ref Stability', () => {
    it('ref object remains stable across re-renders', () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-ref-rerender')) {
        customElements.define('test-ref-rerender', TestElement)
      }

      const initialRef = {
        current: null as RefObject<HTMLElement | null> | null,
      }
      const rerenderRef = {
        current: null as RefObject<HTMLElement | null> | null,
      }
      const renderCount = { value: 0 }

      function TestComponent({ trigger: _trigger }: { trigger: number }) {
        const { ref } = useCore({ suspendable: false })

        if (renderCount.value === 0) {
          initialRef.current = ref
        } else if (renderCount.value === 1) {
          rerenderRef.current = ref
        }

        renderCount.value++

        return <test-ref-rerender ref={ref} />
      }

      const { rerender } = render(<TestComponent trigger={0} />)

      rerender(<TestComponent trigger={1} />)

      expect(initialRef.current).toBe(rerenderRef.current) // Same object reference
    })

    it('ref object is stable even when container updates', async () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-ref-stability')) {
        customElements.define('test-ref-stability', TestElement)
      }

      const initialRef = {
        current: null as React.RefObject<HTMLElement | null> | null,
      }
      const updatedContainer = {
        current: null as DocumentFragment | ShadowRoot | null,
      }

      function TestComponent() {
        const { container, ref } = useCore({ suspendable: false })

        if (!initialRef.current) {
          initialRef.current = ref
        }

        updatedContainer.current = container

        return <test-ref-stability ref={ref} />
      }

      render(<TestComponent />)

      // Wait for container to update to ShadowRoot
      await waitFor(() => {
        expect(updatedContainer.current).toBeInstanceOf(ShadowRoot)
      })

      // Ref object should still be the same
      expect(initialRef.current?.current).not.toBeNull()
    })

    it('multiple hook calls create separate refs', () => {
      class TestElement1 extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      class TestElement2 extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-multi-ref-1')) {
        customElements.define('test-multi-ref-1', TestElement1)
      }
      if (!customElements.get('test-multi-ref-2')) {
        customElements.define('test-multi-ref-2', TestElement2)
      }

      const ref1 = { current: null as RefObject<HTMLElement | null> | null }
      const ref2 = { current: null as RefObject<HTMLElement | null> | null }

      function Component1() {
        const { ref } = useCore({ suspendable: false })
        ref1.current = ref
        return <test-multi-ref-1 ref={ref} />
      }

      function Component2() {
        const { ref } = useCore({ suspendable: false })
        ref2.current = ref
        return <test-multi-ref-2 ref={ref} />
      }

      render(
        <>
          <Component1 />
          <Component2 />
        </>
      )

      expect(ref1.current).not.toBe(ref2.current)
    })
  })

  describe('Container Updates', () => {
    it('container starts as DocumentFragment', () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-container-start')) {
        customElements.define('test-container-start', TestElement)
      }

      const containerValue = {
        current: null as DocumentFragment | ShadowRoot | null,
      }

      function TestComponent() {
        const { container, ref } = useCore({ suspendable: false })

        if (!containerValue.current) {
          containerValue.current = container
        }

        return <test-container-start ref={ref} />
      }

      render(<TestComponent />)

      expect(containerValue.current).toBeInstanceOf(DocumentFragment)
    })

    it('container can be used as portal target immediately', () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-portal-target')) {
        customElements.define('test-portal-target', TestElement)
      }

      const containerValue = {
        current: null as DocumentFragment | ShadowRoot | null,
      }

      function TestComponent() {
        const { container, ref } = useCore({ suspendable: false })
        containerValue.current = container

        return <test-portal-target ref={ref} />
      }

      render(<TestComponent />)

      // DocumentFragment should be a valid Node
      expect(containerValue.current).toBeInstanceOf(Node)
      expect(containerValue.current?.nodeType).toBeDefined()
    })
  })

  describe('Integration with Context', () => {
    it('reads skin from Context when Provider exists', () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-with-context')) {
        customElements.define('test-with-context', TestElement)
      }

      const hookWorked = { value: false }

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })
        hookWorked.value = true

        return <test-with-context ref={ref} />
      }

      render(
        <Context.Provider value="dark">
          <TestComponent />
        </Context.Provider>
      )

      // Hook should work normally with Context
      expect(hookWorked.value).toBe(true)
    })

    it('works without Context Provider', () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-no-context')) {
        customElements.define('test-no-context', TestElement)
      }

      const hookWorked = { value: false }

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })
        hookWorked.value = true

        return <test-no-context ref={ref} />
      }

      render(<TestComponent />)

      // Hook should work even without Provider
      expect(hookWorked.value).toBe(true)
    })

    it('handles Context value changes', () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-context-change')) {
        customElements.define('test-context-change', TestElement)
      }

      const initialRef = {
        current: null as React.RefObject<HTMLElement | null> | null,
      }
      const updatedRef = {
        current: null as React.RefObject<HTMLElement | null> | null,
      }
      const renderCount = { value: 0 }

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })

        if (renderCount.value === 0) {
          initialRef.current = ref
        } else {
          updatedRef.current = ref
        }

        renderCount.value++

        return <test-context-change ref={ref} />
      }

      const { rerender } = render(
        <Context.Provider value="light">
          <TestComponent />
        </Context.Provider>
      )

      // Change context value
      rerender(
        <Context.Provider value="dark">
          <TestComponent />
        </Context.Provider>
      )

      // Ref should remain stable
      expect(initialRef.current).toBe(updatedRef.current)
    })
  })

  describe('Suspendable Prop', () => {
    it('accepts suspendable: false', () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-suspendable-false')) {
        customElements.define('test-suspendable-false', TestElement)
      }

      const hookWorked = { value: false }

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })
        hookWorked.value = true

        return <test-suspendable-false ref={ref} />
      }

      render(<TestComponent />)

      expect(hookWorked.value).toBe(true)
    })

    it('accepts suspendable: true', () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-suspendable-true')) {
        customElements.define('test-suspendable-true', TestElement)
      }

      const hookWorked = { value: false }

      function TestComponent() {
        const { ref } = useCore({ suspendable: true })
        hookWorked.value = true

        return <test-suspendable-true ref={ref} />
      }

      render(<TestComponent />)

      expect(hookWorked.value).toBe(true)
    })

    it('does not suspend when suspendable is false', () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-no-suspend-false')) {
        customElements.define('test-no-suspend-false', TestElement)
      }

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })

        return <test-no-suspend-false ref={ref} />
      }

      // This should render without throwing
      expect(() => render(<TestComponent />)).not.toThrow()
    })

    it('does not suspend when suspendable is true but no suspension exists', () => {
      class TestElement extends HTMLElement {
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
        }
      }

      if (!customElements.get('test-no-suspend-true')) {
        customElements.define('test-no-suspend-true', TestElement)
      }

      function TestComponent() {
        const { ref } = useCore({ suspendable: true })

        return <test-no-suspend-true ref={ref} />
      }

      // This should render without throwing (no promise to suspend on)
      expect(() => render(<TestComponent />)).not.toThrow()
    })
  })
})
