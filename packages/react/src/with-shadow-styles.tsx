import type { ComponentType } from 'react'
import { createShadowComponent } from './create-shadow-component'
import type { WithShadowStylesConfig } from './types'

/**
 * withShadowStyles - HOC to wrap a component with shadow styles
 *
 * @example
 * ```tsx
 * const ButtonBase = ({ variant, children }) => (
 *   <button part="surface" variant={variant}>
 *     {children}
 *   </button>
 * )
 *
 * export const Button = withShadowStyles(ButtonBase, {
 *   name: 'button',
 *   skins: {
 *     material: () => import('./material'),
 *   },
 * })
 *
 * // Usage
 * <SkinProvider skin="material">
 *   <Button variant="primary">Click Me</Button>
 * </SkinProvider>
 * ```
 */
export function withShadowStyles<Props = unknown, SkinNames extends string = string>(
  Component: ComponentType<Props>,
  config: WithShadowStylesConfig<SkinNames>
): ComponentType<Props> {
  return createShadowComponent({
    ...config,
    render: Component,
  })
}
