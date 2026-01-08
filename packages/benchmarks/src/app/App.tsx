import { useState } from 'react'
import { FleshCageImplementation } from '../implementations/flesh-cage'
import { StyledComponentsImplementation } from '../implementations/styled-components'
import { EmotionImplementation } from '../implementations/emotion'
import { Benchmark } from './Benchmark'

const implementations = [
  FleshCageImplementation,
  StyledComponentsImplementation,
  EmotionImplementation,
]

const MOUNT_DEEP_PROPS = Object.freeze({
  breadth: 2,
  depth: 7,
  id: 0,
  wrap: 1,
})

const MOUNT_WIDE_PROPS = Object.freeze({
  breadth: 6,
  depth: 3,
  id: 0,
  wrap: 1,
})

const EMPTY_PROPS = Object.freeze({})

/**
 * Main benchmark app
 * Compares flesh-cage with styled-components and emotion
 */
export function App() {
  const [selectedImpl, setSelectedImpl] = useState(FleshCageImplementation.name)

  const impl =
    implementations.find((i) => i.name === selectedImpl) ||
    FleshCageImplementation
  const { Tree, SierpinskiTriangle, SkinSwitch, TreeSingle } = impl
  const warmupCount = 10
  const discardCount = 5

  return (
    <div
      style={{
        padding: '20px',
        fontFamily: 'sans-serif',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <h1>CSS-in-JS Performance Benchmarks</h1>
      <p>Compare rendering performance across different CSS-in-JS libraries.</p>

      <div
        style={{
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Select Implementation</h3>
        <select
          id="implementation-select"
          value={selectedImpl}
          onChange={(e) => setSelectedImpl(e.target.value)}
          style={{
            padding: '10px',
            fontSize: '14px',
            marginBottom: '10px',
            borderRadius: '4px',
            border: '2px solid #007bff',
          }}
        >
          {implementations.map((implementation) => (
            <option key={implementation.name} value={implementation.name}>
              {implementation.name} ({implementation.version})
            </option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          {implementations.map((implementation) => (
            <button
              key={implementation.name}
              onClick={() => setSelectedImpl(implementation.name)}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor:
                  selectedImpl === implementation.name ? '#007bff' : '#fff',
                color: selectedImpl === implementation.name ? 'white' : '#000',
                border: '2px solid #007bff',
                borderRadius: '4px',
                fontWeight:
                  selectedImpl === implementation.name ? 'bold' : 'normal',
              }}
            >
              {implementation.name} ({implementation.version})
            </button>
          ))}
        </div>
      </div>

      <hr />

      <h2>Mount Benchmarks</h2>
      <p>Measure the time it takes to mount component trees.</p>

      <Benchmark
        component={Tree}
        componentProps={MOUNT_DEEP_PROPS}
        name={`${impl.name} - Mount deep tree (depth: 7, breadth: 2)`}
        sampleCount={50}
        warmupCount={warmupCount}
        discardCount={discardCount}
        type="mount"
        testId="mount-deep"
      />

      <Benchmark
        component={Tree}
        componentProps={MOUNT_WIDE_PROPS}
        name={`${impl.name} - Mount wide tree (depth: 3, breadth: 6)`}
        sampleCount={50}
        warmupCount={warmupCount}
        discardCount={discardCount}
        type="mount"
        testId="mount-wide"
      />

      <hr />

      <h2>Mount Benchmarks (single provider)</h2>
      <p>Measure mount time with a single root-level provider.</p>

      <Benchmark
        component={TreeSingle}
        componentProps={MOUNT_DEEP_PROPS}
        name={`${impl.name} - Mount deep tree (single provider)`}
        sampleCount={50}
        warmupCount={warmupCount}
        discardCount={discardCount}
        type="mount"
        testId="mount-deep-single"
      />

      <Benchmark
        component={TreeSingle}
        componentProps={MOUNT_WIDE_PROPS}
        name={`${impl.name} - Mount wide tree (single provider)`}
        sampleCount={50}
        warmupCount={warmupCount}
        discardCount={discardCount}
        type="mount"
        testId="mount-wide-single"
      />

      <hr />

      <h2>Update Benchmarks</h2>
      <p>Measure the time it takes to update dynamic styles.</p>

      <Benchmark
        component={SierpinskiTriangle}
        componentProps={EMPTY_PROPS}
        name={`${impl.name} - Update dynamic styles (Sierpinski Triangle)`}
        sampleCount={100}
        warmupCount={warmupCount}
        discardCount={discardCount}
        type="update"
        testId="update-triangle"
      />

      <Benchmark
        component={SkinSwitch}
        componentProps={EMPTY_PROPS}
        name={`${impl.name} - Update skin/theme switching`}
        sampleCount={100}
        warmupCount={warmupCount}
        discardCount={discardCount}
        type="update"
        testId="update-skin-switch"
      />

      <hr />

      <div
        style={{
          marginTop: '40px',
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
        }}
      >
        <h3>Architecture Differences</h3>

        <div style={{ marginTop: '20px' }}>
          <h4>flesh-cage (Shadow DOM + Custom Elements)</h4>
          <ul>
            <li>Creates custom elements for each styled component</li>
            <li>Attaches shadow DOM for style isolation</li>
            <li>Uses constructable stylesheets (adoptedStyleSheets API)</li>
            <li>Renders children via React portals into shadow DOM</li>
            <li>Async skin loading with AbortController</li>
          </ul>
        </div>

        <div style={{ marginTop: '20px' }}>
          <h4>styled-components (Traditional CSS-in-JS)</h4>
          <ul>
            <li>
              Injects <code>&lt;style&gt;</code> tags into document head
            </li>
            <li>Generates unique class names for components</li>
            <li>No shadow DOM - relies on CSS specificity</li>
            <li>Synchronous style injection</li>
            <li>Theme via React context</li>
          </ul>
        </div>

        <div style={{ marginTop: '20px' }}>
          <h4>emotion (CSS-in-JS with runtime)</h4>
          <ul>
            <li>
              Injects <code>&lt;style&gt;</code> tags into document head
            </li>
            <li>Fast runtime with optimized insertions</li>
            <li>No shadow DOM - CSS in global scope</li>
            <li>Synchronous style injection</li>
            <li>Theme via React context or css prop</li>
          </ul>
        </div>

        <p style={{ marginTop: '20px', fontStyle: 'italic' }}>
          <strong>Note:</strong> These benchmarks measure different
          architectural overhead. Lower is better, but the best choice depends
          on your specific use case (e.g., style isolation needs, browser
          compatibility, bundle size).
        </p>
      </div>
    </div>
  )
}
