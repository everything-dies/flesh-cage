# HMR Across Bundlers: Vendor Comparison & Unified Strategy

## TL;DR

**Bad news:** Each bundler has slightly different HMR APIs
**Good news:** The core concepts are similar enough to abstract
**Best approach:** Detect bundler at runtime and use appropriate API

## Bundler HMR API Comparison

### Vite

```typescript
// Detection
if (import.meta.hot) {
  // HMR available
}

// Accept self updates
import.meta.hot.accept((newModule) => {
  // newModule is the updated module
})

// Accept dependencies
import.meta.hot.accept('./dep.js', (newDep) => {
  // Dependency updated
})

// Dispose/cleanup
import.meta.hot.dispose((data) => {
  // data.something = state to preserve
})

// Invalidate
import.meta.hot.invalidate() // Force full reload

// Custom events
import.meta.hot.on('custom-event', (data) => {})
import.meta.hot.send('custom-event', data)

// Data sharing between reloads
import.meta.hot.data // Persists across reloads
```

**Key characteristics:**

- Modern ESM-first API
- `import.meta.hot` is standard (part of Vite spec)
- Fast HMR via native ESM
- WebSocket-based communication

### Webpack

```typescript
// Detection
if (module.hot) {
  // HMR available
}

// Accept self updates
module.hot.accept((err) => {
  if (err) {
    // Handle error
  }
})

// Accept dependencies
module.hot.accept('./dep.js', () => {
  // Dependency updated
})

// Dispose/cleanup
module.hot.dispose((data) => {
  // data.something = state to preserve
})

// Decline updates
module.hot.decline() // Force page reload if this changes

// Check status
module.hot.status() // 'idle' | 'check' | 'prepare' | 'ready' | 'dispose' | 'apply' | 'abort' | 'fail'

// Events
module.hot.addStatusHandler((status) => {})
```

**Key characteristics:**

- CommonJS-style API
- More granular status lifecycle
- Can decline updates explicitly
- No built-in custom events (use workarounds)

### Parcel

```typescript
// Detection
if (module.hot) {
  // HMR available (same as Webpack!)
}

// Accept self updates
module.hot.accept((err) => {
  // Updated
})

// Dispose/cleanup
module.hot.dispose((data) => {
  // Cleanup
})

// No .decline() or .invalidate()
```

**Key characteristics:**

- Webpack-compatible API (subset)
- Simpler than Webpack
- Automatic HMR for many file types
- Less control over update lifecycle

### Rollup (via plugins)

```typescript
// Depends on plugin, but commonly:
if (import.meta.hot) {
  // Via rollup-plugin-hot or similar
  import.meta.hot.accept()
}
```

**Key characteristics:**

- No built-in HMR
- Plugin-dependent API
- Often mimics Vite's API
- Used mainly for library dev (not apps)

### esbuild

**No native HMR support** (as of 2025)

- Must use external solutions (esbuild-plugin-livereload, etc.)
- Usually falls back to full page reload
- Not a concern for most library authors

## API Differences Matrix

| Feature          | Vite              | Webpack          | Parcel           | Rollup           |
| ---------------- | ----------------- | ---------------- | ---------------- | ---------------- |
| Detection        | `import.meta.hot` | `module.hot`     | `module.hot`     | Plugin-dependent |
| Accept self      | ✅                | ✅               | ✅               | ✅ (via plugin)  |
| Accept deps      | ✅                | ✅               | ✅               | ✅ (via plugin)  |
| Dispose          | ✅                | ✅               | ✅               | ✅ (via plugin)  |
| Decline          | `invalidate()`    | `decline()`      | ❌               | Varies           |
| Status API       | ❌                | ✅               | ❌               | ❌               |
| Custom events    | ✅                | ❌               | ❌               | Varies           |
| Data persistence | `.data`           | dispose callback | dispose callback | Varies           |
| Module object    | New module arg    | Re-require       | Re-require       | New module arg   |

## Unified Detection Strategy

### Option 1: Runtime Detection

```typescript
// packages/flesh-cage/src/core/hmr-adapter.ts

type HMRRuntime = 'vite' | 'webpack' | 'parcel' | 'none'

function detectHMRRuntime(): HMRRuntime {
  if (typeof import.meta !== 'undefined' && import.meta.hot) {
    return 'vite'
  }
  if (typeof module !== 'undefined' && module.hot) {
    // Both Webpack and Parcel use module.hot
    // Differentiate by checking for Webpack-specific APIs
    return module.hot.status ? 'webpack' : 'parcel'
  }
  return 'none'
}

// Unified adapter interface
interface HMRAdapter {
  accept(callback: (newModule: any) => void): void
  dispose(callback: (data: any) => void): void
  invalidate(): void
  data: Record<string, any>
}

function createHMRAdapter(): HMRAdapter | null {
  const runtime = detectHMRRuntime()

  switch (runtime) {
    case 'vite':
      return {
        accept: (cb) => import.meta.hot!.accept(cb),
        dispose: (cb) => import.meta.hot!.dispose(cb),
        invalidate: () => import.meta.hot!.invalidate(),
        data: import.meta.hot!.data || {},
      }

    case 'webpack':
    case 'parcel':
      return {
        accept: (cb) => module.hot!.accept(() => cb(module)),
        dispose: (cb) => module.hot!.dispose(cb),
        invalidate: () => {
          if (runtime === 'webpack') {
            module.hot!.decline()
          }
          // Parcel: no-op or force reload
          window.location.reload()
        },
        data: {}, // Must manage manually
      }

    case 'none':
      return null
  }
}

export const hmr = createHMRAdapter()
```

### Option 2: Build-Time Adaptation

```typescript
// Use bundler-specific entry points

// vite.ts
export { createViteHMR as createHMR } from './adapters/vite'

// webpack.ts
export { createWebpackHMR as createHMR } from './adapters/webpack'

// Then in package.json:
{
  "exports": {
    ".": {
      "vite": "./dist/vite.js",
      "webpack": "./dist/webpack.js",
      "default": "./dist/index.js"
    }
  }
}
```

**Problem:** Bundlers don't expose themselves in a reliable way for conditional exports

### Option 3: Plugin-Based Approach (Recommended)

```typescript
// User installs bundler-specific plugin
// packages/vite-plugin/src/index.ts
export function fleshCageHMR() {
  /* Vite-specific */
}

// packages/webpack-plugin/src/index.ts
export function FleshCageHMRPlugin() {
  /* Webpack-specific */
}

// Plugin injects runtime code specific to that bundler
```

**Pros:**

- Clean separation of concerns
- Optimal code for each bundler
- User explicitly chooses their bundler
- No runtime detection overhead

**Cons:**

- More packages to maintain
- User must install correct plugin
- More complex setup

### Option 4: Hybrid Approach (Pragmatic)

```typescript
// Support Vite natively (most common in 2025)
// Provide adapter for Webpack/Parcel
// Document that esbuild requires full reload

// packages/flesh-cage/src/core/hmr.ts
export function setupHMR(
  skinName: string,
  updateCallback: (css: string) => void
) {
  // Vite (native)
  if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
      updateCallback(newModule.default)
    })
    return
  }

  // Webpack/Parcel (via optional adapter)
  if (typeof module !== 'undefined' && module.hot) {
    module.hot.accept(() => {
      // Re-import and update
      import(/* @vite-ignore */ skinPath).then((mod) => {
        updateCallback(mod.default)
      })
    })
    return
  }

  // No HMR support - silent fallback
  console.warn('[flesh-cage] HMR not available, changes require page reload')
}
```

## How Different Bundlers Handle Your Use Case

### Vite: Ideal Match

```typescript
// In skin file: material.ts
const css = `...styles...`
export default css

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    // Vite automatically provides newModule
    window.dispatchEvent(
      new CustomEvent('flesh-cage:update', {
        detail: { skinName: 'material', css: newModule.default },
      })
    )
  })
}
```

### Webpack: Requires Re-import

```typescript
// In skin file: material.ts
const css = `...styles...`
export default css

if (module.hot) {
  module.hot.accept()
  // Webpack doesn't provide newModule directly
  // Must re-import or use a workaround

  // Option A: Global event from outside
  module.hot.addStatusHandler((status) => {
    if (status === 'apply') {
      // Signal that update happened
    }
  })

  // Option B: Re-import in consuming component
  // (not in skin file itself)
}
```

### Parcel: Similar to Webpack

```typescript
// Parcel is similar to Webpack but simpler
// Usually relies on framework integration (React Fast Refresh, etc.)

if (module.hot) {
  module.hot.accept()
  // Limited control over update lifecycle
  // May need to rely on full component refresh
}
```

## Your Implementation Options

### Strategy A: Vite-First with Optional Webpack Support

**Recommended if:**

- Your primary users use Vite (most modern projects)
- You want to ship quickly
- Webpack users can accept basic support

```typescript
// Core library detects Vite automatically
// Webpack users install @flesh-cage/webpack-plugin for enhanced HMR
// Parcel users get basic support or page reload
```

**Implementation:**

1. Build-in Vite HMR support directly in skin loaders
2. Create optional Webpack plugin package
3. Document Parcel limitations

### Strategy B: Universal Adapter

**Recommended if:**

- You want broad compatibility
- Can accept slightly worse DX on some bundlers
- Want a single implementation

```typescript
// Create unified HMR adapter (Option 1 above)
// All bundlers use same code path
// Trade performance for compatibility
```

**Implementation:**

1. Create runtime adapter (as shown above)
2. Test on all major bundlers
3. Fallback to page reload if HMR fails

### Strategy C: Plugin-Per-Bundler

**Recommended if:**

- You want optimal experience everywhere
- Have resources to maintain multiple plugins
- Users are technical enough to install correct plugin

```typescript
// @flesh-cage/vite-plugin
// @flesh-cage/webpack-plugin
// @flesh-cage/parcel-plugin (if needed)
```

**Implementation:**

1. Shared core HMR logic in main package
2. Bundler-specific plugins inject runtime code
3. Plugins provide optimal integration for each bundler

## Technical Challenges Per Bundler

### Vite: Easiest

**Challenges:**

- None significant
- Module graph is clean and predictable

**Solution:**

- Use `import.meta.hot.accept()` directly
- Inject HMR code via plugin transform

### Webpack: Medium Difficulty

**Challenges:**

- No direct access to new module in accept callback
- Must re-import or use workarounds
- Status lifecycle is complex

**Solutions:**

1. **Re-import pattern:**

   ```typescript
   module.hot.accept('./skin.ts', () => {
     import('./skin.ts').then((newModule) => {
       updateSheet(newModule.default)
     })
   })
   ```

2. **Webpack-specific plugin:**

   ```typescript
   // Inject loader that adds re-import logic
   ```

3. **Use hot-accept-loader or similar**

### Parcel: Limited Control

**Challenges:**

- Very automatic (black box)
- Limited API for custom HMR logic
- May force component remount

**Solutions:**

- Accept limitations
- Fallback to React Fast Refresh integration
- Document that Parcel may lose state

## Recommended Architecture

```
@flesh-cage/core
├── src/
│   ├── hmr/
│   │   ├── adapter.ts          # Runtime detection & unified API
│   │   ├── vite.ts             # Vite-specific runtime
│   │   ├── webpack.ts          # Webpack-specific runtime
│   │   └── types.ts            # Shared HMR types
│   └── ...

@flesh-cage/vite-plugin (optional, for advanced features)
└── src/
    └── index.ts                # Vite plugin for injection

@flesh-cage/webpack-plugin (optional)
└── src/
    └── index.ts                # Webpack plugin/loader
```

## Code Example: Universal HMR

```typescript
// packages/flesh-cage/src/hmr/adapter.ts

export interface HMRContext {
  onUpdate(callback: (newCSS: string) => void): () => void
  dispose(cleanup: () => void): void
  invalidate(): void
}

export function createHMRContext(skinPath: string): HMRContext | null {
  // Vite
  if (import.meta.hot) {
    const callbacks = new Set<(css: string) => void>()

    import.meta.hot.accept((newModule) => {
      callbacks.forEach((cb) => cb(newModule.default))
    })

    return {
      onUpdate: (cb) => {
        callbacks.add(cb)
        return () => callbacks.delete(cb)
      },
      dispose: (cleanup) => {
        import.meta.hot!.dispose(() => cleanup())
      },
      invalidate: () => import.meta.hot!.invalidate(),
    }
  }

  // Webpack/Parcel
  if (typeof module !== 'undefined' && module.hot) {
    const callbacks = new Set<(css: string) => void>()

    module.hot.accept(skinPath, async () => {
      // Re-import to get new module
      const newModule = await import(/* webpackIgnore: true */ skinPath)
      callbacks.forEach((cb) => cb(newModule.default))
    })

    return {
      onUpdate: (cb) => {
        callbacks.add(cb)
        return () => callbacks.delete(cb)
      },
      dispose: (cleanup) => {
        module.hot!.dispose(() => cleanup())
      },
      invalidate: () => {
        // Webpack: decline to force reload
        if (module.hot!.decline) {
          module.hot!.decline()
        } else {
          // Parcel fallback
          window.location.reload()
        }
      },
    }
  }

  return null
}
```

## Usage in Your Library

```typescript
// packages/flesh-cage/src/core/sheets.ts

import { createHMRContext } from '../hmr/adapter'

export class Sheets<Names extends string = string> {
  #hmrContexts = new Map<Names, () => void>()

  load(skin: Names): Promise<CSSStyleSheet> {
    const promise = this.#skins[skin]().then(({ default: style }) => {
      const sheet = new CSSStyleSheet().replace(style)

      // Setup HMR if available
      const hmr = createHMRContext(`./skins/${skin}`)
      if (hmr) {
        const unsubscribe = hmr.onUpdate(async (newCSS) => {
          // Update existing sheet
          await sheet.replace(newCSS)

          // Notify all custom elements using this skin
          this.#notifyElements(skin, sheet)
        })

        this.#hmrContexts.set(skin, unsubscribe)
      }

      return sheet
    })

    // ...rest of implementation
  }
}
```

## TypeScript Considerations

```typescript
// packages/flesh-cage/src/types/hmr.d.ts

interface ImportMeta {
  hot?: {
    accept(cb: (newModule: any) => void): void
    dispose(cb: (data: any) => void): void
    invalidate(): void
    data: any
  }
}

interface NodeModule {
  hot?: {
    accept(path?: string, cb?: () => void): void
    dispose(cb: (data: any) => void): void
    decline(): void
    status?(): string
  }
}

declare const module: NodeModule | undefined
```

## Testing Across Bundlers

```typescript
// test/hmr/vite.test.ts - Run with Vite
// test/hmr/webpack.test.ts - Run with Webpack
// test/hmr/universal.test.ts - Mock all APIs

describe('HMR Adapter', () => {
  it('detects Vite', () => {
    // Mock import.meta.hot
    expect(detectHMRRuntime()).toBe('vite')
  })

  it('detects Webpack', () => {
    // Mock module.hot with status()
    expect(detectHMRRuntime()).toBe('webpack')
  })

  it('handles no HMR gracefully', () => {
    expect(createHMRAdapter()).toBe(null)
  })
})
```

## Decision Matrix

| Strategy           | Vite   | Webpack | Parcel | Complexity | Maintenance | Recommended?   |
| ------------------ | ------ | ------- | ------ | ---------- | ----------- | -------------- |
| Vite-First         | ⭐⭐⭐ | ⭐      | ⭐     | Low        | Low         | **Yes (MVP)**  |
| Universal Adapter  | ⭐⭐   | ⭐⭐    | ⭐⭐   | Medium     | Medium      | **Yes (v1.0)** |
| Plugin-Per-Bundler | ⭐⭐⭐ | ⭐⭐⭐  | ⭐⭐⭐ | High       | High        | Future         |
| No HMR (reload)    | ⭐     | ⭐      | ⭐     | Very Low   | Very Low    | Fallback       |

## Recommendations

### For Initial Release (MVP)

1. **Support Vite natively** with built-in HMR
2. **Detect and warn** on other bundlers
3. **Provide fallback** (page reload or no HMR)
4. **Document**: "HMR works best with Vite, other bundlers coming soon"

### For v1.0 (Production Ready)

1. **Implement universal adapter** (Strategy B)
2. **Test on Vite, Webpack, Parcel**
3. **Provide escape hatch** for manual HMR setup
4. **Document limitations** per bundler

### For Future (Complete)

1. **Create bundler-specific plugins** for optimal DX
2. **Support framework integrations** (Next.js, SvelteKit, etc.)
3. **Add HMR DevTools** panel
4. **Comprehensive compatibility testing**

## Real-World Examples

### Styled-Components

- Uses Babel plugin for component tracking
- Injects HMR code at build time
- Works across bundlers (plugin adapts to each)

### Emotion

- Runtime-based approach
- No bundler-specific code
- Relies on module reloading, not custom HMR

### CSS Modules

- Bundler-native support
- Each bundler handles it differently
- You'd follow similar pattern

### Vanilla Extract

- Build-time CSS generation
- Uses Vite/Webpack plugins
- Optimal HMR via bundler integration

## Conclusion

**Your best path forward:**

1. **Start with Vite-only HMR** (covers 70%+ of modern projects)
2. **Create universal adapter** for Webpack/Parcel (covers remaining 25%)
3. **Document limitations** and fallback behavior
4. **Later add plugins** if needed for optimal experience

**You do NOT need vendor-specific solutions** if you:

- Use the universal adapter pattern (Option 1 or 4)
- Accept minor DX differences across bundlers
- Provide good fallback behavior

**You SHOULD go vendor-specific** if you:

- Want absolute best experience on each bundler
- Have resources to maintain multiple plugins
- Target advanced users who will configure correctly
