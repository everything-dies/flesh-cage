import { describe, it, expect, vi, afterEach } from 'vitest'
import { EventTarget } from '../index'

describe('EventTarget', () => {
  afterEach(() => {
    // Clean up any lingering listeners by creating event types that won't conflict
    // Note: There's no way to remove all listeners from EventTarget, so we use unique event names in tests
  })

  describe('instance type', () => {
    it('should be an instance of EventTarget', () => {
      expect(EventTarget).toBeInstanceOf(window.EventTarget)
    })

    it('should be a singleton (same reference on multiple imports)', async () => {
      // Re-import to verify it's the same instance
      const { EventTarget: EventTarget2 } = await import('../index')
      expect(EventTarget).toBe(EventTarget2)
    })
  })

  describe('addEventListener', () => {
    it('should register event handlers', () => {
      const handler = vi.fn()
      const eventType = `test-event-${String(Math.random())}`

      EventTarget.addEventListener(eventType, handler)
      EventTarget.dispatchEvent(new Event(eventType))

      expect(handler).toHaveBeenCalledTimes(1)

      // Cleanup
      EventTarget.removeEventListener(eventType, handler)
    })

    it('should pass the event object to the handler', () => {
      const handler = vi.fn()
      const eventType = `test-event-${String(Math.random())}`
      const event = new Event(eventType)

      EventTarget.addEventListener(eventType, handler)
      EventTarget.dispatchEvent(event)

      expect(handler).toHaveBeenCalledWith(event)

      // Cleanup
      EventTarget.removeEventListener(eventType, handler)
    })
  })

  describe('removeEventListener', () => {
    it('should unregister event handlers', () => {
      const handler = vi.fn()
      const eventType = `test-event-${String(Math.random())}`

      EventTarget.addEventListener(eventType, handler)
      EventTarget.removeEventListener(eventType, handler)
      EventTarget.dispatchEvent(new Event(eventType))

      expect(handler).not.toHaveBeenCalled()
    })

    it('should only remove the specific handler', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const eventType = `test-event-${String(Math.random())}`

      EventTarget.addEventListener(eventType, handler1)
      EventTarget.addEventListener(eventType, handler2)
      EventTarget.removeEventListener(eventType, handler1)
      EventTarget.dispatchEvent(new Event(eventType))

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalledTimes(1)

      // Cleanup
      EventTarget.removeEventListener(eventType, handler2)
    })
  })

  describe('dispatchEvent', () => {
    it('should trigger all registered handlers for the event type', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()
      const eventType = `test-event-${String(Math.random())}`

      EventTarget.addEventListener(eventType, handler1)
      EventTarget.addEventListener(eventType, handler2)
      EventTarget.addEventListener(eventType, handler3)
      EventTarget.dispatchEvent(new Event(eventType))

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
      expect(handler3).toHaveBeenCalledTimes(1)

      // Cleanup
      EventTarget.removeEventListener(eventType, handler1)
      EventTarget.removeEventListener(eventType, handler2)
      EventTarget.removeEventListener(eventType, handler3)
    })

    it('should not trigger handlers for different event types', () => {
      const handler = vi.fn()
      const eventType1 = `test-event-${String(Math.random())}`
      const eventType2 = `test-event-${String(Math.random())}`

      EventTarget.addEventListener(eventType1, handler)
      EventTarget.dispatchEvent(new Event(eventType2))

      expect(handler).not.toHaveBeenCalled()

      // Cleanup
      EventTarget.removeEventListener(eventType1, handler)
    })

    it('should return true when event is dispatched', () => {
      const eventType = `test-event-${String(Math.random())}`
      const result = EventTarget.dispatchEvent(new Event(eventType))
      expect(result).toBe(true)
    })
  })

  describe('CustomEvent support', () => {
    it('should pass CustomEvent detail to handlers', () => {
      const handler = vi.fn()
      const eventType = `test-event-${String(Math.random())}`
      const detail = { skin: 'dark', timestamp: Date.now() }

      EventTarget.addEventListener(eventType, handler)
      EventTarget.dispatchEvent(new CustomEvent(eventType, { detail }))

      expect(handler).toHaveBeenCalledTimes(1)
      const event = handler.mock.calls[0][0] as CustomEvent
      expect(event.detail).toEqual(detail)

      // Cleanup
      EventTarget.removeEventListener(eventType, handler)
    })

    it('should handle complex detail objects', () => {
      const handler = vi.fn()
      const eventType = `test-event-${String(Math.random())}`
      type DetailType = {
        nested: { value: number }
        array: number[]
        fn: () => string
      }
      const detail: DetailType = {
        nested: { value: 42 },
        array: [1, 2, 3],
        fn: () => 'test',
      }

      EventTarget.addEventListener(eventType, handler)
      EventTarget.dispatchEvent(new CustomEvent(eventType, { detail }))

      const event = handler.mock.calls[0][0] as CustomEvent<DetailType>
      expect(event.detail.nested.value).toBe(42)
      expect(event.detail.array).toEqual([1, 2, 3])
      expect(event.detail.fn()).toBe('test')

      // Cleanup
      EventTarget.removeEventListener(eventType, handler)
    })
  })

  describe('once option', () => {
    it('should automatically remove handler after first call with once: true', () => {
      const handler = vi.fn()
      const eventType = `test-event-${String(Math.random())}`

      EventTarget.addEventListener(eventType, handler, { once: true })
      EventTarget.dispatchEvent(new Event(eventType))
      EventTarget.dispatchEvent(new Event(eventType))

      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('multiple dispatches', () => {
    it('should call handler for each dispatch', () => {
      const handler = vi.fn()
      const eventType = `test-event-${String(Math.random())}`

      EventTarget.addEventListener(eventType, handler)
      EventTarget.dispatchEvent(new Event(eventType))
      EventTarget.dispatchEvent(new Event(eventType))
      EventTarget.dispatchEvent(new Event(eventType))

      expect(handler).toHaveBeenCalledTimes(3)

      // Cleanup
      EventTarget.removeEventListener(eventType, handler)
    })
  })
})
