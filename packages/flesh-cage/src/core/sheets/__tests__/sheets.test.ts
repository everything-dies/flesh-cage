import { describe, it, expect, vi } from 'vitest'
import { Sheets } from '../index'
import { createMockSkin } from '../../__tests__/utils'
import type { Skins } from '../../types'

describe('Sheets', () => {
  describe('constructor', () => {
    it('should create an instance with provided skins', () => {
      const skins: Skins = {
        dark: createMockSkin('.dark { color: black; }'),
      }

      const sheets = new Sheets({ skins })

      expect(sheets).toBeInstanceOf(Sheets)
      expect(sheets).toBeInstanceOf(Map)
    })

    it('should initialize with empty map', () => {
      const skins: Skins = {
        dark: createMockSkin(''),
        light: createMockSkin(''),
      }

      const sheets = new Sheets({ skins })

      expect(sheets.size).toBe(0)
    })

    it('should accept generic type parameter for skin names', () => {
      type MySkins = 'primary' | 'secondary'
      const skins: Skins<MySkins> = {
        primary: createMockSkin(''),
        secondary: createMockSkin(''),
      }

      const sheets = new Sheets<MySkins>({ skins })

      expect(sheets).toBeInstanceOf(Sheets)
    })
  })

  describe('validate()', () => {
    it('should return true for valid skin names', () => {
      const sheets = new Sheets({
        skins: {
          dark: createMockSkin(''),
          light: createMockSkin(''),
        },
      })

      expect(sheets.validate('dark')).toBe(true)
      expect(sheets.validate('light')).toBe(true)
    })

    it('should return false for invalid skin names', () => {
      const sheets = new Sheets({
        skins: {
          dark: createMockSkin(''),
        },
      })

      expect(sheets.validate('invalid')).toBe(false)
      expect(sheets.validate('light')).toBe(false)
    })

    it('should return false for undefined', () => {
      const sheets = new Sheets({
        skins: { dark: createMockSkin('') },
      })

      expect(sheets.validate(undefined)).toBe(false)
    })

    it('should return false for empty string', () => {
      const sheets = new Sheets({
        skins: { dark: createMockSkin('') },
      })

      expect(sheets.validate('')).toBe(false)
    })

    it('should handle edge case skin names', () => {
      const sheets = new Sheets({
        skins: {
          'skin-with-dashes': createMockSkin(''),
          'skin_with_underscores': createMockSkin(''),
          'skin.with.dots': createMockSkin(''),
        },
      })

      expect(sheets.validate('skin-with-dashes')).toBe(true)
      expect(sheets.validate('skin_with_underscores')).toBe(true)
      expect(sheets.validate('skin.with.dots')).toBe(true)
    })
  })

  describe('get()', () => {
    it('should trigger load on first call', () => {
      const mockLoader = vi.fn(createMockSkin('.dark { }'))
      const sheets = new Sheets({
        skins: { dark: mockLoader },
      })

      const result = sheets.get('dark')

      expect(result).toBeInstanceOf(Promise)
      expect(mockLoader).toHaveBeenCalledTimes(1)
    })

    it('should return cached promise on subsequent calls before load completes', async () => {
      const sheets = new Sheets({
        skins: {
          dark: createMockSkin('.dark { color: black; }'),
        },
      })

      const result1 = sheets.get('dark')
      const result2 = sheets.get('dark')

      expect(result1).toBeInstanceOf(Promise)
      expect(result2).toBeInstanceOf(Promise)
      expect(result1).toBe(result2) // Same promise instance
    })

    it('should return cached stylesheet after load completes', async () => {
      const sheets = new Sheets({
        skins: {
          dark: createMockSkin('.dark { color: black; }'),
        },
      })

      const promise = sheets.get('dark')
      const sheet = await promise

      expect(sheet).toBeInstanceOf(CSSStyleSheet)

      const result = sheets.get('dark')
      expect(result).toBeInstanceOf(CSSStyleSheet)
      expect(result).toBe(sheet) // Same stylesheet instance
    })

    it('should load different skins independently', async () => {
      const sheets = new Sheets({
        skins: {
          dark: createMockSkin('.dark { }'),
          light: createMockSkin('.light { }'),
        },
      })

      const darkSheet = await sheets.get('dark')
      const lightSheet = await sheets.get('light')

      expect(darkSheet).toBeInstanceOf(CSSStyleSheet)
      expect(lightSheet).toBeInstanceOf(CSSStyleSheet)
      expect(darkSheet).not.toBe(lightSheet)
    })
  })

  describe('load()', () => {
    it('should create and return a promise', () => {
      const sheets = new Sheets({
        skins: {
          dark: createMockSkin('.dark { }'),
        },
      })

      const result = sheets.load('dark')

      expect(result).toBeInstanceOf(Promise)
    })

    it('should resolve to a CSSStyleSheet', async () => {
      const sheets = new Sheets({
        skins: {
          dark: createMockSkin('.dark { color: black; }'),
        },
      })

      const sheet = await sheets.load('dark')

      expect(sheet).toBeInstanceOf(CSSStyleSheet)
    })

    it('should cache the promise immediately', () => {
      const sheets = new Sheets({
        skins: {
          dark: createMockSkin('.dark { }'),
        },
      })

      sheets.load('dark')

      expect(sheets.size).toBe(1)
      expect(sheets.has('dark')).toBe(true)
    })

    it('should replace promise with stylesheet after resolution', async () => {
      const sheets = new Sheets({
        skins: {
          dark: createMockSkin('.dark { }'),
        },
      })

      const promise = sheets.load('dark')
      expect(sheets.get('dark')).toBeInstanceOf(Promise)

      await promise
      expect(sheets.get('dark')).toBeInstanceOf(CSSStyleSheet)
    })

    it('should handle loader rejection', async () => {
      const sheets = new Sheets({
        skins: {
          broken: () => Promise.reject(new Error('Load failed')),
        },
      })

      await expect(sheets.load('broken')).rejects.toThrow('Load failed')
    })

    it('should cache rejected promises', async () => {
      const sheets = new Sheets({
        skins: {
          broken: () => Promise.reject(new Error('Network error')),
        },
      })

      const promise1 = sheets.load('broken')
      const promise2 = sheets.get('broken')

      expect(promise2).toBe(promise1) // Same rejected promise

      await expect(promise1).rejects.toThrow()
      await expect(promise2).rejects.toThrow()
    })

    it('should call skin loader exactly once when using get()', async () => {
      const mockLoader = vi.fn(createMockSkin('.test { }'))
      const sheets = new Sheets({
        skins: { test: mockLoader },
      })

      await sheets.get('test')
      await sheets.get('test') // Second call should use cache

      expect(mockLoader).toHaveBeenCalledTimes(1)
    })
  })

  describe('Map inheritance', () => {
    it('should support Map methods: has()', async () => {
      const sheets = new Sheets({
        skins: { dark: createMockSkin('') },
      })

      expect(sheets.has('dark')).toBe(false)

      sheets.get('dark')
      expect(sheets.has('dark')).toBe(true)
    })

    it('should support Map methods: delete()', async () => {
      const sheets = new Sheets({
        skins: { dark: createMockSkin('') },
      })

      await sheets.get('dark')
      expect(sheets.has('dark')).toBe(true)

      sheets.delete('dark')
      expect(sheets.has('dark')).toBe(false)
    })

    it('should support Map methods: clear()', async () => {
      const sheets = new Sheets({
        skins: {
          dark: createMockSkin(''),
          light: createMockSkin(''),
        },
      })

      await Promise.all([sheets.get('dark'), sheets.get('light')])
      expect(sheets.size).toBe(2)

      sheets.clear()
      expect(sheets.size).toBe(0)
    })

    it('should support Map iteration', async () => {
      const sheets = new Sheets({
        skins: {
          dark: createMockSkin('.dark { }'),
          light: createMockSkin('.light { }'),
        },
      })

      await Promise.all([sheets.get('dark'), sheets.get('light')])

      const entries = Array.from(sheets.entries())
      expect(entries).toHaveLength(2)

      const keys = Array.from(sheets.keys())
      expect(keys).toContain('dark')
      expect(keys).toContain('light')
    })
  })
})
