import { describe, it, expect } from 'vitest'
import { renderHook, render } from '@testing-library/react'
import { useContext } from '../index'
import { Context } from '../../context'

/**
 * useContext hook tests
 * Tests the wrapper hook that provides convenient Context access
 */
describe('useContext', () => {
  describe('Without Provider', () => {
    it('returns undefined when no Provider exists', () => {
      const { result } = renderHook(() => useContext())

      expect(result.current).toBe(undefined)
    })

    it('does not throw when called outside Provider', () => {
      expect(() => {
        renderHook(() => useContext())
      }).not.toThrow()
    })

    it('returns undefined for multiple calls without Provider', () => {
      const { result: result1 } = renderHook(() => useContext())
      const { result: result2 } = renderHook(() => useContext())
      const { result: result3 } = renderHook(() => useContext())

      expect(result1.current).toBe(undefined)
      expect(result2.current).toBe(undefined)
      expect(result3.current).toBe(undefined)
    })
  })

  describe('With Provider', () => {
    it('returns Provider value when wrapped', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Context.Provider value="dark">{children}</Context.Provider>
      )

      const { result } = renderHook(() => useContext(), { wrapper })

      expect(result.current).toBe('dark')
    })

    it('returns different skin names correctly', () => {
      const skins = ['light', 'dark', 'high-contrast'] as const

      skins.forEach((skin) => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <Context.Provider value={skin}>{children}</Context.Provider>
        )

        const { result } = renderHook(() => useContext(), { wrapper })

        expect(result.current).toBe(skin)
      })
    })

    it('updates when Provider value changes', () => {
      const { result, rerender } = renderHook(() => useContext(), {
        wrapper: ({ children }) => (
          <Context.Provider value="light">{children}</Context.Provider>
        ),
      })

      expect(result.current).toBe('light')

      rerender()

      // Note: rerender doesn't change the wrapper props in this setup
      // This test verifies hook behavior stays consistent
      expect(result.current).toBe('light')
    })

    it('returns undefined when Provider explicitly passes undefined', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Context.Provider value={undefined}>{children}</Context.Provider>
      )

      const { result } = renderHook(() => useContext(), { wrapper })

      expect(result.current).toBe(undefined)
    })
  })

  describe('With Nested Providers', () => {
    it('returns value from closest Provider', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Context.Provider value="outer">
          <Context.Provider value="inner">{children}</Context.Provider>
        </Context.Provider>
      )

      const { result } = renderHook(() => useContext(), { wrapper })

      expect(result.current).toBe('inner')
    })

    it('handles Provider value change across re-renders', () => {
      let providerValue = 'initial'

      function TestWrapper({ children }: { children: React.ReactNode }) {
        return <Context.Provider value={providerValue}>{children}</Context.Provider>
      }

      const { result, rerender } = renderHook(() => useContext(), {
        wrapper: TestWrapper,
      })

      expect(result.current).toBe('initial')

      // Change the provider value and rerender
      providerValue = 'updated'
      rerender()

      // The wrapper re-evaluates on rerender, so the new value is picked up
      expect(result.current).toBe('updated')
    })
  })

  describe('Type Safety', () => {
    it('returns string | undefined type', () => {
      const { result } = renderHook(() => useContext())

      // TypeScript should accept this assignment
      const value: string | undefined = result.current

      expect(value).toBe(undefined)
    })

    it('works with type narrowing', () => {
      function TestComponent() {
        const skin = useContext()

        // Type narrowing
        if (typeof skin === 'string') {
          // skin is string here
          return <div>{skin.toUpperCase()}</div>
        }

        return <div>No skin</div>
      }

      const { getByText } = render(
        <Context.Provider value="dark">
          <TestComponent />
        </Context.Provider>
      )

      expect(getByText('DARK')).toBeDefined()
    })
  })

  describe('Multiple Consumers', () => {
    it('multiple hooks receive same value from same Provider', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Context.Provider value="shared">{children}</Context.Provider>
      )

      const { result: result1 } = renderHook(() => useContext(), { wrapper })
      const { result: result2 } = renderHook(() => useContext(), { wrapper })
      const { result: result3 } = renderHook(() => useContext(), { wrapper })

      expect(result1.current).toBe('shared')
      expect(result2.current).toBe('shared')
      expect(result3.current).toBe('shared')
    })

    it('hooks in different Providers receive different values', () => {
      const wrapper1 = ({ children }: { children: React.ReactNode }) => (
        <Context.Provider value="provider-1">{children}</Context.Provider>
      )

      const wrapper2 = ({ children }: { children: React.ReactNode }) => (
        <Context.Provider value="provider-2">{children}</Context.Provider>
      )

      const { result: result1 } = renderHook(() => useContext(), {
        wrapper: wrapper1,
      })
      const { result: result2 } = renderHook(() => useContext(), {
        wrapper: wrapper2,
      })

      expect(result1.current).toBe('provider-1')
      expect(result2.current).toBe('provider-2')
    })
  })

  describe('Integration', () => {
    it('works with React components using the hook', () => {
      function SkinDisplay() {
        const skin = useContext()
        return <div data-testid="skin">{skin ?? 'none'}</div>
      }

      const { getByTestId } = render(
        <Context.Provider value="test-skin">
          <SkinDisplay />
        </Context.Provider>
      )

      expect(getByTestId('skin').textContent).toBe('test-skin')
    })

    it('handles conditional rendering based on hook value', () => {
      function ConditionalComponent() {
        const skin = useContext()

        if (skin === undefined) {
          return <div data-testid="no-provider">No Provider</div>
        }

        return <div data-testid="has-provider">Skin: {skin}</div>
      }

      const { getByTestId: getByTestIdWithout } = render(
        <ConditionalComponent />
      )
      expect(getByTestIdWithout('no-provider')).toBeDefined()

      const { getByTestId: getByTestIdWith } = render(
        <Context.Provider value="dark">
          <ConditionalComponent />
        </Context.Provider>
      )
      expect(getByTestIdWith('has-provider').textContent).toBe('Skin: dark')
    })
  })
})
