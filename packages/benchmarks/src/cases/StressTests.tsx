import React, { type ComponentType } from 'react'

/**
 * Stress test cases to discover flesh-cage limitations
 * These tests push the library to extremes to identify breaking points
 */

type BoxComponent = ComponentType<{
  color: string
  layout: 'column' | 'row'
  outer: boolean
  children?: React.ReactNode
}>

/**
 * STRESS TEST 1: Massive Mount
 * Tests performance with thousands of components mounted simultaneously
 *
 * Metrics to watch:
 * - Mount time
 * - Memory usage
 * - Browser responsiveness
 */
export function createMassiveMount(Box: BoxComponent) {
  function MassiveMount({ count = 1000 }: { count?: number }) {
    const items = Array.from({ length: count }, (_, i) => (
      <Box
        key={i}
        color={i % 2 === 0 ? 'red' : 'blue'}
        layout="row"
        outer={false}
      >
        Item {i}
      </Box>
    ))

    return (
      <Box color="transparent" layout="column" outer>
        {items}
      </Box>
    )
  }

  return MassiveMount
}

/**
 * STRESS TEST 2: Deep Nesting
 * Tests performance with extremely deep component hierarchies
 *
 * Shadow DOM creates a new scope at each level - this tests:
 * - Stack depth limits
 * - Portal nesting overhead
 * - Event bubbling performance
 */
export function createDeepNesting(Box: BoxComponent) {
  function DeepNest({
    depth,
    current = 0,
  }: {
    depth: number
    current?: number
  }) {
    if (current >= depth) {
      return (
        <Box color="black" layout="column" outer={false}>
          Bottom (depth: {depth})
        </Box>
      )
    }

    return (
      <Box
        color={
          current % 3 === 0 ? 'red' : current % 3 === 1 ? 'blue' : 'transparent'
        }
        layout="column"
        outer={false}
      >
        <DeepNest depth={depth} current={current + 1} />
      </Box>
    )
  }

  return DeepNest
}

/**
 * STRESS TEST 3: Rapid Mount/Unmount Cycles
 * Tests memory leaks and cleanup efficiency
 *
 * This test mounts and unmounts components rapidly to:
 * - Detect memory leaks
 * - Test GC pressure
 * - Verify cleanup (disconnectedCallback)
 */
export function createRapidCycles(Box: BoxComponent) {
  function RapidCycles({ cycleCount = 100 }: { cycleCount?: number }) {
    const [show, setShow] = React.useState(true)
    const [cycle, setCycle] = React.useState(0)

    React.useEffect(() => {
      if (cycle >= cycleCount) return

      const timer = setTimeout(() => {
        setShow((s) => !s)
        setCycle((c) => c + 1)
      }, 10)

      return () => clearTimeout(timer)
    }, [show, cycle, cycleCount])

    return (
      <Box color="transparent" layout="column" outer>
        <div>
          Cycle: {cycle} / {cycleCount}
        </div>
        {show && (
          <Box color="red" layout="row" outer={false}>
            Mounted component with Shadow DOM
          </Box>
        )}
      </Box>
    )
  }

  return RapidCycles
}

/**
 * STRESS TEST 4: Wide Tree
 * Tests performance with thousands of siblings
 *
 * Different from deep nesting - this tests:
 * - Horizontal scaling
 * - React reconciliation with many children
 * - Memory per-component overhead
 */
export function createWideTree(Box: BoxComponent) {
  function WideTree({ breadth = 1000 }: { breadth?: number }) {
    return (
      <Box color="transparent" layout="row" outer>
        {Array.from({ length: breadth }, (_, i) => (
          <Box
            key={i}
            color={i % 4 === 0 ? 'red' : 'blue'}
            layout="column"
            outer={false}
          >
            {i}
          </Box>
        ))}
      </Box>
    )
  }

  return WideTree
}

/**
 * STRESS TEST 5: Memory Leak Detection
 * Tests for proper cleanup and memory management
 *
 * Creates components, measures memory, destroys them, measures again
 */
export function createMemoryLeakTest(Box: BoxComponent) {
  function MemoryLeakTest() {
    const [components, setComponents] = React.useState<React.ReactNode[]>([])
    const [memorySnapshots, setMemorySnapshots] = React.useState<number[]>([])

    const createComponents = () => {
      const newComponents = Array.from({ length: 1000 }, (_, i) => (
        <Box
          key={`${String(Date.now())}-${String(i)}`}
          color="red"
          layout="row"
          outer={false}
        >
          Component {i}
        </Box>
      ))
      setComponents(newComponents)
    }

    const destroyComponents = () => {
      setComponents([])
    }

    const measureMemory = async () => {
      // Force GC if available (only in Chrome with --enable-precise-memory-info)
      if (
        'gc' in window &&
        typeof (window as typeof window & { gc: () => void }).gc === 'function'
      ) {
        ;(window as typeof window & { gc: () => void }).gc()
      }

      await new Promise((resolve) => setTimeout(resolve, 100))

      const memory =
        (performance as Performance & { memory?: { usedJSHeapSize: number } })
          .memory?.usedJSHeapSize || 0
      setMemorySnapshots((prev) => [...prev, memory])
    }

    return (
      <Box color="transparent" layout="column" outer>
        <div>
          <button onClick={() => createComponents()}>
            Create 1000 Components
          </button>
          <button onClick={destroyComponents}>Destroy All</button>
          <button onClick={() => void measureMemory()}>Measure Memory</button>
        </div>
        <div>
          <h4>Memory Snapshots (bytes):</h4>
          <pre>{JSON.stringify(memorySnapshots, null, 2)}</pre>
        </div>
        <Box color="transparent" layout="column" outer={false}>
          {components}
        </Box>
      </Box>
    )
  }

  return MemoryLeakTest
}

/**
 * STRESS TEST 6: Skin Switching Storm
 * Tests performance when rapidly changing skins across many components
 *
 * This stresses:
 * - adoptedStyleSheets updates
 * - AbortController churn
 * - Async skin loading
 */
export function createSkinSwitchingStorm(Box: BoxComponent) {
  function SkinSwitchingStorm({ count = 100 }: { count?: number }) {
    const [skinIndex, setSkinIndex] = React.useState(0)
    const skins = ['red', 'blue', 'transparent', 'black']

    React.useEffect(() => {
      const interval = setInterval(() => {
        setSkinIndex((prev) => (prev + 1) % skins.length)
      }, 100)

      return () => clearInterval(interval)
    }, [skins.length])

    const currentSkin = skins[skinIndex] as
      | 'red'
      | 'blue'
      | 'transparent'
      | 'black'

    return (
      <Box color="transparent" layout="column" outer>
        <div>Current skin: {currentSkin}</div>
        {Array.from({ length: count }, (_, i) => (
          <Box key={i} color={currentSkin} layout="row" outer={false}>
            Switching skin {i}
          </Box>
        ))}
      </Box>
    )
  }

  return SkinSwitchingStorm
}

/**
 * STRESS TEST 7: Mixed Depth and Breadth
 * Tests realistic complex UI with both deep and wide hierarchies
 */
export function createMixedComplexity(Box: BoxComponent) {
  function RecursiveTree({
    depth,
    breadth,
  }: {
    depth: number
    breadth: number
  }) {
    if (depth === 0) {
      return (
        <Box color="black" layout="column" outer={false}>
          Leaf
        </Box>
      )
    }

    return (
      <Box
        color={depth % 2 === 0 ? 'red' : 'blue'}
        layout="column"
        outer={false}
      >
        {Array.from({ length: breadth }, (_, i) => (
          <RecursiveTree key={i} depth={depth - 1} breadth={breadth} />
        ))}
      </Box>
    )
  }

  function MixedComplexity() {
    // This creates a tree with depth=5, breadth=5
    // Total components: 5^5 = 3125 components
    return (
      <Box color="transparent" layout="column" outer>
        <RecursiveTree depth={5} breadth={5} />
      </Box>
    )
  }

  return MixedComplexity
}

/**
 * STRESS TEST 8: Browser Limit Finder
 * Incrementally increases component count until browser breaks
 */
export function createLimitFinder(Box: BoxComponent) {
  function LimitFinder() {
    const [count, setCount] = React.useState(100)
    const [maxReached, setMaxReached] = React.useState<number | null>(null)
    const [error, setError] = React.useState<string | null>(null)

    const increaseCount = () => {
      try {
        setCount((prev) => prev + 100)
      } catch (err) {
        setError((err as Error).message)
        setMaxReached(count)
      }
    }

    return (
      <Box color="transparent" layout="column" outer>
        <div>
          <button onClick={increaseCount}>Add 100 Components</button>
          <div>Current count: {count}</div>
          {maxReached && <div>Max reached: {maxReached}</div>}
          {error && <div>Error: {error}</div>}
        </div>
        <Box color="transparent" layout="column" outer={false}>
          {Array.from({ length: count }, (_, i) => (
            <Box
              key={i}
              color={i % 2 === 0 ? 'red' : 'blue'}
              layout="row"
              outer={false}
            >
              {i}
            </Box>
          ))}
        </Box>
      </Box>
    )
  }

  return LimitFinder
}

// Export all stress tests
export const StressTests = {
  MassiveMount: 'Massive Mount (1000+ components)',
  DeepNesting: 'Deep Nesting (500+ levels)',
  RapidCycles: 'Rapid Mount/Unmount Cycles',
  WideTree: 'Wide Tree (1000+ siblings)',
  MemoryLeakTest: 'Memory Leak Detection',
  SkinSwitchingStorm: 'Skin Switching Storm',
  MixedComplexity: 'Mixed Depth/Breadth (3125 components)',
  LimitFinder: 'Browser Limit Finder',
} as const

export type StressTestName = keyof typeof StressTests
