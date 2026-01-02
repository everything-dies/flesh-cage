import { type MouseEventHandler, useCallback, useState } from 'react'

import { Button } from '../Button'

const reducers = {
  decrement: (state: number) => state - 1,
  increment: (state: number) => state + 1,
}

export const Counter = () => {
  const [times, persist] = useState(0)

  const decrement: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    persist(reducers.decrement)
  }, [])

  const increment: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    persist(reducers.increment)
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
