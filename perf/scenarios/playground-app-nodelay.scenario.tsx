// perf/scenarios/playground-app-nodelay.scenario.tsx
// @ts-nocheck - This will be bundled, so we can ignore TS errors here.
import { type MouseEventHandler, useCallback, useState } from 'react'
import { Provider, styled } from '@everything-dies/flesh-cage'

const ButtonBase = ({ children, ...props }) => (
  <button part="surface" {...props}>
    <span part="label">{children}</span>
  </button>
)

const skins = {
  brutalist: () =>
    import('../../examples/playground/src/components/Button/skins/brutalist'),
  glassmorphic: () =>
    import('../../examples/playground/src/components/Button/skins/glassmorphic'),
  material: () =>
    import('../../examples/playground/src/components/Button/skins/material'),
}

const Button = styled(ButtonBase, {
  skins,
  exportparts: 'label, surface',
  name: 'styled-button-nodelay',
  suspendable: false,
})

type Skins = 'material' | 'brutalist' | 'glassmorphic'

const Counter = () => {
  const [times, persist] = useState(0)

  const decrement: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    persist((state) => state - 1)
  }, [])

  const increment: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    persist((state) => state + 1)
  }, [])

  return (
    <fieldset>
      <legend>This is a counter</legend>

      <Button onClick={decrement}>Minus</Button>

      <output>{times}</output>

      <Button onClick={increment}>Plus</Button>
    </fieldset>
  )
}

const App = () => {
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
        </div>

        <Counter />

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

function findButtonByText(text: string): HTMLButtonElement | null {
  const buttons = Array.from(document.querySelectorAll('button'))
  return (buttons.find((button) => button.textContent?.trim() === text) ||
    null) as HTMLButtonElement | null
}

function clickButton(button: HTMLButtonElement | null) {
  if (!button) {
    return
  }
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

export async function run({ root, React }) {
  root.render(React.createElement(App))
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  })

  clickButton(findButtonByText('Brutalist'))
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  })

  clickButton(findButtonByText('Glassmorphic'))
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  })

  clickButton(findButtonByText('Material'))
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  })

  clickButton(findButtonByText('Plus'))
  clickButton(findButtonByText('Plus'))
  clickButton(findButtonByText('Minus'))
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  })
}
