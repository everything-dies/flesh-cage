import { useRef, useEffect, type ComponentType, type FC } from 'react'
import { createPortal } from 'react-dom'
import { SheetsCache, createCustomElement } from '@flesh-cage/core'
import { useSkinContextOptional } from './context'
import type { CreateShadowComponentConfig } from './types'

/**
 * createShadowComponent - Factory function to create shadow DOM components
 *
 * @example
 * ```tsx
 * export const Button = createShadowComponent({
 *   name: 'button',
 *   skins: {
 *     material: () => import('./material'),
 *     dark: () => import('./dark'),
 *   },
 *   defaultSkin: 'material',
 *   render: ({ variant, children }) => (
 *     <button part="surface" variant={variant}>
 *       {children}
 *     </button>
 *   ),
 * })
 *
 * // Usage
 * <SkinProvider skin="material">
 *   <Button variant="primary">Click Me</Button>
 * </SkinProvider>
 * ```
 */
export function createShadowComponent<Props = unknown, SkinNames extends string = string>(
  config: CreateShadowComponentConfig<Props, SkinNames>
): ComponentType<Props> {
  const { name, skins, defaultSkin, parts, mode = 'open', render: RenderComponent } = config

  // Create shared cache for this component
  const cache = new SheetsCache<SkinNames>(skins)

  // Create custom element class
  const ElementClass = createCustomElement({
    name,
    mode,
    parts,
  })

  // Register custom element if not already defined
  if (!customElements.get(name)) {
    customElements.define(name, ElementClass)
  }

  // Return React component
  const ShadowComponent: FC<Props> = (props) => {
    const elementRef = useRef<HTMLElement>(null)
    const contextSkin = useSkinContextOptional()
    const skin = (contextSkin ?? defaultSkin ?? Object.keys(skins)[0]) as SkinNames

    useEffect(() => {
      if (!elementRef.current?.shadowRoot) return

      const shadowRoot = elementRef.current.shadowRoot

      // Acquire skin stylesheet
      let mounted = true
      void cache.acquire(skin).then((sheet) => {
        if (mounted) {
          shadowRoot.adoptedStyleSheets = [sheet]
        }
      })

      // Cleanup: release skin
      return () => {
        mounted = false
        cache.release(skin)
      }
    }, [skin])

    // Create portal to render React content in shadow root
    const portalContent =
      elementRef.current?.shadowRoot &&
      createPortal(
        // @ts-expect-error - Generic props forwarding
        <RenderComponent {...(props as unknown as Record<string, unknown>)} />,
        elementRef.current.shadowRoot
      )

    return (
      <>
        {/* @ts-expect-error - Custom element */}
        <div ref={elementRef} is={name} />
        {portalContent}
      </>
    )
  }

  // Set display name for debugging
  ShadowComponent.displayName = `ShadowComponent(${name})`

  return ShadowComponent
}
