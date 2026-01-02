import { use, useLayoutEffect, useRef, useState } from 'react'

import { useContext } from './use-context'

export const useCore = () => {
  const skin = useContext()
  const ref = useRef<HTMLElement>(null)
  const [suspension, persist] = useState<Promise<unknown> | undefined>()
  const [container, attach] = useState<DocumentFragment | ShadowRoot>(
    document.createDocumentFragment()
  )

  useLayoutEffect(() => attach(ref.current?.shadowRoot as ShadowRoot), [])

  useLayoutEffect(() => {
    const element = ref.current as HTMLElement
    const suspend = (event: Event) => {
      const { detail } = event as CustomEvent<Promise<unknown>>

      return persist(detail)
    }

    element.addEventListener('suspend', suspend)

    return element.removeEventListener.bind(element, 'suspend', suspend)
  }, [])

  useLayoutEffect(() => {
    const element = ref.current as HTMLElement

    element.dispatchEvent(new CustomEvent('change', { detail: { skin } }))
  }, [skin])

  if (suspension) {
    use(suspension)
  }

  return { container, ref } as const
}
