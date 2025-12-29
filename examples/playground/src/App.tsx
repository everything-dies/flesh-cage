import { type MouseEventHandler, useCallback, useState } from 'react'
import { Provider } from '@everything-dies/flesh-cage'

import { Button } from './components/Button'
import './App.css'

type Skins = 'material' | 'brutalist' | 'glassmorphic'

export function App() {
  const [count, setCount] = useState(0)
  const [skin, setSkin] = useState<Skins>('material')

  const toggleSkin: MouseEventHandler<HTMLButtonElement> = useCallback(
    ({ currentTarget: { value } }) => setSkin(value as Skins),
    []
  )

  const decrementCounter = useCallback(() => {
    setCount((count) => count - 1)
  }, [])

  const incrementCounter = useCallback(() => {
    setCount((count) => count + 1)
  }, [])

  return (
    <div className="App">
      <h1>Flesh Cage Playground</h1>

      <div className="skin-selector">
        <h2>Select Skin:</h2>

        <button onClick={toggleSkin} value="material">
          Material
        </button>

        <button onClick={toggleSkin} value="brutalist">
          Brutalist
        </button>

        <button onClick={toggleSkin} value="glassmorphic">
          Glassmorphic
        </button>

        <p>
          Current: <strong>{skin}</strong>
        </p>
      </div>

      <Provider skin={skin}>
        <div className="card">
          <h2>Test Button with Shadow DOM</h2>

          <Button onClick={incrementCounter}>Count is {count}</Button>

          <p className="hint">Click the button to increment. Change skins to see visual changes.</p>
        </div>

        <div className="nested-example">
          <h2>Nested Providers Example</h2>

          <Button onClick={incrementCounter}>Uses {skin} skin</Button>

          <Provider skin="brutalist">
            <div>
              <p>Nested provider (brutalist):</p>

              <Button onClick={decrementCounter}>Always brutalist (count: {count})</Button>
            </div>
          </Provider>
        </div>
      </Provider>
    </div>
  )
}
