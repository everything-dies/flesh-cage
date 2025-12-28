import { useRef, useEffect, type FC } from 'react'
import { createPortal } from 'react-dom'
import { createCustomElement } from '../core'
import { useShadowStyles } from './use-shadow-styles'
import { useSkinContextOptional } from './context'
import type { ShadowRootProps } from './types'

/**
 * ShadowRoot - Component for manual shadow DOM usage
 *
 * @example
 * ```tsx
 * export const Button = ({ variant, children }) => {
 *   return (
 *     <ShadowRoot
 *       name="button"
 *       skins={{ material: () => import('./material') }}
 *       parts={['surface']}
 *     >
 *       <button part="surface" variant={variant}>
 *         {children}
 *       </button>
 *     </ShadowRoot>
 *   )
 * }
 * ```
 */
export const ShadowRoot: FC<ShadowRootProps> = ({
  name,
  skins,
  skin: skinOverride,
  parts,
  mode = 'open',
  children,
}) => {
  const contextSkin = useSkinContextOptional()
  const skin = skinOverride ?? contextSkin ?? (Object.keys(skins)[0] as string)

  const elementRef = useRef<HTMLElement>(null)
  const { ref } = useShadowStyles(name, skins, skin)

  // Register custom element if needed
  useEffect(() => {
    if (!customElements.get(name)) {
      const ElementClass = createCustomElement({
        name,
        mode,
        parts,
      })
      customElements.define(name, ElementClass)
    }
  }, [name, mode, parts])

  // Merge refs
  useEffect(() => {
    if (elementRef.current && ref.current !== elementRef.current) {
      // @ts-expect-error - Setting ref
      ref.current = elementRef.current
    }
  }, [ref])

  // Create portal to render children in shadow root
  const portalContent =
    elementRef.current?.shadowRoot && createPortal(children, elementRef.current.shadowRoot)

  return (
    <>
      {/* @ts-expect-error - Custom element */}
      <div ref={elementRef} is={name} />
      {portalContent}
    </>
  )
}

ShadowRoot.displayName = 'ShadowRoot'
