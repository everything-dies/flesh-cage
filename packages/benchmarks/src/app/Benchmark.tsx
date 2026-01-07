import { useState, useRef } from 'react'
import { createRoot } from 'react-dom/client'

export type BenchmarkResult = {
  mean: number
  stdDev: number
  samples: number[]
}

type BenchmarkProps = {
  component: React.ComponentType<unknown>
  componentProps: Record<string, unknown>
  name: string
  onComplete?: (result: BenchmarkResult) => void
  sampleCount?: number
  type: 'mount' | 'update'
}

/**
 * Benchmark component - measures performance of mount/update operations
 * Simplified version focusing on accurate measurements
 */
export function Benchmark({
  component: Component,
  componentProps,
  name,
  onComplete,
  sampleCount = 50,
  type,
}: BenchmarkProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<BenchmarkResult | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const runBenchmark = async () => {
    setIsRunning(true)
    setResult(null)

    if (type === 'mount') {
      await runMountBenchmark()
    } else {
      await runUpdateBenchmark()
    }
  }

  const runMountBenchmark = async () => {
    const samples: number[] = []
    const container = containerRef.current
    if (!container) return

    for (let i = 0; i < sampleCount; i++) {
      // Clear previous mount
      container.innerHTML = ''
      const root = document.createElement('div')
      container.appendChild(root)

      // Create React root
      const reactRoot = createRoot(root)

      // Measure just the render time
      await new Promise<void>((resolve) => {
        const start = performance.now()

        reactRoot.render(<Component {...componentProps} />)

        // Wait for render to complete
        requestAnimationFrame(() => {
          const end = performance.now()
          samples.push(end - start)

          // Cleanup
          reactRoot.unmount()
          resolve()
        })
      })

      // Brief pause between samples
      await new Promise((resolve) => setTimeout(resolve, 10))
    }

    finalizeBenchmark(samples)
  }

  const runUpdateBenchmark = async () => {
    const samples: number[] = []
    const container = containerRef.current
    if (!container) return

    // Mount component once
    container.innerHTML = ''
    const root = document.createElement('div')
    container.appendChild(root)
    const reactRoot = createRoot(root)

    // Initial render
    await new Promise<void>((resolve) => {
      reactRoot.render(<Component renderCount={0} {...componentProps} />)
      requestAnimationFrame(() => resolve())
    })

    // Measure updates
    for (let i = 1; i <= sampleCount; i++) {
      await new Promise<void>((resolve) => {
        const start = performance.now()

        // Trigger re-render with new props
        reactRoot.render(<Component renderCount={i} {...componentProps} />)

        requestAnimationFrame(() => {
          const end = performance.now()
          samples.push(end - start)
          resolve()
        })
      })

      // Brief pause between updates
      await new Promise((resolve) => setTimeout(resolve, 5))
    }

    // Cleanup
    reactRoot.unmount()

    finalizeBenchmark(samples)
  }

  const finalizeBenchmark = (samples: number[]) => {
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length
    const variance =
      samples.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
      samples.length
    const stdDev = Math.sqrt(variance)

    const result = { mean, stdDev, samples }
    setResult(result)
    setIsRunning(false)

    if (onComplete) {
      onComplete(result)
    }
  }

  return (
    <div
      style={{
        marginBottom: '20px',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
      }}
    >
      <h3 style={{ marginTop: 0 }}>{name}</h3>
      <button
        onClick={() => void runBenchmark()}
        disabled={isRunning}
        style={{
          padding: '8px 16px',
          fontSize: '14px',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          backgroundColor: isRunning ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
        }}
      >
        {isRunning ? 'Running...' : 'Run Benchmark'}
      </button>

      {result && (
        <div
          data-testid="run-result"
          style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
          }}
        >
          <p style={{ margin: '5px 0' }}>
            <strong>Mean:</strong> {result.mean.toFixed(2)}ms
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>Std Dev:</strong> {result.stdDev.toFixed(2)}ms
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>Samples:</strong> {result.samples.length}
          </p>
          <details style={{ marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer' }}>View all samples</summary>
            <pre
              style={{ fontSize: '11px', maxHeight: '200px', overflow: 'auto' }}
            >
              {result.samples
                .map((s, i) => `${String(i + 1)}: ${s.toFixed(2)}ms`)
                .join('\n')}
            </pre>
          </details>
        </div>
      )}

      <div
        ref={containerRef}
        style={{ marginTop: '10px', minHeight: '50px' }}
      />
    </div>
  )
}
