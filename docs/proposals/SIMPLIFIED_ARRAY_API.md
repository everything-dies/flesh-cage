# Simplified Array-Based Skin API

## Consumer-Facing API (Super Simple)

Instead of writing async generators manually, consumers just provide an array:

```typescript
// Consumer writes this (simple!)
export const materialSkin = [
  () => import('./critical'), // Dynamic import (lazy)
  () => import('./animations'), // Dynamic import (lazy)
  () => import('./variants'), // Dynamic import (lazy)
]

// Or even simpler - direct imports/strings
export const brutalistSkin = [
  import('./critical'), // Promise (eager)
  'inline css here', // String (inline)
  () => import('./animations'), // Function (lazy)
]
```

Then internally, flesh-cage converts this to async generator automatically.

---

## Implementation

### Step 1: Create Helper Function

**packages/flesh-cage/src/core/create-skin-stream.ts**:

```typescript
import type { SkinChunk } from './types'

/**
 * Supported chunk types in the array
 */
export type SkinChunkInput =
  | string // Inline CSS
  | Promise<{ default: string }> // Eager import
  | (() => Promise<{ default: string }>) // Lazy import (recommended)
  | { default: string } // Already resolved module
  | SkinChunk // Full chunk object

/**
 * Array of skin chunks (consumer-facing API)
 */
export type SkinChunkArray = SkinChunkInput[]

/**
 * Converts array of chunks into async generator
 * This is the internal implementation - consumers never see it
 */
export async function* createSkinStream(
  chunks: SkinChunkArray,
  options?: {
    priority?: ('critical' | 'high' | 'low')[]
    names?: string[]
  }
): AsyncGenerator<SkinChunk, void, unknown> {
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const name = options?.names?.[i] || `chunk-${i}`
    const priority = options?.priority?.[i] || (i === 0 ? 'critical' : 'low')

    let css: string

    // Handle different input types
    if (typeof chunk === 'string') {
      // Direct string
      css = chunk
    } else if (typeof chunk === 'function') {
      // Lazy function () => import(...)
      const module = await chunk()
      css = module.default
    } else if (chunk instanceof Promise) {
      // Direct promise import(...)
      const module = await chunk
      css = module.default
    } else if ('default' in chunk) {
      // Already resolved module
      css = chunk.default
    } else if ('css' in chunk) {
      // Full SkinChunk object
      yield chunk as SkinChunk
      continue
    } else {
      throw new Error(`Invalid chunk type at index ${i}`)
    }

    yield { name, priority, css } as SkinChunk
  }
}
```

### Step 2: Update Type Definitions

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

// Streaming loader (async generator)
export type SkinStreamLoader = () => AsyncGenerator<SkinChunk, void, unknown>

// NEW: Array-based loader (simplest!)
export type SkinArrayLoader = SkinChunkArray

// Unified type supporting all 3 modes
export type UnifiedSkinLoader =
  | SkinLoader // () => import('./skin')
  | SkinStreamLoader // async generator function
  | SkinArrayLoader // [import(...), import(...)]

export type Skins<T extends string = string> = Record<T, UnifiedSkinLoader>
```

### Step 3: Update Sheets Class to Detect Arrays

**packages/flesh-cage/src/core/sheets.ts**:

```typescript
import type { Skins, SkinChunk } from './types'
import { createSkinStream, type SkinChunkArray } from './create-skin-stream'

export class Sheets<T extends string = string> extends Map<
  T,
  CSSStyleSheet[] | Promise<CSSStyleSheet[]>
> {
  #skins: Skins<T>

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

  async load(skin: T): Promise<CSSStyleSheet[]> {
    const loader = this.#skins[skin]
    const sheets: CSSStyleSheet[] = []

    // Detect loader type
    const loaderType = this.detectLoaderType(loader)

    let stream: AsyncGenerator<SkinChunk>

    switch (loaderType) {
      case 'array':
        // Convert array to async generator
        stream = createSkinStream(loader as SkinChunkArray)
        break

      case 'generator':
        // Already an async generator function
        stream = (loader as () => AsyncGenerator<SkinChunk>)()
        break

      case 'legacy':
        // Single-chunk promise - convert to generator
        stream = this.legacyToStream(loader as () => Promise<{ default: string }>)
        break

      default:
        throw new Error(`Unknown loader type for skin: ${skin}`)
    }

    // Load all chunks from the stream
    const promise = this.loadStreamed(stream, sheets)
    super.set(skin, promise)
    return promise
  }

  /**
   * Detect what type of loader was provided
   */
  private detectLoaderType(loader: any): 'array' | 'generator' | 'legacy' {
    // Check if it's an array
    if (Array.isArray(loader)) {
      return 'array'
    }

    // Check if it's a function
    if (typeof loader === 'function') {
      // Call it to see what it returns
      const result = loader()

      // Check if it's an async generator
      if (result && typeof result === 'object' && Symbol.asyncIterator in result) {
        return 'generator'
      }

      // Check if it's a promise (legacy)
      if (result instanceof Promise) {
        return 'legacy'
      }
    }

    throw new Error('Invalid loader type')
  }

  /**
   * Convert legacy single-chunk loader to stream
   */
  private async *legacyToStream(
    loader: () => Promise<{ default: string }>
  ): AsyncGenerator<SkinChunk> {
    const { default: css } = await loader()
    yield {
      name: 'legacy',
      priority: 'critical',
      css,
    }
  }

  /**
   * Load chunks from async generator
   */
  private async loadStreamed(
    stream: AsyncGenerator<SkinChunk>,
    accumulator: CSSStyleSheet[]
  ): Promise<CSSStyleSheet[]> {
    for await (const chunk of stream) {
      const sheet = new CSSStyleSheet()
      await sheet.replace(chunk.css)

      accumulator.push(sheet)

      // Notify for progressive rendering
      this.dispatchUpdate(accumulator)
    }

    return accumulator
  }

  /**
   * Dispatch event for reactive updates
   */
  private dispatchUpdate(sheets: CSSStyleSheet[]) {
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

---

## Consumer Examples

### Example 1: Simple Array (Recommended)

**Button/skins/material.ts**:

```typescript
// Super simple - just export an array!
export const material = [
  () => import('./material/critical'),
  () => import('./material/animations'),
  () => import('./material/variants'),
]
```

**Button/index.tsx**:

```typescript
import { styled } from 'flesh-cage'
import { ButtonBase } from './ButtonBase'
import { material } from './skins/material'

export const Button = styled(ButtonBase, {
  skins: {
    material, // Just pass the array!
  },
  name: 'styled-button',
})
```

### Example 2: Mixed Types in Array

```typescript
// Mix inline CSS, imports, and lazy loaders
export const customSkin = [
  // Chunk 1: Inline critical CSS (fastest)
  `
    [part="surface"] {
      background: blue;
      color: white;
    }
  `,

  // Chunk 2: Lazy import (recommended)
  () => import('./animations'),

  // Chunk 3: Eager import (loads immediately)
  import('./variants'),

  // Chunk 4: Full chunk object (advanced)
  {
    name: 'responsive',
    priority: 'low',
    css: `
      @media (max-width: 768px) {
        [part="surface"] { padding: 8px; }
      }
    `,
  },
]
```

### Example 3: With Named Chunks and Priorities

Create a helper for better control:

**packages/flesh-cage/src/core/define-skin.ts**:

```typescript
import type { SkinChunkArray } from './create-skin-stream'

export interface SkinDefinition {
  chunks: SkinChunkArray
  names?: string[]
  priority?: ('critical' | 'high' | 'low')[]
}

/**
 * Helper to define skins with metadata
 */
export function defineSkin(definition: SkinDefinition): SkinChunkArray {
  // Store metadata on the array for later use
  const chunks = definition.chunks as SkinChunkArray & {
    __meta?: { names?: string[]; priority?: ('critical' | 'high' | 'low')[] }
  }

  chunks.__meta = {
    names: definition.names,
    priority: definition.priority,
  }

  return chunks
}
```

**Usage**:

```typescript
import { defineSkin } from 'flesh-cage'

export const material = defineSkin({
  chunks: [
    () => import('./material/critical'),
    () => import('./material/animations'),
    () => import('./material/variants'),
  ],
  names: ['critical', 'animations', 'variants'],
  priority: ['critical', 'high', 'low'],
})
```

### Example 4: All Three Modes Side-by-Side

```typescript
export const Button = styled(ButtonBase, {
  skins: {
    // Mode 1: Array (simplest!)
    material: [() => import('./material/critical'), () => import('./material/animations')],

    // Mode 2: Async generator (manual control)
    glassmorphic: async function* () {
      yield {
        name: 'critical',
        priority: 'critical',
        css: (await import('./glass/critical')).default,
      }
      yield {
        name: 'effects',
        priority: 'high',
        css: (await import('./glass/effects')).default,
      }
    },

    // Mode 3: Legacy single-chunk (backwards compatible)
    brutalist: () => import('./skins/brutalist'),
  },
  name: 'styled-button',
})
```

---

## Advanced: Array with Static Imports

For critical CSS that must be inline in the main bundle:

```typescript
// Import at top of file (bundled immediately)
import criticalCSS from './critical?raw' // Vite's raw import
import animationsPromise from './animations'

// Export as array (mix static and dynamic)
export const material = [
  criticalCSS, // String (already in bundle)
  animationsPromise, // Promise (loads async)
  () => import('./variants'), // Lazy (loads on demand)
]
```

This gives you maximum flexibility:

- Critical CSS: Static import (bundled, instant)
- Animations: Eager import (starts loading immediately)
- Variants: Lazy import (loads only when needed)

---

## Type Safety

**Full type inference**:

```typescript
import type { SkinChunkArray } from 'flesh-cage'

// TypeScript knows this is a valid skin
export const material: SkinChunkArray = [
  () => import('./critical'),
  'inline css',
  import('./animations'),
]

// Autocomplete and error checking works!
export const Button = styled(ButtonBase, {
  skins: {
    material, // ✅ Type-safe
  },
})
```

**Invalid types are caught**:

```typescript
export const invalid = [
  123, // ❌ Error: number is not assignable to SkinChunkInput
  null, // ❌ Error: null is not assignable to SkinChunkInput
]
```

---

## Performance Comparison

### Array API (Lazy Imports)

```typescript
;[
  () => import('./critical'), // Chunk 1: 4 KB
  () => import('./animations'), // Chunk 2: 2 KB
  () => import('./variants'), // Chunk 3: 1 KB
]
```

**Timeline**:

- 0ms: Component mounts
- 50ms: Chunk 1 loads → renders with critical styles ✅
- 100ms: Chunk 2 loads → animations enabled
- 120ms: Chunk 3 loads → variants available

### Array API (Eager Imports)

```typescript
;[
  import('./critical'), // Starts loading immediately
  import('./animations'), // Starts loading immediately
  import('./variants'), // Starts loading immediately
]
```

**Timeline**:

- 0ms: All chunks start loading in parallel
- 50ms: Chunk 1 completes → yields first
- 75ms: Chunk 2 completes → yields second
- 90ms: Chunk 3 completes → yields third

**Trade-off**: Eager loads all chunks (slightly more bandwidth), but critical chunk still applies first.

### Array API (Mixed)

```typescript
;[
  'inline critical css', // Instant (0ms)
  import('./animations'), // Eager (starts at 0ms)
  () => import('./variants'), // Lazy (starts when generator reaches it)
]
```

**Timeline**:

- 0ms: Inline CSS yields immediately → instant render ✅
- 0ms: Animations start loading (parallel)
- 50ms: Animations load → yields
- 50ms: Variants start loading
- 100ms: Variants load → yields

**Best of both worlds**: Instant critical render + progressive enhancement.

---

## Comparison: Array vs AsyncGenerator

### Array API (Recommended for Most Users)

```typescript
// Consumer code (simple!)
export const material = [() => import('./critical'), () => import('./animations')]
```

**Pros**:

- ✅ Simple syntax (just an array)
- ✅ No need to understand generators
- ✅ Easy to read and maintain
- ✅ Type-safe out of the box
- ✅ Supports inline CSS

**Cons**:

- ❌ Less control over timing
- ❌ Can't add logic between chunks

### AsyncGenerator API (Advanced Users)

```typescript
// Consumer code (advanced)
export async function* streamMaterial() {
  yield { css: (await import('./critical')).default }

  // Custom logic between chunks
  await waitForUserInteraction()

  yield { css: (await import('./animations')).default }
}
```

**Pros**:

- ✅ Full control over timing
- ✅ Can add logic between yields
- ✅ Can conditionally load chunks

**Cons**:

- ❌ More complex syntax
- ❌ Requires understanding generators
- ❌ More code to write

**Recommendation**: Use **array API by default**, only use async generator when you need custom logic.

---

## Migration Guide

### From Single Chunk to Array

**Before**:

```typescript
// material.ts
export default `
  [part="surface"] { background: blue; }
  [part="surface"]:hover { background: darkblue; }
`

// Button/index.tsx
skins: {
  material: () => import('./skins/material')
}
```

**After** (5 minutes):

```typescript
// material/critical.ts
export default `[part="surface"] { background: blue; }`

// material/animations.ts
export default `[part="surface"]:hover { background: darkblue; }`

// material.ts
export const material = [() => import('./material/critical'), () => import('./material/animations')]

// Button/index.tsx
import { material } from './skins/material'
skins: {
  material
}
```

### From AsyncGenerator to Array

**Before**:

```typescript
export async function* streamMaterial() {
  yield { css: (await import('./critical')).default }
  yield { css: (await import('./animations')).default }
}

skins: {
  material: streamMaterial
}
```

**After** (1 minute):

```typescript
export const material = [() => import('./critical'), () => import('./animations')]

skins: {
  material
}
```

---

## FAQ

### Q: Can I mix strings and imports in the array?

**A:** Yes! Any combination works:

```typescript
;['inline css', () => import('./chunk1'), import('./chunk2')]
```

### Q: What if I need custom logic between chunks?

**A:** Use async generator for that use case:

```typescript
async function* customLoader() {
  yield { css: await loadCritical() }

  if (userPrefersDarkMode) {
    yield { css: await loadDarkTheme() }
  }

  yield { css: await loadAnimations() }
}
```

### Q: Can I use static imports?

**A:** Yes, but they'll be bundled in the main chunk:

```typescript
import critical from './critical?raw' // Vite raw import

export const material = [
  critical, // Already in bundle (instant)
  () => import('./animations'), // Lazy loaded
]
```

### Q: Does the array order matter?

**A:** Yes! Chunks yield in array order. Put critical CSS first:

```typescript
;[
  () => import('./critical'), // Yields first
  () => import('./animations'), // Yields second
  () => import('./variants'), // Yields last
]
```

### Q: Can I use this with the Vite plugin?

**A:** Yes! The plugin can auto-generate arrays:

```typescript
// Input: material.skin.ts (single file)
export default `/* all css */`

// Output: material.skin.stream.ts (auto-generated)
export const material = [() => import('./material.critical'), () => import('./material.animations')]
```

---

## Recommended API

**For library consumers** (simplest):

```typescript
export const material = [() => import('./critical'), () => import('./animations')]
```

**For library authors** (with metadata):

```typescript
import { defineSkin } from 'flesh-cage'

export const material = defineSkin({
  chunks: [() => import('./critical'), () => import('./animations')],
  names: ['critical', 'animations'],
  priority: ['critical', 'high'],
})
```

**For advanced use cases** (full control):

```typescript
export async function* streamMaterial() {
  const critical = await import('./critical')
  yield { name: 'critical', priority: 'critical', css: critical.default }

  // Custom logic here
  await someAsyncOperation()

  const animations = await import('./animations')
  yield { name: 'animations', priority: 'high', css: animations.default }
}
```

---

## Implementation Checklist

- [ ] Create `create-skin-stream.ts` helper
- [ ] Update `types.ts` with `SkinChunkArray` and `UnifiedSkinLoader`
- [ ] Update `Sheets` class to detect and convert arrays
- [ ] Add type tests for array API
- [ ] Update documentation with array examples
- [ ] Create `defineSkin()` helper for metadata
- [ ] Add migration guide from async generator to array

**Estimated time**: 2-3 hours to implement, test, and document.

---

## Conclusion

The array API provides the best developer experience:

- ✅ Simple syntax (just an array)
- ✅ Type-safe
- ✅ Supports all chunk types (strings, imports, functions)
- ✅ Works with existing infrastructure
- ✅ Easy to migrate from legacy single-chunk

**Recommended approach**: Default to array API, provide async generator as escape hatch for advanced use cases.
