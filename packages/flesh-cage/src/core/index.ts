/**
 * Core Module - Public API
 *
 * This module exports the public API for the flesh-cage styling system,
 * which implements a hybrid Web Components + React architecture for
 * true style encapsulation via Shadow DOM.
 *
 * Architecture:
 * The core module is organized into focused, single-responsibility modules:
 * - types/         Type definitions (foundation)
 * - context/       React Context instance
 * - use-context/   Context consumer hook
 * - provider/      Theme provider component
 * - sheets/        Stylesheet lifecycle manager
 * - use-core/      Shadow DOM lifecycle hook
 * - styled/        Main factory function
 *
 * For detailed architecture documentation, see ./README.md
 */

// ============================================================================
// Type Exports
// ============================================================================
// Foundation types used throughout the system

export type { ProviderProps, SkinLoader, Skins, StyledConfig } from './types'

// ============================================================================
// Component Exports
// ============================================================================
// Main factory function and theme provider

export { styled } from './styled'
export { Provider } from './provider'

// ============================================================================
// Hook Exports
// ============================================================================
// Hooks for consuming context and managing Shadow DOM lifecycle

export { useCore } from './use-core'
export { useContext } from './use-context'
