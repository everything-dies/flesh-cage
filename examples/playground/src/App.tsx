import { type MouseEventHandler, Suspense, useCallback, useState } from 'react'
import { Provider } from '@everything-dies/flesh-cage'

import { Button } from './components/Button'
import { Counter } from './components/Counter'

type Skins = 'material' | 'brutalist' | 'glassmorphic'

export function App() {
  const [skin, setSkin] = useState<Skins>('material')

  const toggle: MouseEventHandler<HTMLButtonElement> = useCallback(
    ({ currentTarget: { value } }) => {
      setSkin(value as Skins)
    },
    []
  )

  return (
    <Provider skin={skin}>
      <div>
        <h1>Flesh Cage Playground</h1>

        <div>
          <Suspense fallback="Loading style...">
            <h2>Select Skin:</h2>

            <Button onClick={toggle} value="material">
              Material
            </Button>

            <Button onClick={toggle} value="brutalist">
              Brutalist
            </Button>

            <Button onClick={toggle} value="glassmorphic">
              Glassmorphic
            </Button>

            <p>
              Current: <strong>{skin}</strong>
            </p>
          </Suspense>
        </div>

        <Suspense fallback="Loading style...">
          <Counter />
        </Suspense>

        <Provider skin="brutalist">
          <div>
            <h2>Nested Providers Example</h2>

            <div>
              <code>
                <pre>{`<Provider skin="brutalist" />`}</pre>
              </code>

              <Button onClick={toggle} value="brutalist">
                Always brutalist
              </Button>
            </div>
          </div>
        </Provider>
      </div>
    </Provider>
  )
}
