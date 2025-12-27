/**
 * @flesh-cage/react
 *
 * React bindings for flesh-cage library.
 * Provides:
 * - SkinProvider: React Context for skin management
 * - createShadowComponent: Factory function for creating shadow components
 * - withShadowStyles: HOC for wrapping components with shadow styles
 * - useSkinContext, useShadowStyles: Hooks for custom implementations
 * - ShadowRoot: Component for manual shadow DOM usage
 */

export { SkinProvider, useSkinContext } from './context'
export { createShadowComponent } from './create-shadow-component'
export { withShadowStyles } from './with-shadow-styles'
export { useShadowStyles } from './use-shadow-styles'
export { ShadowRoot } from './shadow-root'

export type {
  SkinProviderProps,
  CreateShadowComponentConfig,
  WithShadowStylesConfig,
  ShadowRootProps,
} from './types'

// Re-export core types for convenience
export type { SkinLoader, SkinMap } from '@flesh-cage/core'
