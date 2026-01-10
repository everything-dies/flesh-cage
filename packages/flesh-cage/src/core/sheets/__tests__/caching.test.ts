/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { describe, it, expect, vi } from 'vitest'
import { Sheets } from '../index'
import { createMockSkin } from '../../__tests__/utils'
import type { Skins } from '../../types'

describe('Sheets Caching Behavior', () => {
  describe('concurrent loads of same skin', () => {
    it('should share the same promise for concurrent requests', () => {
      const sheets = new Sheets({
        skins: {
          dark: createMockSkin('.dark { color: black; }'),
        },
      })

      // Trigger concurrent loads
      const promise1 = sheets.get('dark')
      const promise2 = sheets.get('dark')
      const promise3 = sheets.get('dark')

      // All should be the exact same promise instance
      expect(promise1).toBe(promise2)
      expect(promise2).toBe(promise3)
      expect(promise1).toBeInstanceOf(Promise)
    })

    it('should call loader only once for concurrent requests', async () => {
      const mockLoader = vi.fn(createMockSkin('.dark { }'))
      const sheets = new Sheets({
        skins: { dark: mockLoader },
      })

      // Make multiple concurrent requests
      const promises = [
        sheets.get('dark'),
        sheets.get('dark'),
        sheets.get('dark'),
        sheets.get('dark'),
      ]

      await Promise.all(promises)

      // Loader should be called exactly once
      expect(mockLoader).toHaveBeenCalledTimes(1)
    })

    it('should resolve all concurrent requests to the same stylesheet', async () => {
      const sheets = new Sheets({
        skins: {
          dark: createMockSkin('.dark { color: black; }'),
        },
      })

      const [sheet1, sheet2, sheet3] = await Promise.all([
        sheets.get('dark'),
        sheets.get('dark'),
        sheets.get('dark'),
      ])

      // All should be the exact same CSSStyleSheet instance
      expect(sheet1).toBe(sheet2)
      expect(sheet2).toBe(sheet3)
      expect(sheet1).toBeInstanceOf(CSSStyleSheet)
    })

    it('should handle mixed sequential and concurrent requests', async () => {
      const mockLoader = vi.fn(createMockSkin('.test { }'))
      const sheets = new Sheets({
        skins: { test: mockLoader },
      })

      // First request
      const promise1 = sheets.get('test')

      // Concurrent with first
      const promise2 = sheets.get('test')

      // Wait for first batch
      await Promise.all([promise1, promise2])

      // Sequential request after load completes
      const sheet = sheets.get('test')

      expect(promise1).toBe(promise2) // First two shared promise
      expect(sheet).toBeInstanceOf(CSSStyleSheet) // Third got cached sheet
      expect(mockLoader).toHaveBeenCalledTimes(1) // Only one load
    })
  })

  describe('cache hits', () => {
    it('should return cached stylesheet on subsequent calls', async () => {
      const sheets = new Sheets({
        skins: {
          dark: createMockSkin('.dark { }'),
        },
      })

      // First load
      const sheet1 = await sheets.get('dark')

      // Subsequent calls should return cached sheet
      const sheet2 = sheets.get('dark')
      const sheet3 = sheets.get('dark')

      expect(sheet2).toBe(sheet1)
      expect(sheet3).toBe(sheet1)
      expect(sheet2).toBeInstanceOf(CSSStyleSheet)
    })

    it('should maintain cache across many requests', async () => {
      const mockLoader = vi.fn(createMockSkin('.test { }'))
      const sheets = new Sheets({
        skins: { test: mockLoader },
      })

      // Load once
      await sheets.get('test')

      // Make many subsequent requests
      for (let i = 0; i < 100; i++) {
        const result = sheets.get('test')
        expect(result).toBeInstanceOf(CSSStyleSheet)
      }

      // Loader called only once
      expect(mockLoader).toHaveBeenCalledTimes(1)
    })

    it('should not evict cached stylesheets', async () => {
      const sheets = new Sheets({
        skins: {
          skin1: createMockSkin('.skin1 { }'),
          skin2: createMockSkin('.skin2 { }'),
          skin3: createMockSkin('.skin3 { }'),
        },
      })

      // Load all skins
      await Promise.all([
        sheets.get('skin1'),
        sheets.get('skin2'),
        sheets.get('skin3'),
      ])

      // All should remain cached
      expect(sheets.size).toBe(3)
      expect(sheets.get('skin1')).toBeInstanceOf(CSSStyleSheet)
      expect(sheets.get('skin2')).toBeInstanceOf(CSSStyleSheet)
      expect(sheets.get('skin3')).toBeInstanceOf(CSSStyleSheet)
    })

    it('should persist cache state through map iteration', async () => {
      const sheets = new Sheets({
        skins: {
          dark: createMockSkin('.dark { }'),
          light: createMockSkin('.light { }'),
        },
      })

      await Promise.all([sheets.get('dark'), sheets.get('light')])

      // Iterate over cache
      for (const [name, value] of sheets) {
        expect(value).toBeInstanceOf(CSSStyleSheet)
        expect(['dark', 'light']).toContain(name)
      }

      // Cache still intact after iteration
      expect(sheets.get('dark')).toBeInstanceOf(CSSStyleSheet)
      expect(sheets.get('light')).toBeInstanceOf(CSSStyleSheet)
    })
  })

  describe('multiple skins cached independently', () => {
    it('should cache different skins separately', async () => {
      const loaderDark = vi.fn(createMockSkin('.dark { }'))
      const loaderLight = vi.fn(createMockSkin('.light { }'))

      const sheets = new Sheets({
        skins: {
          dark: loaderDark,
          light: loaderLight,
        },
      })

      // Load both skins
      const darkSheet = await sheets.get('dark')
      const lightSheet = await sheets.get('light')

      expect(darkSheet).not.toBe(lightSheet)
      expect(loaderDark).toHaveBeenCalledTimes(1)
      expect(loaderLight).toHaveBeenCalledTimes(1)
    })

    it('should handle concurrent loads of different skins', async () => {
      const sheets = new Sheets({
        skins: {
          skin1: createMockSkin('.skin1 { }'),
          skin2: createMockSkin('.skin2 { }'),
          skin3: createMockSkin('.skin3 { }'),
        },
      })

      // Load all skins concurrently
      const [sheet1, sheet2, sheet3] = await Promise.all([
        sheets.get('skin1'),
        sheets.get('skin2'),
        sheets.get('skin3'),
      ])

      // All different instances
      expect(sheet1).not.toBe(sheet2)
      expect(sheet2).not.toBe(sheet3)
      expect(sheet1).not.toBe(sheet3)

      // All cached
      expect(sheets.size).toBe(3)
    })

    it('should allow independent cache invalidation', async () => {
      const sheets = new Sheets({
        skins: {
          dark: createMockSkin('.dark { }'),
          light: createMockSkin('.light { }'),
        },
      })

      await Promise.all([sheets.get('dark'), sheets.get('light')])

      // Delete one skin from cache
      sheets.delete('dark')

      expect(sheets.has('dark')).toBe(false)
      expect(sheets.has('light')).toBe(true)
      expect(sheets.get('light')).toBeInstanceOf(CSSStyleSheet)
    })

    it('should support parallel load and cache operations', async () => {
      const sheets = new Sheets({
        skins: {
          a: createMockSkin('.a { }'),
          b: createMockSkin('.b { }'),
          c: createMockSkin('.c { }'),
        },
      })

      // Mix of operations
      const operations = [
        sheets.get('a'), // Load A
        sheets.get('b'), // Load B
        sheets.get('a'), // Reuse A promise
        sheets.get('c'), // Load C
        sheets.get('b'), // Reuse B promise
      ]

      const results = await Promise.all(operations)

      // First and third should be same (A)
      expect(results[0]).toBe(results[2])

      // Second and fifth should be same (B)
      expect(results[1]).toBe(results[4])

      // All should be different sheets
      expect(results[0]).not.toBe(results[1])
      expect(results[1]).not.toBe(results[3])
      expect(results[0]).not.toBe(results[3])
    })

    it('should maintain independent cache state for many skins', async () => {
      const skins: Skins = {}
      const skinNames: string[] = []

      // Create 20 different skins
      for (let i = 0; i < 20; i++) {
        const name = `skin-${i}`
        skinNames.push(name)
        skins[name] = createMockSkin(`.${name} { }`)
      }

      const sheets = new Sheets({ skins })

      // Load all skins
      await Promise.all(skinNames.map((name) => sheets.get(name)))

      // Verify all cached
      expect(sheets.size).toBe(20)

      // Verify each is independently cached
      const cachedSheets = skinNames.map((name) => sheets.get(name))
      const uniqueSheets = new Set(cachedSheets)

      expect(uniqueSheets.size).toBe(20) // All unique instances
      cachedSheets.forEach((sheet) => {
        expect(sheet).toBeInstanceOf(CSSStyleSheet)
      })
    })
  })

  describe('cache behavior with errors', () => {
    it('should cache rejected promises', async () => {
      const error = new Error('Load failed')
      const mockLoader = vi.fn(() => Promise.reject(error))

      const sheets = new Sheets({
        skins: { broken: mockLoader },
      })

      // First attempt
      await expect(sheets.get('broken')).rejects.toThrow('Load failed')

      // Second attempt should use cached rejection
      await expect(sheets.get('broken')).rejects.toThrow('Load failed')

      // Loader only called once
      expect(mockLoader).toHaveBeenCalledTimes(1)
    })

    it('should allow retry after manual cache invalidation', async () => {
      let shouldFail = true
      const mockLoader = vi.fn(() => {
        if (shouldFail) {
          return Promise.reject(new Error('Network error'))
        }
        return createMockSkin('.success { }')()
      })

      const sheets = new Sheets({
        skins: { retry: mockLoader },
      })

      // First attempt fails
      await expect(sheets.get('retry')).rejects.toThrow('Network error')

      // Fix the issue
      shouldFail = false

      // Clear cache manually
      sheets.delete('retry')

      // Retry succeeds
      const sheet = await sheets.get('retry')
      expect(sheet).toBeInstanceOf(CSSStyleSheet)
      expect(mockLoader).toHaveBeenCalledTimes(2)
    })
  })
})
