// perf/scenarios/leak-detection.scenario.ts
// @ts-nocheck - This will be bundled, so we can ignore TS errors here.
import { Provider, styled } from '@everything-dies/flesh-cage'
import { skins } from './skins'

// A component that changes on each iteration
const LeakyComponentBase = ({ iteration, ...props }) => (
  <button {...props}>Iteration {iteration}</button>
)

const StyledLeakyComponent = styled(LeakyComponentBase, {
  name: 'harness-leaky-button',
  skins,
})

// The workload now accepts an iteration prop to force re-renders
export const Workload = ({ iteration }) => {
  return (
    <Provider skin="material">
      <StyledLeakyComponent iteration={iteration} />
    </Provider>
  )
}

export async function run({ root, React }) {
  for (let i = 0; i < 500; i++) {
    root.render(React.createElement(Workload, { iteration: i }))
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
}
