// perf/scenarios/bulk-elements-switch.scenario.tsx
// @ts-nocheck - This will be bundled, so we can ignore TS errors here.
import { Provider, styled } from '@everything-dies/flesh-cage'

const ButtonBase = ({ children, ...props }) => (
  <button part="surface" {...props}>
    <span part="label">{children}</span>
  </button>
)

const skins = {
  brutalist: () =>
    import('../../examples/playground/src/components/Button/skins/brutalist'),
  material: () =>
    import('../../examples/playground/src/components/Button/skins/material'),
}

const Button = styled(ButtonBase, {
  skins,
  exportparts: 'label, surface',
  name: 'bulk-button-switch',
  suspendable: false,
})

const COUNT = 1000

const App = ({ skin }: { skin: 'material' | 'brutalist' }) => {
  const buttons = Array.from({ length: COUNT }, (_, index) => (
    <Button key={index}>Button {index}</Button>
  ))

  return (
    <Provider skin={skin}>
      <div>{buttons}</div>
    </Provider>
  )
}

export async function run({ root, React }) {
  root.render(React.createElement(App, { skin: 'material' }))
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  })

  root.render(React.createElement(App, { skin: 'brutalist' }))
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  })
}
