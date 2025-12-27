import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SkinProvider, useSkinContext } from './context'

describe('SkinProvider', () => {
  it('should render without errors', () => {
    const { container } = render(
      <SkinProvider skin="test">
        <div>Test</div>
      </SkinProvider>
    )
    expect(container).toBeDefined()
  })

  it('should provide skin value to children', () => {
    let capturedSkin: string | undefined

    function TestChild() {
      capturedSkin = useSkinContext()
      return null
    }

    render(
      <SkinProvider skin="material">
        <TestChild />
      </SkinProvider>
    )

    expect(capturedSkin).toBe('material')
  })
})
