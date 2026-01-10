import { describe, it, expect } from 'vitest'
import { css } from '../index'

describe('css tag', () => {
  it('should act as a pass-through for the template literal', () => {
    const rawString = `
      div {
        color: red;
        font-size: 16px;
      }
    `
    const processedString = css`
      div {
        color: red;
        font-size: 16px;
      }
    `
    expect(processedString).toBe(rawString)
  })

  it('should handle interpolations correctly, just like a normal template literal', () => {
    const size = '16px'
    const rawString = `
      div {
        font-size: ${size};
      }
    `
    const processedString = css`
      div {
        font-size: ${size};
      }
    `
    expect(processedString).toBe(rawString)
  })

  it('should return an empty string for an empty template literal', () => {
    expect(css``).toBe('')
  })
})
