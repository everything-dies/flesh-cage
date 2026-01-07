import { startTransition, use, useLayoutEffect, useRef, useState } from 'react'

import { useContext } from './use-context'

export const useCore = ({ suspendable }: { suspendable: boolean }) => {
  const skin = useContext()
  const ref = useRef<HTMLElement>(null)
  const [suspension, persist] = useState<Promise<unknown> | undefined>()
  const [container, attach] = useState<DocumentFragment | ShadowRoot>(
    document.createDocumentFragment()
  )

  useLayoutEffect(() => {
    const transition = () => attach(ref.current?.shadowRoot as ShadowRoot)

    return startTransition(transition)
  }, [])

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

  if (suspendable && suspension) {
    use(suspension)
  }

  return { container, ref } as const
}
