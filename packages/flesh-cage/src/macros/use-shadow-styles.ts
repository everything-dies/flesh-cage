import { useRef, useEffect, useState } from 'react'
import { SheetsCache } from '../core'
import type { SkinMap } from '../core'

/**
 * useShadowStyles - Hook for manual shadow DOM + stylesheet management
 *
 * @example
 * ```tsx
 * export const Button = ({ variant, children }) => {
 *   const { ref } = useShadowStyles('button', {
 *     material: () => import('./material'),
 *   }, 'material')
 *
 *   return (
 *     <button-element ref={ref}>
 *       <button part="surface" variant={variant}>
 *         {children}
 *       </button>
 *     </button-element>
 *   )
 * }
 * ```
 */
export function useShadowStyles<SkinNames extends string = string>(
  _elementName: string,
  skins: SkinMap<SkinNames>,
  skin: SkinNames
) {
  const elementRef = useRef<HTMLElement>(null)
  const [cache] = useState(() => new SheetsCache<SkinNames>(skins))

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
  }, [cache, skin])

  return {
    ref: elementRef,
  }
}
