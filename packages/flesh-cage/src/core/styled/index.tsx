import { createPortal } from 'react-dom'
import {
  type ComponentType,
  type PropsWithChildren,
  createElement,
} from 'react'

import type { StyledConfig } from '../types'
import { Sheets } from '../sheets'
import { Stylable } from '../stylable'
import { useCore } from '../use-core'

export const styled = <
  Props extends PropsWithChildren,
  Names extends string = string,
>(
  component: string | ComponentType<Props>,
  { suspendable = false, name, skins, ...attributes }: StyledConfig<Names>
): ComponentType<Props> => {
  const sheets = new Sheets({ skins })

  class CustomElement extends Stylable<Names> {
    protected load(skin: Names) {
      return sheets.get(skin)
    }

    protected validate(skin: string) {
      return sheets.validate(skin)
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
