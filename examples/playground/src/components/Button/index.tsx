import { createShadowComponent } from '@everything-dies/flesh-cage'
import type { ComponentProps } from 'react'

interface ButtonProps extends ComponentProps<'button'> {
  variant?: 'primary' | 'secondary'
}

/**
 * Example Button component using createShadowComponent
 *
 * - Reads skin from SkinProvider context
 * - Lazy loads skin stylesheets
 * - Uses Shadow DOM for encapsulation
 */
export const Button = createShadowComponent<ButtonProps>({
  name: 'button-element',

  skins: {
    material: () => import('./skins/material'),
    brutalist: () => import('./skins/brutalist'),
    glassmorphic: () => import('./skins/glassmorphic'),
  },

  defaultSkin: 'material',

  parts: ['surface', 'label'],

  render: ({ variant = 'primary', children, ...props }) => (
    <button part="surface" data-variant={variant} {...props}>
      <span part="label">{children}</span>
    </button>
  ),
})
