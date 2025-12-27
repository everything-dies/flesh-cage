import { describe, it, expect } from 'vitest'
import { shadowComponents } from './index'

describe('shadowComponents', () => {
  it('should export a function', () => {
    expect(typeof shadowComponents).toBe('function')
  })

  it('should return a Vite plugin object', () => {
    const plugin = shadowComponents()
    expect(plugin).toBeDefined()
    expect(plugin.name).toBe('flesh-cage:shadow-components')
    expect(typeof plugin.transform).toBe('function')
  })

  it('should accept options', () => {
    const plugin = shadowComponents({
      include: '**/*.tsx',
      exclude: ['**/*.test.tsx'],
    })
    expect(plugin).toBeDefined()
  })
})
