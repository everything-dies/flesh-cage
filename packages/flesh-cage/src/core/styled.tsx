import { createPortal } from 'react-dom'
import {
  type ComponentType,
  type HTMLAttributes,
  type ReactNode,
  Suspense,
  createElement,
} from 'react'
import { useCore } from './use-core'

import type { SkinMap } from './types'
import { Sheets } from './sheets'

export interface StyledConfig<T extends string = string> extends Partial<
  HTMLAttributes<HTMLElement>
> {
  fallback?: ReactNode
  name: string
  skins: SkinMap<T>
}

export const styled = <Props extends {}, T extends string = string>(
  Component: ComponentType<Props>,
  { fallback, name, skins, ...attributes }: StyledConfig<T>
): ComponentType<Props> => {
  const sheets = new Sheets({ skins })

  class CustomElement extends HTMLElement {
    static observedAttributes = ['skin'] as const

    constructor() {
      super()
    }

    shadow = this.attachShadow({ mode: 'open' })

    adorn(skin: string) {
      const adopt = (sheet: CSSStyleSheet) =>
        Object.assign(this.shadow, { adoptedStyleSheets: [sheet] })

      return new Promise<CSSStyleSheet>((resolve, reject) =>
        !sheets.validate(skin) ? reject(new Error('Invalid skin')) : resolve(sheets.get(skin))
      ).then(adopt)
    }

    attributeChangedCallback<Attribute extends (typeof CustomElement.observedAttributes)[number]>(
      name: Attribute,
      current: string,
      next: string
    ) {
      switch (true) {
        case !current:
          return
        case name.trim().toLowerCase() === 'skin':
          return this.suspend(this.adorn(next))
      }
    }

    connectedCallback() {
      const skin = (this.getAttribute('skin') ?? '').trim().toLowerCase()

      return this.suspend(this.adorn(skin))
    }

    disconnectedCallback() {
      this.shadow.adoptedStyleSheets = []
    }

    suspend(promise: Promise<unknown>) {
      const detail = promise.finally(this.dispatchEvent.bind(this, new CustomEvent('suspend')))

      return queueMicrotask(this.dispatchEvent.bind(this, new CustomEvent('suspend', { detail })))
    }
  }

  customElements.define(name, CustomElement)

  const Test = (props: Props) => {
    const { container, ...core } = useCore()

    return createElement(
      name,
      { ...attributes, ...core },
      createPortal(<Component {...props} />, container)
    )
  }

  // const Lazy = lazy(() => Promise.resolve({ default: Test })) as unknown as ComponentType<Props>

  const Styled = (props: Props) => {
    return (
      <Suspense fallback={fallback}>
        <Test {...props} />
      </Suspense>
    )
  }

  return Styled
}
