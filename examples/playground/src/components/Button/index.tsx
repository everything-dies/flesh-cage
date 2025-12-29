import type { ComponentProps } from 'react'
import { styled } from '@everything-dies/flesh-cage'

interface ButtonProps extends ComponentProps<'button'> {
  variant?: 'primary' | 'secondary'
}

export const ButtonBase = ({ children, variant, ...props }: ButtonProps) => (
  <button part="surface" data-variant={variant} {...props}>
    <span part="label">{children}</span>
  </button>
)

export const Button = styled(ButtonBase, {
  skins: {
    brutalist: () => import('./skins/brutalist'),
    glassmorphic: () => import('./skins/glassmorphic'),
    material: () => import('./skins/material'),
  },
  name: 'styled-button',
})
