/**
 * Type definitions for @flesh-cage/core
 */

/**
 * A function that lazy-loads a skin CSS string
 */
export type SkinLoader = () => Promise<{ default: string }>

/**
 * Map of skin names to their loaders
 */
export type SkinMap<T extends string = string> = Record<T, SkinLoader>

/**
 * Options for SheetsCache
 */
export interface SheetsCacheOptions {
  /**
   * Maximum number of sheets to cache
   * @default Infinity
   */
  maxSize?: number

  /**
   * Called when a sheet is evicted from cache
   */
  onEvict?: (skinName: string, sheet: CSSStyleSheet) => void

  /**
   * Called when a sheet is loaded
   */
  onLoad?: (skinName: string, sheet: CSSStyleSheet) => void

  /**
   * Called on error during sheet loading
   */
  onError?: (skinName: string, error: Error) => void
}

/**
 * Custom element configuration
 */
export interface CustomElementConfig {
  /**
   * Name of the custom element (must contain hyphen)
   */
  name: string

  /**
   * Shadow DOM mode
   * @default 'open'
   */
  mode?: ShadowRootMode

  /**
   * Delegated focus
   * @default false
   */
  delegatesFocus?: boolean

  /**
   * Slot assignment mode
   * @default 'named'
   */
  slotAssignment?: SlotAssignmentMode

  /**
   * Parts to export via exportparts
   */
  parts?: string[]
}
