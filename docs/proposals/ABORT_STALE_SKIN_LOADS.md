# Aborting Stale Skin Loads with AbortController

## Problem Statement

**Scenario**: User rapidly switches skins:

```
0ms   → skin="material"     (starts loading)
100ms → skin="glassmorphic" (starts loading)
150ms → skin="brutalist"    (starts loading)
```

**Without abort control**:

- All 3 skins continue loading
- Waste bandwidth downloading unused CSS
- Race condition: whichever finishes last wins (unpredictable UI)
- Memory leak: cached unused stylesheets

**With abort control**:

- Only "brutalist" finishes loading
- "material" and "glassmorphic" abort (cancel network requests)
- Predictable: UI always shows latest requested skin
- No memory leaks

---

## Solution: AbortController Integration

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Component changes skin attribute: skin="material"          │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  CustomElement.attributeChangedCallback()                   │
│  ├─ Creates new AbortController                             │
│  ├─ Aborts previous controller (if exists)                  │
│  └─ Passes signal to Sheets.load(skin, { signal })          │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  Sheets.load() starts async generator                       │
│  └─ Passes signal through stream                            │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  AsyncGenerator yields chunks                               │
│  └─ Checks signal.aborted before each import()              │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  If aborted:                                                 │
│  ├─ Throw AbortError                                         │
│  ├─ Cancel pending imports (browser optimization)           │
│  └─ Clean up partial stylesheets                            │
│                                                              │
│  If completed:                                               │
│  └─ Adopt stylesheets to shadow DOM                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation

### Step 1: Update Sheets Class with Abort Support

**packages/flesh-cage/src/core/sheets.ts**:

```typescript
import type { Skins, SkinChunk } from './types'
import { createSkinStream, type SkinChunkArray } from './create-skin-stream'

export interface LoadOptions {
  signal?: AbortSignal
}

export class Sheets<T extends string = string> extends Map<
  T,
  CSSStyleSheet[] | Promise<CSSStyleSheet[]>
> {
  #skins: Skins<T>

  // Track active load operations per skin
  #activeLoads = new Map<T, AbortController>()

  constructor({ skins }: { skins: Skins<T> }) {
    super()
    this.#skins = skins
  }

  validate(skin?: string): skin is T {
    return !!skin && Object.prototype.hasOwnProperty.call(this.#skins, skin)
  }

  override get(skin: T): CSSStyleSheet[] | Promise<CSSStyleSheet[]> {
    return super.get(skin) || this.load(skin)
  }

  /**
   * Load skin with optional abort signal
   */
  async load(skin: T, options?: LoadOptions): Promise<CSSStyleSheet[]> {
    const { signal } = options || {}

    // Abort previous load for this skin (if any)
    const previousController = this.#activeLoads.get(skin)
    if (previousController) {
      previousController.abort('Replaced by newer skin load')
    }

    // Create new controller for this load
    const controller = new AbortController()
    this.#activeLoads.set(skin, controller)

    // Link external signal to internal controller
    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          controller.abort(signal.reason)
        },
        { once: true }
      )
    }

    const loader = this.#skins[skin]
    const sheets: CSSStyleSheet[] = []

    try {
      // Detect loader type
      const loaderType = this.detectLoaderType(loader)

      let stream: AsyncGenerator<SkinChunk>

      switch (loaderType) {
        case 'array':
          stream = createSkinStream(loader as SkinChunkArray, {
            signal: controller.signal,
          })
          break

        case 'generator':
          stream = (
            loader as (signal?: AbortSignal) => AsyncGenerator<SkinChunk>
          )(controller.signal)
          break

        case 'legacy':
          stream = this.legacyToStream(
            loader as () => Promise<{ default: string }>,
            controller.signal
          )
          break

        default:
          throw new Error(`Unknown loader type for skin: ${skin}`)
      }

      // Load all chunks from the stream
      const promise = this.loadStreamed(stream, sheets, controller.signal)
      super.set(skin, promise)

      const result = await promise

      // Clean up on success
      this.#activeLoads.delete(skin)

      return result
    } catch (error) {
      // Clean up on error
      this.#activeLoads.delete(skin)

      // Re-throw abort errors (expected)
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error
      }

      // Re-throw other errors (unexpected)
      throw error
    }
  }

  /**
   * Abort loading for a specific skin
   */
  abort(skin: T, reason?: string) {
    const controller = this.#activeLoads.get(skin)
    if (controller) {
      controller.abort(reason || 'Load aborted')
      this.#activeLoads.delete(skin)
      super.delete(skin) // Remove cached promise
    }
  }

  /**
   * Abort all active loads
   */
  abortAll(reason?: string) {
    for (const [skin, controller] of this.#activeLoads.entries()) {
      controller.abort(reason || 'All loads aborted')
      super.delete(skin)
    }
    this.#activeLoads.clear()
  }

  /**
   * Detect loader type
   */
  private detectLoaderType(loader: any): 'array' | 'generator' | 'legacy' {
    if (Array.isArray(loader)) {
      return 'array'
    }

    if (typeof loader === 'function') {
      const result = loader()

      if (
        result &&
        typeof result === 'object' &&
        Symbol.asyncIterator in result
      ) {
        return 'generator'
      }

      if (result instanceof Promise) {
        return 'legacy'
      }
    }

    throw new Error('Invalid loader type')
  }

  /**
   * Convert legacy loader to stream
   */
  private async *legacyToStream(
    loader: () => Promise<{ default: string }>,
    signal: AbortSignal
  ): AsyncGenerator<SkinChunk> {
    // Check abort before loading
    if (signal.aborted) {
      throw new DOMException('Load aborted', 'AbortError')
    }

    const { default: css } = await loader()

    // Check abort after loading
    if (signal.aborted) {
      throw new DOMException('Load aborted', 'AbortError')
    }

    yield {
      name: 'legacy',
      priority: 'critical',
      css,
    }
  }

  /**
   * Load chunks from async generator with abort support
   */
  private async loadStreamed(
    stream: AsyncGenerator<SkinChunk>,
    accumulator: CSSStyleSheet[],
    signal: AbortSignal
  ): Promise<CSSStyleSheet[]> {
    for await (const chunk of stream) {
      // Check if aborted before processing chunk
      if (signal.aborted) {
        throw new DOMException('Load aborted', 'AbortError')
      }

      const sheet = new CSSStyleSheet()
      await sheet.replace(chunk.css)

      // Check again after async operation
      if (signal.aborted) {
        throw new DOMException('Load aborted', 'AbortError')
      }

      accumulator.push(sheet)

      // Notify for progressive rendering
      this.dispatchUpdate(accumulator, signal)
    }

    return accumulator
  }

  /**
   * Dispatch update event with abort check
   */
  private dispatchUpdate(sheets: CSSStyleSheet[], signal: AbortSignal) {
    if (signal.aborted) return // Don't dispatch if aborted

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('skin-chunk-loaded', {
          detail: { sheets },
        })
      )
    }
  }
}
```

### Step 2: Update createSkinStream Helper

**packages/flesh-cage/src/core/create-skin-stream.ts**:

```typescript
import type { SkinChunk } from './types'

export type SkinChunkInput =
  | string
  | Promise<{ default: string }>
  | (() => Promise<{ default: string }>)
  | { default: string }
  | SkinChunk

export type SkinChunkArray = SkinChunkInput[]

export interface StreamOptions {
  signal?: AbortSignal
  priority?: ('critical' | 'high' | 'low')[]
  names?: string[]
}

/**
 * Convert array to async generator with abort support
 */
export async function* createSkinStream(
  chunks: SkinChunkArray,
  options?: StreamOptions
): AsyncGenerator<SkinChunk, void, unknown> {
  const { signal, priority, names } = options || {}

  for (let i = 0; i < chunks.length; i++) {
    // Check abort before processing chunk
    if (signal?.aborted) {
      throw new DOMException('Stream aborted', 'AbortError')
    }

    const chunk = chunks[i]
    const name = names?.[i] || `chunk-${i}`
    const chunkPriority = priority?.[i] || (i === 0 ? 'critical' : 'low')

    let css: string

    if (typeof chunk === 'string') {
      css = chunk
    } else if (typeof chunk === 'function') {
      const module = await chunk()

      // Check abort after async import
      if (signal?.aborted) {
        throw new DOMException('Stream aborted', 'AbortError')
      }

      css = module.default
    } else if (chunk instanceof Promise) {
      const module = await chunk

      if (signal?.aborted) {
        throw new DOMException('Stream aborted', 'AbortError')
      }

      css = module.default
    } else if ('default' in chunk) {
      css = chunk.default
    } else if ('css' in chunk) {
      yield chunk as SkinChunk
      continue
    } else {
      throw new Error(`Invalid chunk type at index ${i}`)
    }

    yield { name, priority: chunkPriority, css } as SkinChunk
  }
}
```

### Step 3: Update Custom Element to Use AbortController

**packages/flesh-cage/src/core/styled.tsx**:

```typescript
import { createPortal } from 'react-dom'
import { type ComponentType, type HTMLAttributes, createElement } from 'react'

import type { Skins } from './types'
import { Sheets } from './sheets'
import { useCore } from './use-core'

export interface StyledConfig<Names extends string = string> extends Partial<
  HTMLAttributes<HTMLElement>
> {
  name: string
  skins: Skins<Names>
}

export const styled = <Props extends {}, Names extends string = string>(
  Component: ComponentType<Props>,
  { name, skins, ...attributes }: StyledConfig<Names>
): ComponentType<Props> => {
  const sheets = new Sheets({ skins })

  class CustomElement extends HTMLElement {
    static observedAttributes = ['skin'] as const

    shadow = this.attachShadow({ mode: 'open' })

    // Track current load operation
    #currentLoadController?: AbortController

    adorn(skin: string) {
      // Abort previous load if still in progress
      if (this.#currentLoadController) {
        this.#currentLoadController.abort('Skin changed')
      }

      // Create new controller for this load
      const controller = new AbortController()
      this.#currentLoadController = controller

      return new Promise<CSSStyleSheet[]>((resolve, reject) => {
        if (!sheets.validate(skin)) {
          return reject(new Error('Invalid skin'))
        }

        const result = sheets.load(skin, { signal: controller.signal })

        if (result instanceof Promise) {
          // Listen for progressive updates
          const listener = (event: Event) => {
            // Ignore if this load was aborted
            if (controller.signal.aborted) return

            const { sheets: currentSheets } = (event as CustomEvent).detail
            this.shadow.adoptedStyleSheets = currentSheets
          }

          window.addEventListener('skin-chunk-loaded', listener)

          result
            .then((finalSheets) => {
              // Only apply if not aborted
              if (!controller.signal.aborted) {
                this.shadow.adoptedStyleSheets = finalSheets
                resolve(finalSheets)
              }
            })
            .catch((error) => {
              // Ignore abort errors (expected)
              if (error.name === 'AbortError') {
                console.debug(`Skin load aborted: ${skin}`)
                return
              }

              // Reject on other errors
              reject(error)
            })
            .finally(() => {
              window.removeEventListener('skin-chunk-loaded', listener)

              // Clean up controller if this is still the current one
              if (this.#currentLoadController === controller) {
                this.#currentLoadController = undefined
              }
            })
        } else {
          // Synchronous (already loaded)
          this.shadow.adoptedStyleSheets = result
          resolve(result)
        }
      })
    }

    attributeChangedCallback<Attribute extends (typeof CustomElement.observedAttributes)[number]>(
      name: Attribute,
      current: string,
      next: string
    ) {
      switch (true) {
        case !current:
          return
        case name.trim().toLowerCase() === 'skin':
          // adorn() will automatically abort previous load
          return this.suspend(this.adorn(next).then(() => {}))
      }
    }

    connectedCallback() {
      const skin = (this.getAttribute('skin') ?? '').trim().toLowerCase()
      return this.suspend(this.adorn(skin).then(() => {}))
    }

    disconnectedCallback() {
      // Abort any active load when component unmounts
      if (this.#currentLoadController) {
        this.#currentLoadController.abort('Component unmounted')
        this.#currentLoadController = undefined
      }

      this.shadow.adoptedStyleSheets = []
    }

    suspend(promise: Promise<unknown>) {
      const detail = promise.finally(
        this.dispatchEvent.bind(this, new CustomEvent('suspend'))
      )

      return queueMicrotask(
        this.dispatchEvent.bind(this, new CustomEvent('suspend', { detail }))
      )
    }
  }

  customElements.define(name, CustomElement)

  const Styled = (props: Props) => {
    const { container, ...core } = useCore()

    return createElement(
      name,
      { ...attributes, ...core },
      createPortal(<Component {...props} />, container)
    )
  }

  return Styled
}
```

### Step 4: Update Type Definitions

**packages/flesh-cage/src/core/types.ts**:

```typescript
import type { SkinChunkArray } from './create-skin-stream'

export interface SkinChunk {
  name: string
  priority: 'critical' | 'high' | 'low'
  css: string
}

// Legacy single-chunk loader
export type SkinLoader = () => Promise<{ default: string }>

// Streaming loader with optional abort signal
export type SkinStreamLoader = (
  signal?: AbortSignal
) => AsyncGenerator<SkinChunk, void, unknown>

// Array-based loader
export type SkinArrayLoader = SkinChunkArray

// Unified type
export type UnifiedSkinLoader = SkinLoader | SkinStreamLoader | SkinArrayLoader

export type Skins<T extends string = string> = Record<T, UnifiedSkinLoader>
```

---

## Usage Examples

### Example 1: Array-Based Skins (Auto-Abort)

**No changes needed!** Abort works automatically:

```typescript
export const material = [
  () => import('./material/critical'),
  () => import('./material/animations'),
  () => import('./material/variants'),
]

export const Button = styled(ButtonBase, {
  skins: { material },
  name: 'styled-button',
})
```

**Behavior**:

```jsx
// User rapidly changes skins
<Button skin="material" />      // Starts loading
<Button skin="glassmorphic" />  // Aborts material, loads glassmorphic
<Button skin="brutalist" />     // Aborts glassmorphic, loads brutalist

// Only brutalist finishes loading ✅
```

### Example 2: AsyncGenerator with Abort Awareness

For custom loaders that do network requests:

```typescript
export async function* streamMaterialSkin(signal?: AbortSignal) {
  // Check abort before expensive operation
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  // Chunk 1: Critical
  const critical = await fetch('/api/skins/material/critical', { signal })
  const criticalCSS = await critical.text()

  yield {
    name: 'critical',
    priority: 'critical',
    css: criticalCSS,
  }

  // Check abort between chunks
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  // Chunk 2: Animations
  const animations = await fetch('/api/skins/material/animations', { signal })
  const animationsCSS = await animations.text()

  yield {
    name: 'animations',
    priority: 'high',
    css: animationsCSS,
  }
}
```

**Benefits**:

- `fetch()` automatically cancels network requests when signal aborts
- Checks between chunks prevent unnecessary work
- Clean, predictable cleanup

### Example 3: Manual Abort Control

Advanced use case - abort from outside:

```typescript
const sheets = new Sheets({ skins: { material, brutalist } })

// Start loading
const promise = sheets.load('material')

// User changes mind
sheets.abort('material', 'User cancelled')

// Load different skin
await sheets.load('brutalist')
```

### Example 4: Abort All on Component Unmount

```typescript
export const Button = styled(ButtonBase, {
  skins: {
    material: async function* (signal) {
      // This signal aborts when component unmounts
      yield { css: await loadCritical(signal) }
      yield { css: await loadAnimations(signal) }
    },
  },
  name: 'styled-button',
})
```

---

## Race Condition Scenarios

### Scenario 1: Rapid Skin Switching

**Timeline**:

```
0ms   → User selects "material"
        ├─ AbortController created (controller1)
        ├─ Starts loading critical.ts (4 KB)
        └─ Status: Loading...

100ms → User selects "glassmorphic" (before material finishes)
        ├─ controller1.abort() called
        ├─ material: critical.ts fetch cancelled
        ├─ New AbortController created (controller2)
        ├─ Starts loading glassmorphic/critical.ts
        └─ Status: Loading glassmorphic...

150ms → User selects "brutalist" (before glassmorphic finishes)
        ├─ controller2.abort() called
        ├─ glassmorphic: critical.ts fetch cancelled
        ├─ New AbortController created (controller3)
        ├─ Starts loading brutalist/critical.ts
        └─ Status: Loading brutalist...

200ms → brutalist completes
        ├─ Applied to shadow DOM
        └─ Status: Loaded ✅
```

**Result**: Only "brutalist" loads, no wasted bandwidth, predictable UI.

### Scenario 2: Multiple Components, Same Skin

**Setup**:

```jsx
<Button skin="material" />  {/* Button 1 */}
<Button skin="material" />  {/* Button 2 */}
```

**Timeline**:

```
0ms   → Button 1 mounts
        ├─ Sheets.load('material') called
        ├─ Starts loading chunks
        └─ Status: Loading...

50ms  → Button 2 mounts
        ├─ Sheets.load('material') called again
        ├─ ABORTS previous load (from Button 1!)
        ├─ Starts new load
        └─ Status: Both buttons loading...
```

**Problem**: Button 2 aborts Button 1's load!

**Solution**: Use per-instance abort control instead of per-skin:

```typescript
// In Sheets class, change tracking:
#activeLoads = new Map<T, Set<AbortController>>()  // Multiple controllers per skin

// When loading:
const controllers = this.#activeLoads.get(skin) || new Set()
const controller = new AbortController()
controllers.add(controller)
this.#activeLoads.set(skin, controllers)

// Only abort on same instance, not globally
```

**Better approach**: Cache loaded skins, don't reload if already loaded:

```typescript
override get(skin: T): CSSStyleSheet[] | Promise<CSSStyleSheet[]> {
  // Return cached if available
  const cached = super.get(skin)
  if (cached && !(cached instanceof Promise)) {
    return cached  // Already loaded, reuse!
  }

  return this.load(skin)
}
```

### Scenario 3: Component Unmounts During Load

**Timeline**:

```
0ms   → Button mounts, starts loading "material"
        └─ Status: Loading...

100ms → User navigates away, Button unmounts
        ├─ disconnectedCallback() fires
        ├─ this.#currentLoadController.abort()
        ├─ Fetch requests cancelled
        ├─ Memory cleaned up
        └─ Status: Aborted ✅
```

**Benefit**: No memory leaks, no orphaned network requests.

---

## Performance Impact

### With Abort Control

**Network**:

```
0ms ────────────────────────────────────────────────────────── 500ms
     |                                                         |
     | material/critical.ts (4 KB, 0-100ms) ──X Aborted       |
     |                                                         |
     | glassmorphic/critical.ts (5 KB, 100-150ms) ──X Aborted |
     |                                                         |
     | brutalist/critical.ts (3 KB, 150-250ms) ✅ Completes   |
     |                                                         |
     └─────────────────────────────────────────────────────────┘

Total downloaded: 3 KB (only brutalist)
```

### Without Abort Control

**Network**:

```
0ms ────────────────────────────────────────────────────────── 500ms
     |                                                         |
     | material/critical.ts (4 KB) ──────────────────→ ✅      |
     | material/animations.ts (2 KB) ────────────────→ ✅      |
     |                                                         |
     | glassmorphic/critical.ts (5 KB) ──────────────→ ✅      |
     | glassmorphic/effects.ts (3 KB) ────────────────→ ✅      |
     |                                                         |
     | brutalist/critical.ts (3 KB) ──────────────────→ ✅      |
     |                                                         |
     └─────────────────────────────────────────────────────────┘

Total downloaded: 17 KB (all skins!)
Race condition: whichever finishes last wins
```

**Savings**: 82% reduction in wasted bandwidth (17 KB → 3 KB)

---

## Browser Compatibility

| Feature              | Chrome | Firefox | Safari | Edge |
| -------------------- | ------ | ------- | ------ | ---- |
| **AbortController**  | 66+    | 57+     | 12.1+  | 79+  |
| **AbortSignal**      | 66+    | 57+     | 12.1+  | 79+  |
| **fetch() + signal** | 66+    | 57+     | 12.1+  | 79+  |

**Coverage**: ~96% of global browser usage

**Polyfill**: `abort-controller` npm package for older browsers

---

## Testing Abort Behavior

### Test Case 1: Rapid Skin Changes

```typescript
import { render } from '@testing-library/react'
import { Button } from './Button'

test('aborts stale skin loads', async () => {
  const { rerender } = render(<Button skin="material" />)

  // Change skin before material loads
  rerender(<Button skin="glassmorphic" />)

  // Change again
  rerender(<Button skin="brutalist" />)

  // Wait for final skin
  await waitFor(() => {
    expect(button).toHaveStyle('background: yellow') // brutalist style
  })

  // Verify only brutalist loaded
  const networkRequests = getNetworkLog()
  expect(networkRequests.aborted).toEqual(['material', 'glassmorphic'])
  expect(networkRequests.completed).toEqual(['brutalist'])
})
```

### Test Case 2: Component Unmount

```typescript
test('aborts load on unmount', async () => {
  const { unmount } = render(<Button skin="material" />)

  // Unmount before load completes
  unmount()

  // Verify load was aborted
  expect(console.debug).toHaveBeenCalledWith('Skin load aborted: material')
})
```

### Test Case 3: Manual Abort

```typescript
test('can manually abort loads', async () => {
  const sheets = new Sheets({ skins: { material } })

  const promise = sheets.load('material')

  sheets.abort('material', 'Test abort')

  await expect(promise).rejects.toThrow('AbortError')
})
```

---

## Best Practices

### ✅ DO

1. **Always check signal.aborted** before expensive operations:

   ```typescript
   if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
   ```

2. **Pass signal to fetch()**:

   ```typescript
   await fetch('/api/skin', { signal })
   ```

3. **Check after async operations**:

   ```typescript
   const data = await fetch(url, { signal })
   if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
   ```

4. **Clean up on abort**:
   ```typescript
   try {
     await loadSkin(signal)
   } catch (error) {
     if (error.name === 'AbortError') {
       // Clean up resources
       cleanup()
     }
   }
   ```

### ❌ DON'T

1. **Don't ignore AbortError**:

   ```typescript
   // ❌ Bad
   try {
     await loadSkin(signal)
   } catch (error) {
     console.error(error) // Logs expected abort errors
   }

   // ✅ Good
   try {
     await loadSkin(signal)
   } catch (error) {
     if (error.name === 'AbortError') return // Expected
     console.error(error) // Only log unexpected errors
   }
   ```

2. **Don't forget to clean up controllers**:

   ```typescript
   // ❌ Bad
   const controller = new AbortController()
   await loadSkin(controller.signal)
   // Controller never cleaned up = memory leak

   // ✅ Good
   const controller = new AbortController()
   try {
     await loadSkin(controller.signal)
   } finally {
     // Clean up in map/set
     this.#activeLoads.delete(skin)
   }
   ```

3. **Don't abort shared resources**:

   ```typescript
   // ❌ Bad: Sharing controller between multiple operations
   const controller = new AbortController()
   Promise.all([
     loadCritical(controller.signal),
     loadAnimations(controller.signal),
   ])
   controller.abort() // Aborts both!

   // ✅ Good: Separate controllers or linked signals
   const mainController = new AbortController()
   const criticalController = new AbortController()
   const animationsController = new AbortController()

   mainController.signal.addEventListener('abort', () => {
     criticalController.abort()
     animationsController.abort()
   })
   ```

---

## Summary

### Implementation Checklist

- [ ] Add `LoadOptions` interface with `signal?: AbortSignal`
- [ ] Track active loads in `Sheets` class with `#activeLoads` Map
- [ ] Abort previous load when new load starts for same skin
- [ ] Pass signal through `createSkinStream()` helper
- [ ] Check `signal.aborted` before/after async operations
- [ ] Update `CustomElement` to create/abort controllers
- [ ] Clean up controllers on success/error/unmount
- [ ] Update type definitions for abort-aware loaders
- [ ] Add tests for abort behavior
- [ ] Document abort behavior for custom loaders

### Benefits

✅ **Predictable UI**: Latest requested skin always wins
✅ **Save bandwidth**: Cancel unused downloads (80%+ savings)
✅ **No race conditions**: Deterministic behavior
✅ **No memory leaks**: Clean up orphaned requests
✅ **Better UX**: Faster perceived performance
✅ **Standard API**: Uses native AbortController (no custom solution)

### Estimated Implementation Time

- **Core logic** (Sheets + createSkinStream): 2-3 hours
- **Custom element integration**: 1-2 hours
- **Type updates**: 30 minutes
- **Tests**: 2-3 hours
- **Documentation**: 1 hour

**Total**: ~7-9 hours for complete implementation

---

## Conclusion

AbortController integration solves race conditions elegantly:

1. **Automatic**: Works with array-based skins (zero config)
2. **Standard**: Uses native browser API
3. **Efficient**: Cancels network requests, saves bandwidth
4. **Clean**: No memory leaks or orphaned loads
5. **Testable**: Easy to verify abort behavior

**Recommended approach**: Implement abort support in `Sheets` class, let consumers benefit automatically.
