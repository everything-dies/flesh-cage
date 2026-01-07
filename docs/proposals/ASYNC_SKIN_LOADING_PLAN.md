# Async Skin Loading with ReadableStream: Implementation Plan

## Table of Contents

1. [Current Architecture Overview](#current-architecture-overview)
2. [Problem Statement](#problem-statement)
3. [Proposed Solution](#proposed-solution)
4. [Critical CSS Extraction Strategies](#critical-css-extraction-strategies)
5. [Implementation Details](#implementation-details)
6. [Migration Path](#migration-path)
7. [Performance Considerations](#performance-considerations)
8. [Browser Compatibility](#browser-compatibility)
9. [Trade-offs and Alternatives](#trade-offs-and-alternatives)
10. [Code Examples](#code-examples)

---

## Current Architecture Overview

### How Skins Work Today

**Location**: `packages/flesh-cage/src/core/sheets.ts:22-35`

```typescript
load(skin: T): Promise<CSSStyleSheet> {
  const { [skin]: load } = this.#skins
  const promise = load()
    .then(({ default: style }) => new CSSStyleSheet().replace(style))
    .then((sheet) => {
      super.set(skin, sheet)
      return sheet
    })

  super.set(skin, promise)
  return promise
}
```

**Current Flow**:

1. **Import-based loading**: Skins are loaded via dynamic `import()` statements
2. **All-or-nothing**: Entire CSS string must load before any styles apply
3. **Single chunk**: No granular control over what loads first
4. **Promise-based**: Uses standard Promise resolution
5. **CSSStyleSheet API**: Converts string → CSSStyleSheet via `.replace()`

**Example Skin Definition**:

```typescript
// Button/index.tsx
skins: {
  material: () => import('./skins/material'),
  glassmorphic: () => import('./skins/glassmorphic')
}
```

**Example Skin File** (`material.ts`):

```typescript
export default `
  [part="surface"] {
    background: #2196f3;
    color: white;
    border: none;
    /* ... 40+ lines of CSS ... */
  }
`
```

### Shadow DOM Integration

**Location**: `packages/flesh-cage/src/core/styled.tsx:30-36`

```typescript
adorn(skin: string) {
  const adopt = (sheet: CSSStyleSheet) =>
    Object.assign(this.shadow, { adoptedStyleSheets: [sheet] })

  return new Promise<CSSStyleSheet>((resolve, reject) =>
    !sheets.validate(skin) ? reject(new Error('Invalid skin')) : resolve(sheets.get(skin))
  ).then(adopt)
}
```

When a skin loads:

1. `sheets.get(skin)` triggers load
2. CSS string → `CSSStyleSheet`
3. Assigned to Shadow DOM's `adoptedStyleSheets`
4. All styles apply atomically (no FOUC)

---

## Problem Statement

### Current Limitations

1. **No Progressive Rendering**
   - Users see unstyled component until entire skin loads
   - Large skins (animations, variants, responsive rules) delay initial render
   - Network latency affects Time to Interactive (TTI)

2. **Import() Constraints**
   - Module bundler controls chunking strategy
   - Can't prioritize critical CSS at runtime
   - No fine-grained control over load order
   - Bundle size = entire skin definition

3. **All-or-Nothing Loading**
   - Can't render with base styles while loading enhancements
   - Mobile users on slow networks wait for hover states, animations, etc.
   - No graceful degradation

4. **No Streaming**
   - Can't start parsing/applying CSS before full download
   - HTTP/2 multiplexing not fully leveraged
   - Server can't flush critical styles early

### Real-World Impact

**Scenario**: Material Design skin with:

- 15 KB base styles (colors, layout, typography)
- 25 KB animations (ripple effects, transitions)
- 10 KB responsive rules (mobile, tablet, desktop)
- 5 KB accessibility enhancements (focus states, high contrast)

**Today**: User waits for all 55 KB before seeing any styling (potential 500ms+ on 3G)

**Goal**: Show base 15 KB immediately (<100ms), stream remaining 40 KB progressively

---

## Proposed Solution

### ReadableStream-Based Chunked Loading

Replace static imports with fetch + ReadableStream to:

1. **Split skins into chunks** (critical + enhancements)
2. **Stream chunks progressively** via HTTP
3. **Apply styles incrementally** using multiple CSSStyleSheets
4. **Maintain backwards compatibility** with fallback to single-chunk loading

### Architecture Changes

```
┌─────────────────────────────────────────────────────────┐
│                    Current (Import)                     │
├─────────────────────────────────────────────────────────┤
│  Component Mount                                        │
│       ↓                                                 │
│  Dynamic import('./skin.ts')                           │
│       ↓                                                 │
│  Wait for entire CSS string                            │
│       ↓                                                 │
│  CSSStyleSheet.replace(allCSS)                         │
│       ↓                                                 │
│  adoptedStyleSheets = [sheet]                          │
│       ↓                                                 │
│  Styled component renders                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  Proposed (ReadableStream)              │
├─────────────────────────────────────────────────────────┤
│  Component Mount                                        │
│       ↓                                                 │
│  fetch('/skins/material.stream')                       │
│       ↓                                                 │
│  Read critical chunk from stream                       │
│       ↓                                                 │
│  CSSStyleSheet.replace(criticalCSS)                    │
│       ↓                                                 │
│  adoptedStyleSheets = [criticalSheet]                  │
│       ↓                                                 │
│  Component renders with base styles ← VISIBLE NOW      │
│       ↓                                                 │
│  Read enhancement chunks from stream (async)           │
│       ↓                                                 │
│  For each chunk:                                       │
│    - CSSStyleSheet.replace(chunkCSS)                   │
│    - adoptedStyleSheets = [...existing, newSheet]      │
│       ↓                                                 │
│  Fully styled component (progressive enhancement)      │
└─────────────────────────────────────────────────────────┘
```

---

## Critical CSS Extraction Strategies

### 1. Manual Chunking (Immediate Implementation)

**Directory Structure**:

```
Button/
├── skins/
│   ├── material/
│   │   ├── critical.ts      # Base styles (always needed)
│   │   ├── animations.ts    # Motion, transitions
│   │   ├── responsive.ts    # Media queries
│   │   └── variants.ts      # Secondary, tertiary buttons
│   └── material.stream.ts   # Stream coordinator
```

**critical.ts**:

```typescript
export default `
  [part="surface"] {
    background: var(--color-primary, #2196f3);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 12px 24px;
    font-size: 16px;
    cursor: pointer;
  }
`
```

**animations.ts**:

```typescript
export default `
  [part="surface"] {
    transition: all 0.3s ease;
  }

  [part="surface"]:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    transform: translateY(-1px);
  }
`
```

**material.stream.ts**:

```typescript
export interface SkinChunk {
  name: string
  priority: 'critical' | 'high' | 'low'
  css: string
}

export async function* streamSkin() {
  // Chunk 1: Critical (yield immediately)
  yield {
    name: 'critical',
    priority: 'critical',
    css: (await import('./critical')).default,
  }

  // Chunk 2: Animations (yield after critical)
  yield {
    name: 'animations',
    priority: 'high',
    css: (await import('./animations')).default,
  }

  // Chunk 3: Responsive (lower priority)
  yield {
    name: 'responsive',
    priority: 'low',
    css: (await import('./responsive')).default,
  }
}
```

### 2. Build-Time Chunking (Future Enhancement)

Use AST parsing to auto-extract critical CSS:

**Vite Plugin**:

```typescript
// packages/flesh-cage/src/vite/chunk-skins.ts
export function chunkSkinsPlugin() {
  return {
    name: 'flesh-cage:chunk-skins',

    transform(code: string, id: string) {
      if (!id.endsWith('.skin.ts')) return null

      const ast = parseCss(code)
      const chunks = {
        critical: extractSelectors(ast, [
          '[part]',
          ':not(:hover)',
          ':not(:active)',
        ]),
        animations: extractSelectors(ast, [
          'transition',
          'animation',
          'transform',
        ]),
        responsive: extractMediaQueries(ast),
        variants: extractSelectors(ast, ['[data-variant]']),
      }

      return generateStreamedSkin(chunks)
    },
  }
}
```

### 3. Server-Side Streaming (Advanced)

Generate ReadableStream on server:

**Express/Node**:

```typescript
app.get('/skins/:name.stream', async (req, res) => {
  const { name } = req.params
  const skin = await loadSkin(name)

  res.setHeader('Content-Type', 'application/octet-stream')
  res.setHeader('Transfer-Encoding', 'chunked')

  // Send critical CSS immediately
  res.write(
    JSON.stringify({
      chunk: 'critical',
      css: skin.critical,
    })
  )

  // Flush to client (HTTP/2 push)
  res.flush()

  // Send remaining chunks
  for (const chunk of ['animations', 'responsive', 'variants']) {
    await delay(0) // Yield to event loop
    res.write(
      JSON.stringify({
        chunk,
        css: skin[chunk],
      })
    )
  }

  res.end()
})
```

---

## Implementation Details

### Phase 1: Extend `Sheets` Class

**Location**: `packages/flesh-cage/src/core/sheets.ts`

```typescript
import type { Skins, SkinChunk } from './types'

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

  /**
   * Load skin with streaming support
   * Returns array of CSSStyleSheets (one per chunk)
   */
  async load(skin: T): Promise<CSSStyleSheet[]> {
    const { [skin]: loader } = this.#skins
    const sheets: CSSStyleSheet[] = []

    // Check if loader returns AsyncGenerator (streaming)
    const result = loader()

    if (Symbol.asyncIterator in result) {
      // Streaming mode
      const promise = this.loadStreamed(
        result as AsyncGenerator<SkinChunk>,
        sheets
      )
      super.set(skin, promise)
      return promise
    } else {
      // Legacy mode (single chunk)
      const promise = this.loadLegacy(
        result as Promise<{ default: string }>,
        sheets
      )
      super.set(skin, promise)
      return promise
    }
  }

  /**
   * Load streaming skin chunks progressively
   */
  private async loadStreamed(
    stream: AsyncGenerator<SkinChunk>,
    accumulator: CSSStyleSheet[]
  ): Promise<CSSStyleSheet[]> {
    for await (const chunk of stream) {
      const sheet = new CSSStyleSheet()
      await sheet.replace(chunk.css)

      accumulator.push(sheet)

      // Notify subscribers (for progressive rendering)
      this.dispatchUpdate(accumulator)
    }

    return accumulator
  }

  /**
   * Load legacy single-chunk skin
   */
  private async loadLegacy(
    promise: Promise<{ default: string }>,
    accumulator: CSSStyleSheet[]
  ): Promise<CSSStyleSheet[]> {
    const { default: css } = await promise
    const sheet = new CSSStyleSheet()
    await sheet.replace(css)

    accumulator.push(sheet)
    return accumulator
  }

  /**
   * Notify when new chunks are available (for live updates)
   */
  private dispatchUpdate(sheets: CSSStyleSheet[]) {
    // Emit event for reactive updates
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

### Phase 2: Update `styled()` to Handle Multiple Sheets

**Location**: `packages/flesh-cage/src/core/styled.tsx`

```typescript
export const styled = <Props extends {}, Names extends string = string>(
  Component: ComponentType<Props>,
  { name, skins, ...attributes }: StyledConfig<Names>
): ComponentType<Props> => {
  const sheets = new Sheets({ skins })

  class CustomElement extends HTMLElement {
    static observedAttributes = ['skin'] as const

    shadow = this.attachShadow({ mode: 'open' })
    #cleanupChunkListener?: () => void

    adorn(skin: string) {
      // Returns Promise<CSSStyleSheet[]> now
      return new Promise<CSSStyleSheet[]>((resolve, reject) => {
        if (!sheets.validate(skin)) {
          return reject(new Error('Invalid skin'))
        }

        const result = sheets.get(skin)

        // If streaming, set up progressive updates
        if (result instanceof Promise) {
          // Apply sheets as they arrive
          this.#cleanupChunkListener?.()

          const listener = (event: Event) => {
            const { sheets: currentSheets } = (event as CustomEvent).detail
            this.shadow.adoptedStyleSheets = currentSheets
          }

          window.addEventListener('skin-chunk-loaded', listener)
          this.#cleanupChunkListener = () =>
            window.removeEventListener('skin-chunk-loaded', listener)

          result.then((finalSheets) => {
            this.shadow.adoptedStyleSheets = finalSheets
            this.#cleanupChunkListener?.()
            resolve(finalSheets)
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
          return this.suspend(this.adorn(next).then(() => {}))
      }
    }

    connectedCallback() {
      const skin = (this.getAttribute('skin') ?? '').trim().toLowerCase()
      return this.suspend(this.adorn(skin).then(() => {}))
    }

    disconnectedCallback() {
      this.shadow.adoptedStyleSheets = []
      this.#cleanupChunkListener?.()
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

### Phase 3: Update Type Definitions

**Location**: `packages/flesh-cage/src/core/types.ts`

```typescript
export interface SkinChunk {
  name: string
  priority: 'critical' | 'high' | 'low'
  css: string
  media?: string // Optional media query
}

// Legacy loader (single chunk)
export type SkinLoader = () => Promise<{ default: string }>

// Streaming loader (multiple chunks)
export type SkinStreamLoader = () => AsyncGenerator<SkinChunk, void, unknown>

// Unified loader type
export type UnifiedSkinLoader = SkinLoader | SkinStreamLoader

export type Skins<T extends string = string> = Record<T, UnifiedSkinLoader>
```

### Phase 4: Fetch-Based Streaming (Alternative to Imports)

**Create Stream Helper**:

```typescript
// packages/flesh-cage/src/core/stream-loader.ts

export async function* loadSkinStream(url: string): AsyncGenerator<SkinChunk> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to load skin: ${response.statusText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('ReadableStream not supported')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()

    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // Split by delimiter (e.g., newline-delimited JSON)
    const lines = buffer.split('\n')
    buffer = lines.pop() || '' // Keep incomplete line

    for (const line of lines) {
      if (line.trim()) {
        yield JSON.parse(line) as SkinChunk
      }
    }
  }

  // Handle remaining buffer
  if (buffer.trim()) {
    yield JSON.parse(buffer) as SkinChunk
  }
}
```

**Usage in Component**:

```typescript
import { loadSkinStream } from 'flesh-cage/stream-loader'

export const Button = styled(ButtonBase, {
  skins: {
    // Streaming from server
    material: () => loadSkinStream('/skins/material.ndjson'),

    // Streaming from static imports
    brutalist: () => streamSkin(), // From material.stream.ts

    // Legacy single-chunk
    simple: () => import('./skins/simple'),
  },
  name: 'styled-button',
})
```

---

## Migration Path

### Step 1: Add Streaming Support (No Breaking Changes)

**Week 1-2**: Implement dual-mode loading

- ✅ Existing skins continue working
- ✅ Add `UnifiedSkinLoader` type
- ✅ Update `Sheets.load()` to detect stream vs promise
- ✅ Update `styled()` to handle `CSSStyleSheet[]`

### Step 2: Migrate High-Impact Skins

**Week 3-4**: Convert large skins to streaming

- Material Design → 3 chunks (critical, animations, responsive)
- Glassmorphic → 2 chunks (critical, effects)
- Keep Brutalist as single chunk (small size)

### Step 3: Add Build Tooling

**Week 5-6**: Automate chunking

- Vite plugin for auto-detection
- AST-based critical CSS extraction
- Generate `.stream.ts` files automatically

### Step 4: Server-Side Streaming (Optional)

**Week 7+**: Add server streaming for dynamic skins

- Express middleware for `.stream` endpoint
- HTTP/2 server push for critical chunks
- CDN integration for cached chunks

---

## Performance Considerations

### Metrics to Improve

| Metric                             | Current | Target | Improvement   |
| ---------------------------------- | ------- | ------ | ------------- |
| **First Contentful Paint (FCP)**   | 500ms   | 150ms  | 70% faster    |
| **Time to Interactive (TTI)**      | 800ms   | 300ms  | 62% faster    |
| **Largest Contentful Paint (LCP)** | 600ms   | 250ms  | 58% faster    |
| **Total Blocking Time (TBT)**      | 200ms   | 50ms   | 75% reduction |
| **Bundle Size (initial)**          | 55 KB   | 15 KB  | 73% smaller   |

### Network Waterfall Comparison

**Before (Single Chunk)**:

```
0ms ────────────────────────────────────────────────────────────── 500ms
     |                                                            |
     |           Downloading material.css (55 KB)                 |
     |                                                            |
     └────────────────────────────────────────────────────────────┘
                                                                   ↓
                                                         Component renders
```

**After (Streaming)**:

```
0ms ──────────────────────────────────────────────────────────────── 500ms
     |      |           |              |                            |
     | Crit | Anim      | Resp         | Variants                   |
     | 15KB | 25KB      | 10KB         | 5KB                        |
     |      |           |              |                            |
     └──────┘           └──────────────┴────────────────────────────┘
           ↓
    Component renders (150ms)
           ↓
    Enhancements apply progressively
```

### Memory Considerations

**Impact**: Multiple `CSSStyleSheet` objects vs single sheet

- **Before**: 1 sheet × 55 KB = 55 KB RAM
- **After**: 4 sheets × (15+25+10+5) KB = 55 KB RAM + ~2 KB overhead
- **Trade-off**: Minimal memory increase (~3.6%) for significant UX improvement

### Bundle Splitting

Streaming enables better code splitting:

```typescript
// Critical path (always loaded)
import { styled } from 'flesh-cage'

// Lazy-loaded skins (only when needed)
skins: {
  material: () => loadSkinStream('/skins/material.ndjson')
}
```

**Result**: Main bundle size reduction of 40-50 KB per skin

---

## Browser Compatibility

### Required APIs

| API                           | Chrome | Firefox | Safari | Edge |
| ----------------------------- | ------ | ------- | ------ | ---- |
| **CSSStyleSheet.replace()**   | 73+    | 101+    | 16.4+  | 79+  |
| **Constructable Stylesheets** | 73+    | 101+    | 16.4+  | 79+  |
| **ReadableStream**            | 43+    | 65+     | 10.1+  | 14+  |
| **AsyncGenerator**            | 63+    | 55+     | 12+    | 79+  |
| **Shadow DOM**                | 53+    | 63+     | 10+    | 79+  |

**Coverage**: ~95% of global browser usage (2024 data)

### Polyfill Strategy

For older browsers:

```typescript
// packages/flesh-cage/src/core/polyfills.ts

export async function ensureStreamSupport() {
  if (!('ReadableStream' in window)) {
    await import('web-streams-polyfill')
  }

  if (!('replace' in CSSStyleSheet.prototype)) {
    // Fallback to <style> tags
    return {
      replace(css: string) {
        const style = document.createElement('style')
        style.textContent = css
        return Promise.resolve(style.sheet!)
      },
    }
  }
}
```

---

## Trade-offs and Alternatives

### Approach 1: ReadableStream (Recommended)

**Pros**:

- ✅ Fine-grained control over chunking
- ✅ True streaming (apply styles before full download)
- ✅ Server-side push support
- ✅ Works with CDN/static hosting

**Cons**:

- ❌ More complex implementation
- ❌ Requires server changes for full benefits
- ❌ Slight increase in bundle size (chunking logic)

### Approach 2: Multiple Imports (Simpler Alternative)

```typescript
skins: {
  material: {
    critical: () => import('./material/critical'),
    animations: () => import('./material/animations'),
    responsive: () => import('./material/responsive')
  }
}
```

**Pros**:

- ✅ Simpler implementation
- ✅ Works with existing bundler
- ✅ No server changes needed

**Cons**:

- ❌ No true streaming (chunks load in parallel, not progressive)
- ❌ Can't prioritize critical over non-critical
- ❌ Module overhead (extra HTTP requests)

### Approach 3: CSS-in-JS with `@import`

```css
/* critical.css */
[part='surface'] {
  /* base styles */
}

@import url('./animations.css') layer(animations);
@import url('./responsive.css') layer(responsive);
```

**Pros**:

- ✅ Browser-native loading
- ✅ Cascade layers for priority

**Cons**:

- ❌ Loses Shadow DOM encapsulation
- ❌ No programmatic control over load order
- ❌ Network waterfalls (serial loading)

---

## Code Examples

### Example 1: Convert Material Skin to Streaming

**Before** (`material.ts`):

```typescript
export default `
  [part="surface"] {
    background: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  [part="surface"]:hover {
    background: #1976d2;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    transform: translateY(-1px);
  }

  [part="surface"]:active {
    background: #1565c0;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    transform: translateY(0);
  }

  [part="surface"][data-variant="secondary"] {
    background: #757575;
  }

  [part="label"] {
    display: inline-block;
  }
`
```

**After** (`material/index.stream.ts`):

```typescript
import type { SkinChunk } from 'flesh-cage'

export async function* streamMaterialSkin() {
  // Chunk 1: Critical base styles (4 KB) - yield immediately
  yield {
    name: 'critical',
    priority: 'critical',
    css: `
      [part="surface"] {
        background: #2196f3;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
      }

      [part="label"] {
        display: inline-block;
      }
    `,
  } as SkinChunk

  // Chunk 2: Animations (2 KB) - yield after critical
  yield {
    name: 'animations',
    priority: 'high',
    css: `
      [part="surface"] {
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      [part="surface"]:hover {
        background: #1976d2;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        transform: translateY(-1px);
      }

      [part="surface"]:active {
        background: #1565c0;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        transform: translateY(0);
      }
    `,
  } as SkinChunk

  // Chunk 3: Variants (1 KB) - yield last
  yield {
    name: 'variants',
    priority: 'low',
    css: `
      [part="surface"][data-variant="secondary"] {
        background: #757575;
      }

      [part="surface"][data-variant="secondary"]:hover {
        background: #616161;
      }
    `,
  } as SkinChunk
}
```

**Usage**:

```typescript
import { streamMaterialSkin } from './skins/material/index.stream'

export const Button = styled(ButtonBase, {
  skins: {
    material: streamMaterialSkin,
    brutalist: () => import('./skins/brutalist'), // Legacy still works
  },
  name: 'styled-button',
})
```

### Example 2: Server-Side Streaming Endpoint

**Server** (`server/skins.ts`):

```typescript
import express from 'express'

const app = express()

// Serve skins as newline-delimited JSON stream
app.get('/api/skins/:name.ndjson', async (req, res) => {
  const { name } = req.params

  res.setHeader('Content-Type', 'application/x-ndjson')
  res.setHeader('Transfer-Encoding', 'chunked')
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

  // Critical chunk (send immediately)
  const critical = await loadSkinChunk(name, 'critical')
  res.write(JSON.stringify(critical) + '\n')
  res.flush() // Force send to client

  // Remaining chunks (send progressively)
  for (const chunk of ['animations', 'responsive', 'variants']) {
    const data = await loadSkinChunk(name, chunk)
    res.write(JSON.stringify(data) + '\n')
    await delay(0) // Yield to event loop
  }

  res.end()
})

app.listen(3000)
```

**Client**:

```typescript
import { loadSkinStream } from 'flesh-cage/stream-loader'

export const Button = styled(ButtonBase, {
  skins: {
    material: () => loadSkinStream('/api/skins/material.ndjson'),
  },
  name: 'styled-button',
})
```

### Example 3: Progressive Enhancement with Feature Detection

```typescript
// packages/flesh-cage/src/core/sheets.ts

export class Sheets<T extends string = string> {
  async load(skin: T): Promise<CSSStyleSheet[]> {
    const loader = this.#skins[skin]
    const result = loader()

    // Feature detection: streaming support?
    const supportsStreaming =
      typeof ReadableStream !== 'undefined' && Symbol.asyncIterator in result

    if (supportsStreaming) {
      // Use streaming for modern browsers
      return this.loadStreamed(result as AsyncGenerator<SkinChunk>)
    } else {
      // Fallback to single-chunk for older browsers
      return this.loadLegacy(result as Promise<{ default: string }>)
    }
  }
}
```

### Example 4: Build-Time Chunking with Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { fleshCagePlugin } from 'flesh-cage/vite'

export default defineConfig({
  plugins: [
    fleshCagePlugin({
      // Auto-detect skin files
      skinPattern: '**/*.skin.ts',

      // Auto-chunk skins
      chunkSkins: true,

      // Chunking strategy
      chunks: {
        critical: {
          include: ['[part]', ':root', 'base styles'],
          exclude: [':hover', ':active', 'animation', '@media'],
        },
        animations: {
          include: ['transition', 'animation', 'transform'],
        },
        responsive: {
          include: ['@media'],
        },
      },
    }),
  ],
})
```

**Input** (`button.skin.ts`):

```typescript
export default `
  [part="surface"] { background: blue; }
  [part="surface"]:hover { background: darkblue; }
  @media (max-width: 768px) { [part="surface"] { padding: 8px; } }
`
```

**Output** (generated by plugin):

```typescript
// button.skin.stream.ts (auto-generated)
export async function* streamButtonSkin() {
  yield {
    name: 'critical',
    priority: 'critical',
    css: '[part="surface"] { background: blue; }',
  }

  yield {
    name: 'animations',
    priority: 'high',
    css: '[part="surface"]:hover { background: darkblue; }',
  }

  yield {
    name: 'responsive',
    priority: 'low',
    css: '@media (max-width: 768px) { [part="surface"] { padding: 8px; } }',
  }
}
```

---

## Recommended Implementation Timeline

### Phase 1: Foundation (Week 1-2)

- [ ] Update `Sheets` class to handle `CSSStyleSheet[]`
- [ ] Add `UnifiedSkinLoader` type support
- [ ] Implement dual-mode detection (streaming vs legacy)
- [ ] Update `styled()` to adopt multiple stylesheets
- [ ] Add unit tests for both modes

### Phase 2: Manual Streaming (Week 3-4)

- [ ] Create `stream-loader.ts` helper
- [ ] Convert Material skin to 3 chunks
- [ ] Convert Glassmorphic skin to 2 chunks
- [ ] Add benchmark tests (measure FCP, TTI, LCP)
- [ ] Document streaming API

### Phase 3: Developer Experience (Week 5-6)

- [ ] Create Vite plugin for auto-chunking
- [ ] Add AST-based critical CSS extraction
- [ ] Generate `.stream.ts` files at build time
- [ ] Add TypeScript types for generated streams
- [ ] Create migration guide

### Phase 4: Server Streaming (Week 7-8, Optional)

- [ ] Add Express middleware for `.ndjson` endpoints
- [ ] Implement HTTP/2 server push
- [ ] Add CDN integration guide
- [ ] Add monitoring/analytics for chunk performance
- [ ] Create deployment guide

---

## Success Metrics

### User Experience

- ✅ 70% faster First Contentful Paint
- ✅ 60% faster Time to Interactive
- ✅ Zero FOUC (Flash of Unstyled Content)
- ✅ Progressive enhancement (basic → enhanced)

### Developer Experience

- ✅ Backwards compatible (existing skins work)
- ✅ Opt-in (developers choose streaming vs legacy)
- ✅ Auto-chunking via build plugin (zero config)
- ✅ Type-safe streaming API

### Performance

- ✅ 73% reduction in initial bundle size
- ✅ 75% reduction in Total Blocking Time
- ✅ Parallel chunk loading (HTTP/2 multiplexing)
- ✅ Graceful degradation on slow networks

---

## Appendix: Alternative Streaming Formats

### Option 1: Newline-Delimited JSON (NDJSON)

```
{"name":"critical","priority":"critical","css":"[part] { ... }"}
{"name":"animations","priority":"high","css":":hover { ... }"}
```

**Pros**: Easy to parse, widely supported
**Cons**: No binary support, JSON overhead

### Option 2: Binary Stream (Custom Protocol)

```
[4 bytes length][chunk data][4 bytes length][chunk data]...
```

**Pros**: Smallest size, fastest parsing
**Cons**: Complex implementation, debugging harder

### Option 3: Server-Sent Events (SSE)

```
event: chunk
data: {"name":"critical","css":"..."}

event: chunk
data: {"name":"animations","css":"..."}
```

**Pros**: Browser reconnection, event-based
**Cons**: HTTP/1.1 only, not binary-safe

**Recommendation**: Use NDJSON for simplicity and wide compatibility

---

## Conclusion

This plan provides a comprehensive path to implement chunked, streaming skin loading while maintaining backwards compatibility. The ReadableStream approach offers the best balance of performance, developer experience, and progressive enhancement.

**Next Steps**:

1. Review this plan with team
2. Prototype `Sheets` class changes (Phase 1)
3. Benchmark performance improvements
4. Decide on build-time vs runtime chunking
5. Create migration guide for existing skins

**Estimated Impact**:

- 70% faster initial render
- 73% smaller critical bundle
- Zero breaking changes for existing code
- Foundation for future dynamic theming features
