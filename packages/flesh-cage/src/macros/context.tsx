import { createContext, useContext, type FC } from 'react'
import type { SkinProviderProps } from './types'

/**
 * Context for skin management
 * Provides the current skin name to all descendant components
 */
const SkinContext = createContext<string | undefined>(undefined)

/**
 * SkinProvider - Provides skin context to descendant components
 *
 * @example
 * ```tsx
 * <SkinProvider skin="material">
 *   <Button>Click Me</Button>
 *   <Card>Content</Card>
 * </SkinProvider>
 * ```
 *
 * @example Nested providers
 * ```tsx
 * <SkinProvider skin="material">
 *   <Button>Material</Button>
 *
 *   <SkinProvider skin="dark">
 *     <Button>Dark</Button>
 *   </SkinProvider>
 * </SkinProvider>
 * ```
 */
export const SkinProvider: FC<SkinProviderProps> = ({ skin, children, fallback: _fallback }) => {
  // TODO: Implement preload logic if needed
  // For now, just provide the skin context

  return <SkinContext.Provider value={skin}>{children}</SkinContext.Provider>
}

/**
 * useSkinContext - Hook to access current skin from context
 *
 * @throws {Error} If used outside of SkinProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const skin = useSkinContext()
 *   console.log('Current skin:', skin)
 * }
 * ```
 */
export function useSkinContext(): string {
  const skin = useContext(SkinContext)

  if (skin === undefined) {
    throw new Error('[useSkinContext] must be used within <SkinProvider>')
  }

  return skin
}

/**
 * useSkinContextOptional - Hook to access current skin (returns undefined if not in provider)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const skin = useSkinContextOptional() ?? 'default'
 * }
 * ```
 */
export function useSkinContextOptional(): string | undefined {
  return useContext(SkinContext)
}
