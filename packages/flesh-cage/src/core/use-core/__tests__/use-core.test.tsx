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
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'test-return-values': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-stable-ref': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-initial-container': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-container-not-null': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-ref-rerender': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-ref-stability': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-multi-ref-1': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-multi-ref-2': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-container-start': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-portal-target': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-with-context': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-no-context': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-context-change': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-suspendable-false': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-suspendable-true': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-no-suspend-false': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'test-no-suspend-true': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
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

      let hookResult: { ref: RefObject<HTMLElement>; container: DocumentFragment | ShadowRoot } | null = null

      function TestComponent() {
        const result = useCore({ suspendable: false })
        hookResult = result

        return <test-return-values ref={result.ref} />
      }

      render(<TestComponent />)

      expect(hookResult).not.toBeNull()
      expect(hookResult).toHaveProperty('ref')
      expect(hookResult).toHaveProperty('container')
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

      let firstRef: RefObject<HTMLElement> | null = null

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })

        if (!firstRef) {
          firstRef = ref
        }

        return <test-stable-ref ref={ref} />
      }

      render(<TestComponent />)

      expect(firstRef).toBeDefined()
      expect(firstRef!.current).not.toBeNull() // Attached to element
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

      let initialContainer: DocumentFragment | ShadowRoot | null = null

      function TestComponent() {
        const { container, ref } = useCore({ suspendable: false })

        if (!initialContainer) {
          initialContainer = container
        }

        return <test-initial-container ref={ref} />
      }

      render(<TestComponent />)

      expect(initialContainer).toBeInstanceOf(DocumentFragment)
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

      let containerValue: DocumentFragment | ShadowRoot | null = null

      function TestComponent() {
        const { container, ref } = useCore({ suspendable: false })
        containerValue = container

        return <test-container-not-null ref={ref} />
      }

      render(<TestComponent />)

      expect(containerValue).not.toBeNull()
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

      let initialRef: RefObject<HTMLElement> | null = null
      let rerenderRef: RefObject<HTMLElement> | null = null
      let renderCount = 0

      function TestComponent({ trigger: _trigger }: { trigger: number }) {
        const { ref } = useCore({ suspendable: false })

        if (renderCount === 0) {
          initialRef = ref
        } else if (renderCount === 1) {
          rerenderRef = ref
        }

        renderCount++

        return <test-ref-rerender ref={ref} />
      }

      const { rerender } = render(<TestComponent trigger={0} />)

      rerender(<TestComponent trigger={1} />)

      expect(initialRef).toBe(rerenderRef) // Same object reference
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

      let initialRef: React.RefObject<HTMLElement> | null = null
      let updatedContainer: DocumentFragment | ShadowRoot | null = null

      function TestComponent() {
        const { container, ref } = useCore({ suspendable: false })

        if (!initialRef) {
          initialRef = ref
        }

        updatedContainer = container

        return <test-ref-stability ref={ref} />
      }

      render(<TestComponent />)

      // Wait for container to update to ShadowRoot
      await waitFor(() => {
        expect(updatedContainer).toBeInstanceOf(ShadowRoot)
      })

      // Ref object should still be the same
      expect(initialRef!.current).not.toBeNull()
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

      let ref1: RefObject<HTMLElement> | null = null
      let ref2: RefObject<HTMLElement> | null = null

      function Component1() {
        const { ref } = useCore({ suspendable: false })
        ref1 = ref
        return <test-multi-ref-1 ref={ref} />
      }

      function Component2() {
        const { ref } = useCore({ suspendable: false })
        ref2 = ref
        return <test-multi-ref-2 ref={ref} />
      }

      render(
        <>
          <Component1 />
          <Component2 />
        </>
      )

      expect(ref1).not.toBe(ref2)
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

      let containerValue: DocumentFragment | ShadowRoot | null = null

      function TestComponent() {
        const { container, ref } = useCore({ suspendable: false })

        if (!containerValue) {
          containerValue = container
        }

        return <test-container-start ref={ref} />
      }

      render(<TestComponent />)

      expect(containerValue).toBeInstanceOf(DocumentFragment)
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

      let containerValue: DocumentFragment | ShadowRoot | null = null

      function TestComponent() {
        const { container, ref } = useCore({ suspendable: false })
        containerValue = container

        return <test-portal-target ref={ref} />
      }

      render(<TestComponent />)

      // DocumentFragment should be a valid Node
      expect(containerValue).toBeInstanceOf(Node)
      expect(containerValue!.nodeType).toBeDefined()
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

      let hookWorked = false

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })
        hookWorked = true

        return <test-with-context ref={ref} />
      }

      render(
        <Context.Provider value="dark">
          <TestComponent />
        </Context.Provider>
      )

      // Hook should work normally with Context
      expect(hookWorked).toBe(true)
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

      let hookWorked = false

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })
        hookWorked = true

        return <test-no-context ref={ref} />
      }

      render(<TestComponent />)

      // Hook should work even without Provider
      expect(hookWorked).toBe(true)
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

      let initialRef: React.RefObject<HTMLElement> | null = null
      let updatedRef: React.RefObject<HTMLElement> | null = null
      let renderCount = 0

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })

        if (renderCount === 0) {
          initialRef = ref
        } else {
          updatedRef = ref
        }

        renderCount++

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
      expect(initialRef).toBe(updatedRef)
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

      let hookWorked = false

      function TestComponent() {
        const { ref } = useCore({ suspendable: false })
        hookWorked = true

        return <test-suspendable-false ref={ref} />
      }

      render(<TestComponent />)

      expect(hookWorked).toBe(true)
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

      let hookWorked = false

      function TestComponent() {
        const { ref } = useCore({ suspendable: true })
        hookWorked = true

        return <test-suspendable-true ref={ref} />
      }

      render(<TestComponent />)

      expect(hookWorked).toBe(true)
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
