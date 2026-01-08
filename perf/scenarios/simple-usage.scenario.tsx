// perf/scenarios/simple-usage.scenario.ts
// @ts-nocheck - This will be bundled, so we can ignore TS errors here.
import { Provider, styled } from '@everything-dies/flesh-cage'
import { skins } from './skins'

// 1. Define a base component
const ButtonBase = ({ children, ...props }) => (
  <button {...props}>{children}</button>
)

// 2. Use 'styled' correctly
const StyledButton = styled(ButtonBase, {
  name: 'harness-button', // Essential for custom element registration
  skins,
})

// 3. Create a workload component that can be rendered
export const Workload = () => {
  return (
    <Provider skin="material">
      <StyledButton>Hello World</StyledButton>
    </Provider>
  )
}

export async function run({ root, React }) {
  root.render(React.createElement(Workload))
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}
