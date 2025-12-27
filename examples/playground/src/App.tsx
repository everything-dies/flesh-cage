import { useState } from 'react'
import { SkinProvider } from '@flesh-cage/react'
import { Button } from './components/Button'
import './App.css'

export function App() {
  const [count, setCount] = useState(0)
  const [skin, setSkin] = useState<'material' | 'brutalist' | 'glassmorphic'>('material')

  return (
    <div className="App">
      <h1>Flesh Cage Playground</h1>

      <div className="skin-selector">
        <h2>Select Skin:</h2>
        <button onClick={() => setSkin('material')}>Material</button>
        <button onClick={() => setSkin('brutalist')}>Brutalist</button>
        <button onClick={() => setSkin('glassmorphic')}>Glassmorphic</button>
        <p>Current: <strong>{skin}</strong></p>
      </div>

      <SkinProvider skin={skin}>
        <div className="card">
          <h2>Test Button with Shadow DOM</h2>
          <Button onClick={() => setCount((count) => count + 1)}>
            Count is {count}
          </Button>
          <p className="hint">
            Click the button to increment. Change skins to see visual changes.
          </p>
        </div>

        <div className="nested-example">
          <h2>Nested Providers Example</h2>
          <Button onClick={() => setCount((c) => c + 1)}>
            Uses {skin} skin
          </Button>

          <SkinProvider skin="brutalist">
            <div style={{ marginTop: '1rem', padding: '1rem', border: '2px dashed #666' }}>
              <p>Nested provider (brutalist):</p>
              <Button onClick={() => setCount((c) => c - 1)}>
                Always brutalist (count: {count})
              </Button>
            </div>
          </SkinProvider>
        </div>
      </SkinProvider>

      <div className="info">
        <h3>How This Works</h3>
        <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
          <li>Components use <code>createShadowComponent</code> from <code>@flesh-cage/react</code></li>
          <li>Skins are lazy-loaded via dynamic imports</li>
          <li>Styles are applied using Constructable Stylesheets</li>
          <li>Shadow DOM provides true encapsulation</li>
          <li>Context (<code>SkinProvider</code>) manages which skin is active</li>
          <li>No prop drilling - skin comes from context!</li>
        </ul>
      </div>
    </div>
  )
}
