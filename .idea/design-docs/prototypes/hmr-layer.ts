/**
 * Hot Module Replacement (HMR) Abstraction Layer
 *
 * A unified interface for communicating with various bundlers' HMR APIs.
 * This allows flesh-cage skins to hot reload across Vite, Webpack, Parcel,
 * and other bundlers without coupling to any specific implementation.
 *
 * @version 0.1 - Prototype
 * @date 2026-01-10
 */

// ============================================================================
// Types
// ============================================================================

/** Callback invoked when a module is updated */
type HMRCallback = (newModule: unknown) => void

/** Callback for cleanup before a module is replaced */
type DisposeCallback = (data: Record<string, unknown>) => void

/** Supported bundler types */
type BundlerType =
  | 'vite'
  | 'webpack'
  | 'parcel'
  | 'esbuild'
  | 'rspack'
  | 'unknown'

/** HMR event types */
type HMREventType =
  | 'update' // Module updated
  | 'prune' // Module removed
  | 'error' // HMR error
  | 'full-reload' // Fallback to full reload
  | 'connected' // HMR connection established
  | 'disconnected' // HMR connection lost

/** HMR event payload */
interface HMREvent {
  type: HMREventType
  moduleId?: string
  error?: Error
  timestamp?: number
}

/** Event listener */
type HMREventListener = (event: HMREvent) => void

/**
 * Unified HMR interface that works across bundlers
 */
interface HMRInterface {
  /** Whether HMR is available */
  readonly available: boolean

  /** Detected bundler type */
  readonly bundler: BundlerType

  /**
   * Accept updates for the current module
   * @param callback Called with the new module when updated
   */
  accept(callback?: HMRCallback): void

  /**
   * Accept updates for specific dependencies
   * @param deps Dependency paths to watch
   * @param callback Called when any dependency updates
   */
  acceptDeps(deps: string[], callback: HMRCallback): void

  /**
   * Register cleanup before module is replaced
   * @param callback Called before module disposal
   */
  dispose(callback: DisposeCallback): void

  /**
   * Invalidate the module, triggering parent to re-import
   */
  invalidate(): void

  /**
   * Decline HMR for this module (forces full reload on change)
   */
  decline(): void

  /**
   * Persist data across HMR updates
   */
  data: Record<string, unknown>

  /**
   * Subscribe to HMR events
   */
  on(event: HMREventType, listener: HMREventListener): () => void

  /**
   * Force a full page reload
   */
  forceReload(): void
}

// ============================================================================
// Bundler Detection
// ============================================================================

/**
 * Detect which bundler is being used based on global APIs
 */
function detectBundler(): BundlerType {
  // Vite: import.meta.hot with specific shape
  if (
    typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { hot?: unknown }).hot &&
    typeof (import.meta as ImportMeta & { env?: { MODE?: string } }).env
      ?.MODE === 'string'
  ) {
    return 'vite'
  }

  // Webpack/Rspack: module.hot with webpack-specific methods
  if (
    typeof module !== 'undefined' &&
    (module as NodeModule & { hot?: unknown }).hot
  ) {
    // Rspack has similar API but may have different markers
    const hot = (module as NodeModule & { hot?: { _main?: boolean } }).hot
    if (hot && typeof hot._main !== 'undefined') {
      return 'rspack'
    }
    return 'webpack'
  }

  // Parcel: module.hot with parcel-specific shape
  if (
    typeof module !== 'undefined' &&
    (module as NodeModule & { hot?: { data?: unknown } }).hot &&
    typeof (module as NodeModule & { hot?: { data?: unknown } }).hot?.data !==
      'undefined'
  ) {
    return 'parcel'
  }

  // esbuild: No built-in HMR, check for esbuild-specific globals
  if (
    typeof globalThis !== 'undefined' &&
    (globalThis as typeof globalThis & { __esbuild?: unknown }).__esbuild
  ) {
    return 'esbuild'
  }

  return 'unknown'
}

// ============================================================================
// Bundler Adapters
// ============================================================================

/**
 * Base adapter class with common functionality
 */
abstract class BaseHMRAdapter implements HMRInterface {
  abstract readonly available: boolean
  abstract readonly bundler: BundlerType

  data: Record<string, unknown> = {}

  protected listeners: Map<HMREventType, Set<HMREventListener>> = new Map()

  abstract accept(callback?: HMRCallback): void
  abstract acceptDeps(deps: string[], callback: HMRCallback): void
  abstract dispose(callback: DisposeCallback): void
  abstract invalidate(): void
  abstract decline(): void

  on(event: HMREventType, listener: HMREventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)

    return () => {
      this.listeners.get(event)?.delete(listener)
    }
  }

  protected emit(event: HMREvent): void {
    const listeners = this.listeners.get(event.type)
    if (listeners) {
      listeners.forEach((listener) => listener(event))
    }
  }

  forceReload(): void {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }
}

// ----------------------------------------------------------------------------
// Vite Adapter
// ----------------------------------------------------------------------------

interface ViteHotContext {
  accept(callback?: (mod: unknown) => void): void
  accept(deps: readonly string[], callback: (mods: unknown[]) => void): void
  dispose(callback: (data: Record<string, unknown>) => void): void
  invalidate(): void
  decline(): void
  data: Record<string, unknown>
  on(event: string, callback: (...args: unknown[]) => void): void
}

class ViteAdapter extends BaseHMRAdapter {
  readonly bundler: BundlerType = 'vite'
  private hot: ViteHotContext | null = null

  get available(): boolean {
    return this.hot !== null
  }

  constructor() {
    super()
    // Access import.meta.hot at construction time
    if (typeof import.meta !== 'undefined') {
      this.hot =
        (import.meta as ImportMeta & { hot?: ViteHotContext }).hot ?? null
      if (this.hot) {
        this.data = this.hot.data
        this.setupEventListeners()
      }
    }
  }

  private setupEventListeners(): void {
    if (!this.hot) return

    this.hot.on('vite:beforeUpdate', () => {
      this.emit({ type: 'update', timestamp: Date.now() })
    })

    this.hot.on('vite:beforeFullReload', () => {
      this.emit({ type: 'full-reload', timestamp: Date.now() })
    })

    this.hot.on('vite:error', (err: unknown) => {
      this.emit({
        type: 'error',
        error: err instanceof Error ? err : new Error(String(err)),
        timestamp: Date.now(),
      })
    })

    this.hot.on('vite:ws:connect', () => {
      this.emit({ type: 'connected', timestamp: Date.now() })
    })

    this.hot.on('vite:ws:disconnect', () => {
      this.emit({ type: 'disconnected', timestamp: Date.now() })
    })
  }

  accept(callback?: HMRCallback): void {
    if (!this.hot) return
    this.hot.accept(callback)
  }

  acceptDeps(deps: string[], callback: HMRCallback): void {
    if (!this.hot) return
    this.hot.accept(deps, (mods) => {
      // Vite provides array of modules for dep updates
      callback(mods)
    })
  }

  dispose(callback: DisposeCallback): void {
    if (!this.hot) return
    this.hot.dispose(callback)
  }

  invalidate(): void {
    if (!this.hot) return
    this.hot.invalidate()
  }

  decline(): void {
    if (!this.hot) return
    this.hot.decline()
  }
}

// ----------------------------------------------------------------------------
// Webpack Adapter
// ----------------------------------------------------------------------------

interface WebpackHotModule {
  accept(callback?: () => void): void
  accept(deps: string | string[], callback?: () => void): void
  dispose(callback: (data: Record<string, unknown>) => void): void
  invalidate(): void
  decline(): void
  data: Record<string, unknown>
  status(): string
  addStatusHandler(callback: (status: string) => void): void
}

class WebpackAdapter extends BaseHMRAdapter {
  readonly bundler: BundlerType = 'webpack'
  private hot: WebpackHotModule | null = null

  get available(): boolean {
    return this.hot !== null
  }

  constructor() {
    super()
    if (typeof module !== 'undefined') {
      this.hot = (module as NodeModule & { hot?: WebpackHotModule }).hot ?? null
      if (this.hot) {
        this.data = this.hot.data || {}
        this.setupEventListeners()
      }
    }
  }

  private setupEventListeners(): void {
    if (!this.hot) return

    this.hot.addStatusHandler((status) => {
      switch (status) {
        case 'check':
          this.emit({ type: 'update', timestamp: Date.now() })
          break
        case 'abort':
        case 'fail':
          this.emit({ type: 'full-reload', timestamp: Date.now() })
          break
      }
    })
  }

  accept(callback?: HMRCallback): void {
    if (!this.hot) return
    this.hot.accept(() => {
      // Webpack doesn't pass new module to accept callback
      // Re-require would be needed, but we handle this at usage site
      callback?.(undefined)
    })
  }

  acceptDeps(deps: string[], callback: HMRCallback): void {
    if (!this.hot) return
    this.hot.accept(deps, () => {
      callback(undefined)
    })
  }

  dispose(callback: DisposeCallback): void {
    if (!this.hot) return
    this.hot.dispose(callback)
  }

  invalidate(): void {
    if (!this.hot) return
    this.hot.invalidate()
  }

  decline(): void {
    if (!this.hot) return
    this.hot.decline()
  }
}

// ----------------------------------------------------------------------------
// Parcel Adapter
// ----------------------------------------------------------------------------

interface ParcelHotModule {
  accept(callback?: () => void): void
  dispose(callback: (data: Record<string, unknown>) => void): void
  data: Record<string, unknown>
}

class ParcelAdapter extends BaseHMRAdapter {
  readonly bundler: BundlerType = 'parcel'
  private hot: ParcelHotModule | null = null

  get available(): boolean {
    return this.hot !== null
  }

  constructor() {
    super()
    if (typeof module !== 'undefined') {
      this.hot = (module as NodeModule & { hot?: ParcelHotModule }).hot ?? null
      if (this.hot) {
        this.data = this.hot.data || {}
      }
    }
  }

  accept(callback?: HMRCallback): void {
    if (!this.hot) return
    this.hot.accept(() => {
      callback?.(undefined)
    })
  }

  acceptDeps(_deps: string[], callback: HMRCallback): void {
    // Parcel doesn't support dependency-specific accept
    // Fall back to self-accept
    this.accept(callback)
  }

  dispose(callback: DisposeCallback): void {
    if (!this.hot) return
    this.hot.dispose(callback)
  }

  invalidate(): void {
    // Parcel doesn't have invalidate, force reload
    this.forceReload()
  }

  decline(): void {
    // Parcel doesn't have decline, just don't accept
  }
}

// ----------------------------------------------------------------------------
// Rspack Adapter (Webpack-compatible with some differences)
// ----------------------------------------------------------------------------

class RspackAdapter extends WebpackAdapter {
  override readonly bundler: BundlerType = 'rspack'
  // Rspack is largely Webpack-compatible for HMR
}

// ----------------------------------------------------------------------------
// esbuild Adapter (using custom event system)
// ----------------------------------------------------------------------------

/**
 * esbuild doesn't have built-in HMR, but we can implement it using
 * Server-Sent Events (SSE) or WebSocket from esbuild's serve mode
 */
class EsbuildAdapter extends BaseHMRAdapter {
  readonly bundler: BundlerType = 'esbuild'
  private eventSource: EventSource | null = null

  get available(): boolean {
    return this.eventSource !== null
  }

  constructor() {
    super()
    this.setupEventSource()
  }

  private setupEventSource(): void {
    // esbuild serve mode can emit rebuild events
    // This requires custom server setup
    if (typeof EventSource !== 'undefined') {
      try {
        // Convention: esbuild dev server exposes /esbuild endpoint
        this.eventSource = new EventSource('/esbuild')

        this.eventSource.addEventListener('change', (event) => {
          const data = JSON.parse((event as MessageEvent).data)
          this.emit({
            type: 'update',
            moduleId: data.path,
            timestamp: Date.now(),
          })
          // Trigger registered callbacks
          this.triggerUpdate(data)
        })

        this.eventSource.addEventListener('open', () => {
          this.emit({ type: 'connected', timestamp: Date.now() })
        })

        this.eventSource.addEventListener('error', () => {
          this.emit({ type: 'disconnected', timestamp: Date.now() })
        })
      } catch {
        // SSE not available or endpoint doesn't exist
        this.eventSource = null
      }
    }
  }

  private updateCallbacks: Map<string, HMRCallback[]> = new Map()

  private triggerUpdate(data: { path?: string }): void {
    if (!data.path) return

    // Check for matching callbacks
    const callbacks =
      this.updateCallbacks.get(data.path) || this.updateCallbacks.get('*')
    if (callbacks) {
      callbacks.forEach((cb) => cb(data))
    } else {
      // No handler, force reload
      this.forceReload()
    }
  }

  accept(callback?: HMRCallback): void {
    if (callback) {
      // Accept all updates for this module
      const existing = this.updateCallbacks.get('*') || []
      this.updateCallbacks.set('*', [...existing, callback])
    }
  }

  acceptDeps(deps: string[], callback: HMRCallback): void {
    deps.forEach((dep) => {
      const existing = this.updateCallbacks.get(dep) || []
      this.updateCallbacks.set(dep, [...existing, callback])
    })
  }

  dispose(callback: DisposeCallback): void {
    // Store dispose callback to run before update
    window.addEventListener('beforeunload', () => {
      callback(this.data)
    })
  }

  invalidate(): void {
    this.forceReload()
  }

  decline(): void {
    // Remove all callbacks to force full reload
    this.updateCallbacks.clear()
  }
}

// ----------------------------------------------------------------------------
// Null Adapter (No HMR available)
// ----------------------------------------------------------------------------

class NullAdapter extends BaseHMRAdapter {
  readonly bundler: BundlerType = 'unknown'
  readonly available = false

  accept(_callback?: HMRCallback): void {
    // No-op
  }

  acceptDeps(_deps: string[], _callback: HMRCallback): void {
    // No-op
  }

  dispose(_callback: DisposeCallback): void {
    // No-op
  }

  invalidate(): void {
    this.forceReload()
  }

  decline(): void {
    // No-op
  }
}

// ============================================================================
// Factory & Singleton
// ============================================================================

/**
 * Create the appropriate HMR adapter based on detected bundler
 */
function createHMRAdapter(): HMRInterface {
  const bundler = detectBundler()

  switch (bundler) {
    case 'vite':
      return new ViteAdapter()
    case 'webpack':
      return new WebpackAdapter()
    case 'rspack':
      return new RspackAdapter()
    case 'parcel':
      return new ParcelAdapter()
    case 'esbuild':
      return new EsbuildAdapter()
    default:
      return new NullAdapter()
  }
}

/** Singleton HMR instance */
let hmrInstance: HMRInterface | null = null

/**
 * Get the HMR interface singleton
 */
export function getHMR(): HMRInterface {
  if (!hmrInstance) {
    hmrInstance = createHMRAdapter()
  }
  return hmrInstance
}

// ============================================================================
// Skin-Specific HMR Integration
// ============================================================================

/** Registered skin update handlers */
const skinHandlers = new Map<string, Set<(css: string) => void>>()

/** Cache of current skin CSS */
const skinCache = new Map<string, string>()

/**
 * Register a skin for HMR updates
 *
 * @param skinId Unique identifier for the skin
 * @param initialCSS Initial CSS content
 * @param onUpdate Callback when skin CSS updates
 * @returns Cleanup function
 */
export function registerSkinHMR(
  skinId: string,
  initialCSS: string,
  onUpdate: (css: string) => void
): () => void {
  // Store initial CSS
  skinCache.set(skinId, initialCSS)

  // Register handler
  if (!skinHandlers.has(skinId)) {
    skinHandlers.set(skinId, new Set())
  }
  skinHandlers.get(skinId)!.add(onUpdate)

  // Return cleanup
  return () => {
    skinHandlers.get(skinId)?.delete(onUpdate)
    if (skinHandlers.get(skinId)?.size === 0) {
      skinHandlers.delete(skinId)
    }
  }
}

/**
 * Update a skin's CSS and notify all handlers
 *
 * Called by bundler plugins when a skin file changes
 */
export function updateSkin(skinId: string, newCSS: string): void {
  const oldCSS = skinCache.get(skinId)

  // Skip if unchanged
  if (oldCSS === newCSS) return

  // Update cache
  skinCache.set(skinId, newCSS)

  // Notify handlers
  const handlers = skinHandlers.get(skinId)
  if (handlers) {
    handlers.forEach((handler) => handler(newCSS))
  }
}

/**
 * Get current CSS for a skin
 */
export function getSkinCSS(skinId: string): string | undefined {
  return skinCache.get(skinId)
}

// ============================================================================
// Usage Example: Vite Plugin Integration
// ============================================================================

/**
 * Example of how a Vite plugin would use this layer
 *
 * ```typescript
 * // In generated wrapper code for a skin module:
 *
 * import { getHMR, registerSkinHMR, updateSkin } from '@flesh-cage/hmr'
 *
 * const skinId = 'button-default'
 * let currentCSS = `[part="surface"] { background: blue; }`
 *
 * // Setup HMR
 * const hmr = getHMR()
 *
 * if (hmr.available) {
 *   hmr.accept((newModule) => {
 *     if (newModule && typeof newModule === 'object' && 'default' in newModule) {
 *       updateSkin(skinId, (newModule as { default: string }).default)
 *     }
 *   })
 *
 *   // Preserve state across updates
 *   hmr.dispose((data) => {
 *     data.previousCSS = currentCSS
 *   })
 *
 *   // Restore state if available
 *   if (hmr.data.previousCSS) {
 *     currentCSS = hmr.data.previousCSS as string
 *   }
 * }
 *
 * export default currentCSS
 * ```
 */

// ============================================================================
// Usage Example: React Integration
// ============================================================================

/**
 * Example React hook for skin HMR
 *
 * ```typescript
 * import { useState, useEffect } from 'react'
 * import { registerSkinHMR, getSkinCSS } from '@flesh-cage/hmr'
 *
 * export function useSkinHMR(skinId: string, initialCSS: string) {
 *   const [css, setCSS] = useState(() => getSkinCSS(skinId) || initialCSS)
 *
 *   useEffect(() => {
 *     return registerSkinHMR(skinId, initialCSS, setCSS)
 *   }, [skinId, initialCSS])
 *
 *   return css
 * }
 *
 * // In component:
 * function Button() {
 *   const css = useSkinHMR('button-default', defaultButtonCSS)
 *
 *   useEffect(() => {
 *     // Update constructable stylesheet when CSS changes
 *     buttonSheet.replaceSync(css)
 *   }, [css])
 *
 *   return <button>Click me</button>
 * }
 * ```
 */

// ============================================================================
// Usage Example: Shadow DOM + Constructable Stylesheets
// ============================================================================

/**
 * Example of updating Shadow DOM styles via HMR
 *
 * ```typescript
 * import { registerSkinHMR } from '@flesh-cage/hmr'
 *
 * class ShadowButton extends HTMLElement {
 *   private sheet: CSSStyleSheet
 *   private cleanup?: () => void
 *
 *   constructor() {
 *     super()
 *     this.attachShadow({ mode: 'open' })
 *
 *     // Create constructable stylesheet
 *     this.sheet = new CSSStyleSheet()
 *
 *     // Register for HMR
 *     this.cleanup = registerSkinHMR(
 *       'shadow-button',
 *       initialCSS,
 *       (newCSS) => {
 *         // Instant update - no DOM manipulation needed!
 *         this.sheet.replaceSync(newCSS)
 *       }
 *     )
 *
 *     // Adopt stylesheet
 *     this.shadowRoot!.adoptedStyleSheets = [this.sheet]
 *     this.sheet.replaceSync(initialCSS)
 *   }
 *
 *   disconnectedCallback() {
 *     this.cleanup?.()
 *   }
 * }
 * ```
 */

// ============================================================================
// Bundler Plugin Helpers
// ============================================================================

/**
 * Generate HMR preamble code for skin modules
 *
 * Used by bundler plugins to inject HMR handling into skin files
 */
export function generateHMRPreamble(skinId: string): string {
  return `
import { getHMR, updateSkin } from '@flesh-cage/hmr';

const __skinId = ${JSON.stringify(skinId)};
const __hmr = getHMR();

if (__hmr.available) {
  __hmr.accept((newModule) => {
    if (newModule?.default) {
      updateSkin(__skinId, newModule.default);
    }
  });
}
`.trim()
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  // Check various environment indicators
  if (
    typeof process !== 'undefined' &&
    process.env?.NODE_ENV === 'development'
  ) {
    return true
  }

  // Vite
  if (
    typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV
  ) {
    return true
  }

  // Webpack DefinePlugin pattern
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return true
  }

  return false
}

// Declare __DEV__ for TypeScript
declare const __DEV__: boolean | undefined

// ============================================================================
// Debug Utilities
// ============================================================================

/**
 * Log HMR events (development only)
 */
export function enableHMRLogging(): () => void {
  const hmr = getHMR()
  const unsubscribers: Array<() => void> = []

  const events: HMREventType[] = [
    'update',
    'prune',
    'error',
    'full-reload',
    'connected',
    'disconnected',
  ]

  events.forEach((event) => {
    const unsub = hmr.on(event, (e) => {
      console.log(`[flesh-cage HMR] ${event}`, e)
    })
    unsubscribers.push(unsub)
  })

  console.log(`[flesh-cage HMR] Logging enabled for bundler: ${hmr.bundler}`)

  return () => {
    unsubscribers.forEach((unsub) => unsub())
    console.log('[flesh-cage HMR] Logging disabled')
  }
}

// ============================================================================
// Exports
// ============================================================================

export type {
  HMRInterface,
  HMRCallback,
  DisposeCallback,
  BundlerType,
  HMREventType,
  HMREvent,
  HMREventListener,
}

export { detectBundler, createHMRAdapter }
