import { useRef, useEffect, useState } from 'react'
import { SheetsCache } from '@flesh-cage/core'
import type { SkinMap } from '@flesh-cage/core'

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
  elementName: string,
  skins: SkinMap<SkinNames>,
  skin: SkinNames
) {
  const elementRef = useRef<HTMLElement>(null)
  const [cache] = useState(() => new SheetsCache(skins))

  useEffect(() => {
    if (!elementRef.current?.shadowRoot) return

    const shadowRoot = elementRef.current.shadowRoot

    // Acquire skin stylesheet
    let mounted = true
    cache.acquire(skin as string).then((sheet) => {
      if (mounted) {
        shadowRoot.adoptedStyleSheets = [sheet]
      }
    })

    // Cleanup: release skin
    return () => {
      mounted = false
      cache.release(skin as string)
    }
  }, [cache, skin])

  return {
    ref: elementRef,
  }
}
