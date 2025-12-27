import type { SkinLoader, SkinMap, SheetsCacheOptions } from './types'

/**
 * SheetsCache manages Constructable StyleSheet lifecycle with ref-counting
 *
 * Features:
 * - Lazy loading of skins via dynamic imports
 * - Ref-counting for automatic cleanup
 * - LRU eviction when maxSize is exceeded
 * - Event callbacks for observability
 *
 * @example
 * ```ts
 * const cache = new SheetsCache({
 *   material: () => import('./material'),
 *   dark: () => import('./dark'),
 * })
 *
 * // Acquire a skin (loads if not cached, increments ref count)
 * const sheet = await cache.acquire('material')
 * shadowRoot.adoptedStyleSheets = [sheet]
 *
 * // Release when done (decrements ref count, evicts if zero)
 * cache.release('material')
 * ```
 */
export class SheetsCache<T extends string = string> {
  #skins: SkinMap<T>
  #cache = new Map<T, CSSStyleSheet>()
  #refCounts = new Map<T, number>()
  #loadPromises = new Map<T, Promise<CSSStyleSheet>>()
  #accessOrder: T[] = []
  #options: Required<SheetsCacheOptions>

  constructor(skins: SkinMap<T>, options: SheetsCacheOptions = {}) {
    this.#skins = skins
    this.#options = {
      maxSize: options.maxSize ?? Infinity,
      onEvict: options.onEvict ?? (() => {}),
      onLoad: options.onLoad ?? (() => {}),
      onError: options.onError ?? (() => {}),
    }
  }

  /**
   * Acquire a skin stylesheet
   * - Loads the skin if not cached
   * - Increments reference count
   * - Returns the CSSStyleSheet
   */
  async acquire(skinName: T): Promise<CSSStyleSheet> {
    // If already loading, wait for it
    const existingPromise = this.#loadPromises.get(skinName)
    if (existingPromise) {
      return existingPromise
    }

    // If cached, increment ref count and return
    if (this.#cache.has(skinName)) {
      this.#incrementRef(skinName)
      this.#updateAccessOrder(skinName)
      return this.#cache.get(skinName)!
    }

    // Load the skin
    const promise = this.#loadSkin(skinName)
    this.#loadPromises.set(skinName, promise)

    try {
      const sheet = await promise
      this.#cache.set(skinName, sheet)
      this.#refCounts.set(skinName, 1)
      this.#updateAccessOrder(skinName)
      this.#loadPromises.delete(skinName)

      // Evict LRU if over maxSize
      this.#evictIfNeeded()

      this.#options.onLoad(skinName, sheet)
      return sheet
    } catch (error) {
      this.#loadPromises.delete(skinName)
      this.#options.onError(skinName, error as Error)
      throw error
    }
  }

  /**
   * Release a skin stylesheet
   * - Decrements reference count
   * - Evicts if count reaches zero
   */
  release(skinName: T): void {
    const count = this.#refCounts.get(skinName)
    if (!count) {
      console.warn(`[SheetsCache] Attempted to release non-existent skin: ${skinName}`)
      return
    }

    if (count <= 1) {
      // Ref count is zero, evict
      const sheet = this.#cache.get(skinName)
      this.#cache.delete(skinName)
      this.#refCounts.delete(skinName)
      this.#accessOrder = this.#accessOrder.filter((name) => name !== skinName)

      if (sheet) {
        this.#options.onEvict(skinName, sheet)
      }
    } else {
      // Decrement ref count
      this.#refCounts.set(skinName, count - 1)
    }
  }

  /**
   * Preload a skin without acquiring it
   */
  async preload(skinName: T): Promise<void> {
    if (this.#cache.has(skinName)) {
      return // Already loaded
    }

    await this.acquire(skinName)
    this.release(skinName)
  }

  /**
   * Clear all cached sheets
   */
  clear(): void {
    for (const [skinName, sheet] of this.#cache.entries()) {
      this.#options.onEvict(skinName, sheet)
    }

    this.#cache.clear()
    this.#refCounts.clear()
    this.#accessOrder = []
    this.#loadPromises.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.#cache.size,
      maxSize: this.#options.maxSize,
      skins: Array.from(this.#cache.keys()),
      refCounts: Object.fromEntries(this.#refCounts),
    }
  }

  // Private methods

  #incrementRef(skinName: T): void {
    const count = this.#refCounts.get(skinName) ?? 0
    this.#refCounts.set(skinName, count + 1)
  }

  #updateAccessOrder(skinName: T): void {
    // Remove from current position
    this.#accessOrder = this.#accessOrder.filter((name) => name !== skinName)
    // Add to end (most recently used)
    this.#accessOrder.push(skinName)
  }

  #evictIfNeeded(): void {
    while (this.#cache.size > this.#options.maxSize) {
      // Evict least recently used (first in access order)
      const lruSkin = this.#accessOrder[0]
      if (!lruSkin) break

      const sheet = this.#cache.get(lruSkin)
      this.#cache.delete(lruSkin)
      this.#refCounts.delete(lruSkin)
      this.#accessOrder.shift()

      if (sheet) {
        this.#options.onEvict(lruSkin, sheet)
      }
    }
  }

  async #loadSkin(skinName: T): Promise<CSSStyleSheet> {
    const loader = this.#skins[skinName]
    if (!loader) {
      throw new Error(`[SheetsCache] Skin "${skinName}" not found`)
    }

    // Load the CSS string
    const module = await loader()
    const cssString = module.default

    if (typeof cssString !== 'string') {
      throw new Error(`[SheetsCache] Skin "${skinName}" must export a default CSS string`)
    }

    // Create Constructable StyleSheet
    const sheet = new CSSStyleSheet()
    await sheet.replace(cssString)

    return sheet
  }
}
