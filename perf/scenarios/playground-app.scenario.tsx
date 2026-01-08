// perf/scenarios/playground-app.scenario.tsx
// @ts-nocheck - This will be bundled, so we can ignore TS errors here.
import { App } from '../../examples/playground/src/App'

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

  clickButton(findButtonByText('Material'))
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  })

  clickButton(findButtonByText('Glassmorphic'))
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 2600)
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
