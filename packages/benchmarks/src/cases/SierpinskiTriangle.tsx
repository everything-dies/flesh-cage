import { useState, useEffect, type ComponentType } from 'react'
import { BenchmarkType } from './Tree'

export type SierpinskiTriangleProps = {
  renderCount: number
  s: number
  x: number
  y: number
}

type DotComponent = ComponentType<{
  color: string
  size: number
  x: number
  y: number
  children: React.ReactNode
}>

/**
 * SierpinskiTriangle benchmark - adapted from styled-components
 * Tests update performance with dynamic style changes
 *
 * For flesh-cage, this tests:
 * - Skin switching performance
 * - adoptedStyleSheets update overhead
 * - Re-render performance with shadow DOM
 */
export function createSierpinskiTriangle(Dot: DotComponent) {
  const targetSize = 10

  function SierpinskiTriangle({
    renderCount,
    s,
    x,
    y,
  }: SierpinskiTriangleProps) {
    if (s <= targetSize) {
      // Generate color based on render count (simulates skin switching)
      const hue = (renderCount * 50) % 360
      const color = `hsl(${String(hue)}, 70%, 50%)`

      return (
        <Dot
          color={color}
          size={targetSize}
          x={x - targetSize / 2}
          y={y - targetSize / 2}
        >
          {renderCount % 100 === 0 ? '*' : '•'}
        </Dot>
      )
    }

    const newSize = s / 2

    return (
      <>
        <SierpinskiTriangle
          renderCount={renderCount}
          s={newSize}
          x={x}
          y={y - newSize / 2}
        />
        <SierpinskiTriangle
          renderCount={renderCount}
          s={newSize}
          x={x - newSize}
          y={y + newSize / 2}
        />
        <SierpinskiTriangle
          renderCount={renderCount}
          s={newSize}
          x={x + newSize}
          y={y + newSize / 2}
        />
      </>
    )
  }

  function SierpinskiTriangleBenchmark() {
    const [renderCount, setRenderCount] = useState(0)
    const [elapsed, setElapsed] = useState(0)

    useEffect(() => {
      const start = performance.now()
      let frame: number

      const tick = () => {
        setRenderCount((c) => c + 1)
        setElapsed(performance.now() - start)
        frame = requestAnimationFrame(tick)
      }

      frame = requestAnimationFrame(tick)

      return () => cancelAnimationFrame(frame)
    }, [])

    return (
      <div>
        <SierpinskiTriangle renderCount={renderCount} s={200} x={0} y={0} />
        <div style={{ position: 'absolute', top: 0, left: 0, color: 'white' }}>
          Frames: {renderCount} / Elapsed: {elapsed.toFixed(2)}ms
        </div>
      </div>
    )
  }

  SierpinskiTriangleBenchmark.benchmarkType = BenchmarkType.UPDATE

  return SierpinskiTriangleBenchmark
}
