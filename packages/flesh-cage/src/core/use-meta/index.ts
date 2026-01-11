/*
import { useLayoutEffect, useState } from 'react'

import { EventTarget } from '../event-target'
import { useContext } from '../use-context'

export type State = { loading: boolean }

export const useMeta = () => {
  const [state, update] = useState({ loading: true })
  const { id } = useContext()

  useLayoutEffect(() => {
    const type = id as string
    const callback = (event: Event) => {
      const { detail: status } = event as CustomEvent<State>

      return update(status)
    }

    EventTarget.addEventListener(type, callback)

    return () => EventTarget.removeEventListener(type, callback)
  }, [id])

  return state
}
*/
