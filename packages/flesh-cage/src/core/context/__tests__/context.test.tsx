import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { useContext as useGenericContext } from 'react'
import { Context } from '../index'

/**
 * Context creation and value passing tests
 * Tests the core React Context that enables skin propagation
 */
describe('Context', () => {
  describe('Context creation', () => {
    it('creates a Context object with Provider and Consumer', () => {
      expect(Context).toBeDefined()
      expect(Context.Provider).toBeDefined()
      expect(Context.Consumer).toBeDefined()
    })

    it('Context is defined and stable', () => {
      // Verify Context is a singleton instance
      expect(Context).toBeDefined()
      expect(typeof Context).toBe('object')
      // Context identity stays stable across multiple references
      const ref1 = Context
      const ref2 = Context
      expect(ref1).toBe(ref2)
    })
  })

  describe('Default value', () => {
    it('provides undefined by default when no Provider exists', () => {
      let receivedValue: string | undefined = 'not-set'

      function Consumer() {
        receivedValue = useGenericContext(Context)
        return null
      }

      render(<Consumer />)

      expect(receivedValue).toBe(undefined)
    })

    it('types the context as string | undefined', () => {
      function Consumer() {
        const value = useGenericContext(Context)

        // TypeScript should allow string | undefined
        const _typeCheck: string | undefined = value
        expect(_typeCheck).toBe(value)

        return null
      }

      render(<Consumer />)
    })
  })

  describe('Value propagation', () => {
    it('passes string value through Provider to consumer', () => {
      let receivedValue: string | undefined = 'not-set'

      function Consumer() {
        receivedValue = useGenericContext(Context)
        return null
      }

      render(
        <Context.Provider value="dark">
          <Consumer />
        </Context.Provider>
      )

      expect(receivedValue).toBe('dark')
    })

    it('passes different skin names correctly', () => {
      const values: Array<string | undefined> = []

      function Consumer() {
        values.push(useGenericContext(Context))
        return null
      }

      const { rerender } = render(
        <Context.Provider value="light">
          <Consumer />
        </Context.Provider>
      )

      rerender(
        <Context.Provider value="dark">
          <Consumer />
        </Context.Provider>
      )

      rerender(
        <Context.Provider value="high-contrast">
          <Consumer />
        </Context.Provider>
      )

      expect(values).toEqual(['light', 'dark', 'high-contrast'])
    })

    it('supports Provider with undefined value', () => {
      let receivedValue: string | undefined = 'not-set'

      function Consumer() {
        receivedValue = useGenericContext(Context)
        return null
      }

      render(
        <Context.Provider value={undefined}>
          <Consumer />
        </Context.Provider>
      )

      expect(receivedValue).toBe(undefined)
    })
  })

  describe('Nested Providers', () => {
    it('inner Provider overrides outer Provider value', () => {
      const values: Record<string, string | undefined> = {}

      function OuterConsumer() {
        values['outer'] = useGenericContext(Context)
        return null
      }

      function InnerConsumer() {
        values['inner'] = useGenericContext(Context)
        return null
      }

      render(
        <Context.Provider value="light">
          <OuterConsumer />
          <Context.Provider value="dark">
            <InnerConsumer />
          </Context.Provider>
        </Context.Provider>
      )

      expect(values['outer']).toBe('light')
      expect(values['inner']).toBe('dark')
    })

    it('deeply nested Providers follow closest ancestor', () => {
      const values: string[] = []

      function Consumer({ id }: { id: string }) {
        const value = useGenericContext(Context)
        values.push(`${id}:${value}`)
        return null
      }

      render(
        <Context.Provider value="level-1">
          <Consumer id="A" />
          <Context.Provider value="level-2">
            <Consumer id="B" />
            <Context.Provider value="level-3">
              <Consumer id="C" />
            </Context.Provider>
            <Consumer id="D" />
          </Context.Provider>
          <Consumer id="E" />
        </Context.Provider>
      )

      expect(values).toEqual([
        'A:level-1',
        'B:level-2',
        'C:level-3',
        'D:level-2',
        'E:level-1',
      ])
    })
  })

  describe('Multiple consumers', () => {
    it('multiple consumers receive same value from same Provider', () => {
      const values: Array<string | undefined> = []

      function Consumer({ id }: { id: number }) {
        const value = useGenericContext(Context)
        values[id] = value
        return null
      }

      render(
        <Context.Provider value="shared">
          <Consumer id={0} />
          <Consumer id={1} />
          <Consumer id={2} />
        </Context.Provider>
      )

      expect(values[0]).toBe('shared')
      expect(values[1]).toBe('shared')
      expect(values[2]).toBe('shared')
    })
  })
})
