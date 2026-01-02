import { createPortal } from 'react-dom'
import { type ComponentType, type HTMLAttributes, createElement } from 'react'

import type { Skins } from './types'
import { Sheets } from './sheets'
import { useCore } from './use-core'

export interface StyledConfig<Names extends string = string> extends Partial<
  HTMLAttributes<HTMLElement>
> {
  name: string
  skins: Skins<Names>
}

export const styled = <Props extends {}, Names extends string = string>(
  Component: ComponentType<Props>,
  { name, skins, ...attributes }: StyledConfig<Names>
): ComponentType<Props> => {
  const sheets = new Sheets({ skins })

  class CustomElement extends HTMLElement {
    static observedAttributes = ['skin'] as const

    constructor() {
      super()
    }

    shadow = this.attachShadow({ mode: 'open' })

    adorn = (skin: string) => {
      const adopt = (sheet: CSSStyleSheet) =>
        Object.assign(this.shadow, { adoptedStyleSheets: [sheet] })

      return new Promise<CSSStyleSheet>((resolve, reject) => {
        return !sheets.validate(skin)
          ? reject(new Error('Invalid skin'))
          : resolve(sheets.get(skin))
      }).then(adopt)
    }

    attributeChangedCallback<Attribute extends (typeof CustomElement.observedAttributes)[number]>(
      name: Attribute,
      _: string,
      skin: string
    ) {
      switch (true) {
        case name.trim().toLowerCase() === 'skin':
          return this.suspend(this.adorn(skin))
      }
    }

    change = (event: Event) => {
      const { detail } = event as CustomEvent<{ skin: string }>
      const skin = (this.getAttribute('skin') ?? detail.skin ?? '').trim().toLowerCase()

      return this.suspend(this.adorn(skin))
    }

    connectedCallback() {
      this.addEventListener('change', this.change)
    }

    disconnectedCallback() {
      this.shadow.adoptedStyleSheets = []

      this.removeEventListener('change', this.change)
    }

    suspend = (promise: Promise<unknown>) => {
      const receive = () => this.dispatchEvent(new CustomEvent('suspend'))
      const detail = promise.finally(receive)
      const retrieve = () => this.dispatchEvent(new CustomEvent('suspend', { detail }))

      return queueMicrotask(retrieve)
    }
  }

  customElements.define(name, CustomElement)

  const Styled = (props: Props) => {
    const { container, ...core } = useCore()

    return createElement(
      name,
      { ...attributes, ...core },
      createPortal(<Component {...props} />, container)
    )
  }

  return Styled
}
