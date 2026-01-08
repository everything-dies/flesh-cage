import React, { useState } from 'react'
import { FleshCageImplementation } from '../implementations/flesh-cage'
import { StyledComponentsImplementation } from '../implementations/styled-components'
import { EmotionImplementation } from '../implementations/emotion'
import {
  createMassiveMount,
  createDeepNesting,
  createRapidCycles,
  createWideTree,
  createMemoryLeakTest,
  createSkinSwitchingStorm,
  createMixedComplexity,
  createLimitFinder,
  type StressTestName,
} from '../cases/StressTests'

type Implementation = 'flesh-cage' | 'styled-components' | 'emotion'

const implementations = {
  'flesh-cage': FleshCageImplementation,
  'styled-components': StyledComponentsImplementation,
  emotion: EmotionImplementation,
}

const stressTests = {
  MassiveMount: createMassiveMount,
  DeepNesting: createDeepNesting,
  RapidCycles: createRapidCycles,
  WideTree: createWideTree,
  MemoryLeakTest: createMemoryLeakTest,
  SkinSwitchingStorm: createSkinSwitchingStorm,
  MixedComplexity: createMixedComplexity,
  LimitFinder: createLimitFinder,
}

const testDescriptions: Record<
  StressTestName,
  { description: string; params?: Record<string, number> }
> = {
  MassiveMount: {
    description: 'Tests mounting thousands of components simultaneously',
    params: { count: 1000 },
  },
  DeepNesting: {
    description: 'Tests extremely deep component hierarchies',
    params: { depth: 100 },
  },
  RapidCycles: {
    description: 'Tests rapid mount/unmount cycles for memory leaks',
    params: { cycleCount: 100 },
  },
  WideTree: {
    description: 'Tests thousands of sibling components',
    params: { breadth: 1000 },
  },
  MemoryLeakTest: {
    description: 'Interactive test to detect memory leaks',
  },
  SkinSwitchingStorm: {
    description: 'Tests rapid skin changes across many components',
    params: { count: 100 },
  },
  MixedComplexity: {
    description: 'Tests both deep and wide hierarchies (3125 components)',
  },
  LimitFinder: {
    description: 'Finds browser limits by incrementally adding components',
  },
}

export function StressRunner() {
  const [selectedImpl, setSelectedImpl] = useState<Implementation>('flesh-cage')
  const [selectedTest, setSelectedTest] = useState<StressTestName | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [metrics, setMetrics] = useState<{
    mountTime?: number
    memory?: number
    error?: string
  }>({})

  const runTest = async (testName: StressTestName) => {
    setSelectedTest(testName)
    setIsRunning(true)
    setMetrics({})

    // Measure memory before
    const memoryBefore = (
      performance as Performance & { memory?: { usedJSHeapSize: number } }
    ).memory?.usedJSHeapSize

    const startTime = performance.now()

    try {
      // Let React render
      await new Promise((resolve) => setTimeout(resolve, 0))

      const endTime = performance.now()
      const memoryAfter = (
        performance as Performance & { memory?: { usedJSHeapSize: number } }
      ).memory?.usedJSHeapSize

      setMetrics({
        mountTime: endTime - startTime,
        memory:
          memoryAfter && memoryBefore ? memoryAfter - memoryBefore : undefined,
      })
    } catch (error) {
      setMetrics({
        error: (error as Error).message,
      })
    } finally {
      setIsRunning(false)
    }
  }

  const clearTest = () => {
    setSelectedTest(null)
    setMetrics({})
  }

  const impl = implementations[selectedImpl]
  const TestComponent = selectedTest
    ? stressTests[selectedTest](impl.Box)
    : null

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Stress Test Runner</h1>

      <div style={{ marginBottom: '20px' }}>
        <h2>1. Select Implementation</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {(Object.keys(implementations) as Implementation[]).map(
            (implName) => (
              <button
                key={implName}
                onClick={() => setSelectedImpl(implName)}
                style={{
                  padding: '10px 20px',
                  backgroundColor:
                    selectedImpl === implName ? '#007bff' : '#ccc',
                  color: selectedImpl === implName ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {implName}
              </button>
            )
          )}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>2. Select Stress Test</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
          }}
        >
          {(Object.keys(stressTests) as StressTestName[]).map((testName) => (
            <div
              key={testName}
              style={{
                padding: '15px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor:
                  selectedTest === testName ? '#e7f3ff' : 'white',
              }}
              onClick={() => void runTest(testName)}
            >
              <h3 style={{ margin: '0 0 10px 0' }}>{testName}</h3>
              <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                {testDescriptions[testName].description}
              </p>
              {testDescriptions[testName].params && (
                <div
                  style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}
                >
                  Params: {JSON.stringify(testDescriptions[testName].params)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {metrics.mountTime !== undefined && (
        <div
          style={{
            padding: '15px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          <h3>Metrics</h3>
          <p>
            <strong>Mount Time:</strong> {metrics.mountTime.toFixed(2)}ms
          </p>
          {metrics.memory !== undefined && (
            <p>
              <strong>Memory Delta:</strong>{' '}
              {(metrics.memory / 1024 / 1024).toFixed(2)}MB
            </p>
          )}
          {metrics.error && (
            <p style={{ color: 'red' }}>
              <strong>Error:</strong> {metrics.error}
            </p>
          )}
        </div>
      )}

      {selectedTest && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button
              onClick={clearTest}
              style={{
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Clear Test
            </button>
            <button
              onClick={() => void runTest(selectedTest)}
              disabled={isRunning}
              style={{
                padding: '10px 20px',
                backgroundColor: isRunning ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isRunning ? 'not-allowed' : 'pointer',
              }}
            >
              {isRunning ? 'Running...' : 'Re-run'}
            </button>
          </div>

          <div
            style={{
              border: '2px solid #007bff',
              borderRadius: '4px',
              padding: '20px',
              minHeight: '200px',
              maxHeight: '600px',
              overflow: 'auto',
            }}
          >
            <h3>
              {selectedTest} - {selectedImpl}
            </h3>
            {TestComponent && (
              <TestComponent
                {...(testDescriptions[selectedTest].params || {})}
              />
            )}
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: '40px',
          padding: '20px',
          backgroundColor: '#fff3cd',
          borderRadius: '4px',
        }}
      >
        <h3>Tips for Stress Testing</h3>
        <ul>
          <li>
            <strong>Chrome DevTools:</strong> Open Performance tab before
            running tests to capture detailed profiles
          </li>
          <li>
            <strong>Memory:</strong> Use Chrome's Memory profiler to detect
            leaks. Take heap snapshots before/after
          </li>
          <li>
            <strong>Enable precise memory:</strong> Launch Chrome with{' '}
            <code>--enable-precise-memory-info</code> flag
          </li>
          <li>
            <strong>Performance:</strong> Use Performance monitor (Cmd+Shift+P →
            "Performance monitor") to watch real-time metrics
          </li>
          <li>
            <strong>Compare:</strong> Run same test across different
            implementations to compare overhead
          </li>
        </ul>
      </div>
    </div>
  )
}
