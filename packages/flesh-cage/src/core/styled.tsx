import { createPortal } from 'react-dom'
import {
  type ComponentType,
  type PropsWithChildren,
  createElement,
} from 'react'

import type { StyledConfig } from './types'
import { Sheets } from './sheets'
import { useCore } from './use-core'

export const verify = (error: Error) =>
  error instanceof DOMException && error.name === 'AbortError'
    ? Promise.resolve(error)
    : Promise.reject(error)

export const styled = <
  Props extends PropsWithChildren,
  Names extends string = string,
>(
  component: string | ComponentType<Props>,
  { suspendable = false, name, skins, ...attributes }: StyledConfig<Names>
): ComponentType<Props> => {
  const sheets = new Sheets({ skins })

  class CustomElement extends HTMLElement {
    static observedAttributes = ['skin'] as const

    controller = new AbortController()

    shadow = this.attachShadow({ mode: 'open' })

    adorn = (skin: string) => {
      const { controller: previous } = this
      const next = (this.controller = new AbortController())
      const invalid = !sheets.validate(skin)
      const adopt = (sheet: CSSStyleSheet) => {
        next.signal.throwIfAborted()

        return Object.assign(this.shadow, { adoptedStyleSheets: [sheet] })
      }

      previous.abort()

      return new Promise<CSSStyleSheet>((resolve, reject) =>
        invalid ? reject(new Error('Invalid skin')) : resolve(sheets.get(skin))
      )
        .then(adopt)
        .catch(verify)
    }

    attributeChangedCallback(
      name: (typeof CustomElement.observedAttributes)[number],
      _: string,
      skin: string
    ) {
      switch (true) {
        case name.trim().toLowerCase() === 'skin':
          return this.suspend(this.adorn(skin))
      }
    }

    change = (event: Event) => {
      const { detail } = event as CustomEvent<{ skin?: string }>
      const skin = (this.getAttribute('skin') ?? detail.skin ?? '')
        .trim()
        .toLowerCase()

      return this.suspend(this.adorn(skin))
    }

    connectedCallback() {
      this.addEventListener('change', this.change)
    }

    disconnectedCallback() {
      this.shadow.adoptedStyleSheets = []

      this.removeEventListener('change', this.change)
    }

    resume = () => this.dispatchEvent(new CustomEvent('suspend'))

    suspend = (promise: Promise<unknown>) => {
      const detail = promise.finally(this.resume)
      const retrieve = () =>
        this.dispatchEvent(new CustomEvent('suspend', { detail }))

      return queueMicrotask(retrieve)
    }
  }

  const Styled = (props: Props) => {
    const { container, ...core } = useCore({ suspendable })

    return createElement(
      name,
      { ...attributes, ...core },
      createPortal(createElement(component, props), container)
    )
  }

  customElements.define(name, CustomElement)

  return Styled
}
