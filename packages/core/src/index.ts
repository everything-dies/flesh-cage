/**
 * @flesh-cage/core
 *
 * Core runtime for flesh-cage library.
 * Provides:
 * - SheetsCache: Manages Constructable StyleSheet lifecycle with ref-counting
 * - Custom element utilities for Shadow DOM
 * - Type-safe skin loading and caching
 */

export { SheetsCache } from './sheets-cache'
export { createCustomElement } from './custom-element'
export type { SkinLoader, SkinMap, SheetsCacheOptions } from './types'
