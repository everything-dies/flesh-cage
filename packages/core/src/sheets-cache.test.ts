import { describe, it, expect } from 'vitest'
import { SheetsCache } from './sheets-cache'

describe('SheetsCache', () => {
  it('should instantiate without errors', () => {
    const cache = new SheetsCache({
      test: () => Promise.resolve({ default: 'body { color: red; }' }),
    })
    expect(cache).toBeDefined()
  })

  it('should have acquire and release methods', () => {
    const cache = new SheetsCache({
      test: () => Promise.resolve({ default: 'body { color: red; }' }),
    })
    expect(typeof cache.acquire).toBe('function')
    expect(typeof cache.release).toBe('function')
  })
})
