import type { ComponentProps } from 'react'
import { styled } from '@everything-dies/flesh-cage'

export type Props = ComponentProps<'button'>

export const ButtonBase = ({ children, ...props }: Props) => (
  <button part="surface" {...props}>
    <span part="label">{children}</span>
  </button>
)

export const Button = styled(ButtonBase, {
  skins: {
    brutalist: () => import('./skins/brutalist'),
    glassmorphic: () =>
      import('./skins/glassmorphic').then(
        (module) =>
          new Promise((resolve) => window.setTimeout(resolve, 2_500, module))
      ),
    material: () => import('./skins/material'),
  },
  exportparts: 'label, surface',
  name: 'styled-button',
  suspendable: false,
})
