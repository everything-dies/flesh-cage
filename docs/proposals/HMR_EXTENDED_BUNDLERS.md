# Extended Bundler Ecosystem Analysis for HMR

## Complete Bundler Landscape (2025-2026)

### Tier 1: Must Support (90%+ of users)

#### 1. Vite

- **Market Share:** ~60-70% of new projects
- **HMR API:** `import.meta.hot` (native)
- **Support Priority:** ⭐⭐⭐ **CRITICAL**

#### 2. Webpack

- **Market Share:** ~20-25% (legacy projects, enterprise)
- **HMR API:** `module.hot`
- **Support Priority:** ⭐⭐⭐ **HIGH**

#### 3. Turbopack (Next.js 13+)

- **Market Share:** Growing rapidly (~5-10% and rising)
- **HMR API:** Webpack-compatible `module.hot`
- **Support Priority:** ⭐⭐⭐ **HIGH**
- **Special Notes:**
  - Used by Next.js 13+ (--turbo flag)
  - Webpack API compatible for smooth migration
  - Fast Refresh built-in for React
  - Still in beta but production-ready in Next.js

```typescript
// Turbopack HMR (Webpack-compatible)
if (module.hot) {
  module.hot.accept('./skin.ts', () => {
    // Same as Webpack
  })
}
```

### Tier 2: Should Support (5-10% of users)

#### 4. Rspack

- **Market Share:** ~2-5% and growing
- **HMR API:** Webpack-compatible `module.hot`
- **Support Priority:** ⭐⭐ **MEDIUM**
- **Special Notes:**
  - Rust-based Webpack alternative from ByteDance
  - Drop-in Webpack replacement (mostly)
  - 5-10x faster than Webpack
  - Used by Rsbuild, Modern.js

```typescript
// Rspack HMR (Webpack API compatible)
if (module.hot) {
  module.hot.accept()
  // Same API as Webpack
}
```

#### 5. Parcel

- **Market Share:** ~3-5%
- **HMR API:** `module.hot` (Webpack subset)
- **Support Priority:** ⭐⭐ **MEDIUM**

#### 6. Rollup (with plugins)

- **Market Share:** ~5-10% (mostly for libraries)
- **HMR API:** Plugin-dependent, often `import.meta.hot`
- **Support Priority:** ⭐⭐ **MEDIUM (for library dev)**
- **Special Notes:**
  - Not typically used for apps (no HMR by default)
  - Used with dev servers like WMR, Vite (uses Rollup internally)
  - Plugins: `rollup-plugin-hot`, `@rollup/plugin-hot`

```typescript
// Rollup with rollup-plugin-hot
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    // Similar to Vite (depends on plugin)
  })
}
```

### Tier 3: Nice to Have (1-5% of users)

#### 7. esbuild

- **Market Share:** ~3-5% (often behind other tools)
- **HMR API:** ⚠️ **NO NATIVE HMR**
- **Support Priority:** ⭐ **LOW**
- **Special Notes:**
  - Ultra-fast bundler but no built-in HMR
  - Used as transformer by other tools (Vite uses esbuild for TS/JSX)
  - HMR via plugins like `esbuild-plugin-livereload` (basic live reload only)
  - Users typically use esbuild through Vite, not directly

**Recommendation:** Don't explicitly support - let them use live reload

#### 8. Bun (bundler mode)

- **Market Share:** ~1-2%
- **HMR API:** `Bun.hot` (custom API)
- **Support Priority:** ⭐ **EXPERIMENTAL**
- **Special Notes:**
  - Bun's bundler is still young
  - Custom HMR API (not standardized)
  - Rapidly evolving

```typescript
// Bun HMR (experimental, may change)
if (typeof Bun !== 'undefined' && Bun.hot) {
  Bun.hot.accept((newModule) => {
    // Similar to import.meta.hot
  })
}
```

#### 9. Farm

- **Market Share:** <1%
- **HMR API:** `import.meta.hot` (Vite-compatible)
- **Support Priority:** ⭐ **LOW**
- **Special Notes:**
  - New Rust-based bundler
  - Vite-compatible API
  - Very fast but tiny market share
  - Will work if you support Vite

#### 10. WMR (Preact)

- **Market Share:** <1%
- **HMR API:** `import.meta.hot`
- **Support Priority:** ⭐ **LOW**
- **Special Notes:**
  - Preact-specific dev tool
  - Uses Rollup internally
  - Vite-like API
  - Mostly replaced by Vite in Preact ecosystem

### Tier 4: Legacy/Deprecated

#### 11. Snowpack

- **Status:** ⚠️ Deprecated (merged into Vite)
- **Support Priority:** ❌ **NONE**

#### 12. FuseBox

- **Status:** Mostly inactive
- **Support Priority:** ❌ **NONE**

#### 13. Rome/Biome

- **Status:** Toolchain (linter/formatter), not a bundler yet
- **Support Priority:** ❌ **NONE** (watch for future)

## Bundler API Families

After analyzing all bundlers, there are really only **3 API patterns:**

### Family A: `import.meta.hot` (Modern ESM)

- ✅ Vite
- ✅ Farm
- ✅ WMR
- ✅ Rollup (with plugins)
- ✅ Bun (as `Bun.hot` variant)

### Family B: `module.hot` (Webpack-style)

- ✅ Webpack
- ✅ Turbopack
- ✅ Rspack
- ✅ Parcel

### Family C: No HMR / Custom

- ❌ esbuild (none)
- ⚠️ Bun (custom but similar to A)

## Universal Detection Strategy (Extended)

```typescript
// packages/flesh-cage/src/hmr/detect.ts

export type BundlerType =
  | 'vite'
  | 'webpack'
  | 'turbopack'
  | 'rspack'
  | 'parcel'
  | 'rollup'
  | 'farm'
  | 'bun'
  | 'wmr'
  | 'unknown'
  | 'none'

export function detectBundler(): BundlerType {
  // Bun (check first as it's runtime-specific)
  if (typeof Bun !== 'undefined' && 'hot' in Bun) {
    return 'bun'
  }

  // import.meta.hot family
  if (typeof import.meta !== 'undefined' && import.meta.hot) {
    // Try to differentiate between Vite/Farm/WMR/Rollup
    // They all use same API, so detection is mostly informational

    if (import.meta.env?.VITE) {
      return 'vite'
    }

    if (import.meta.env?.FARM) {
      return 'farm'
    }

    // WMR has specific env var
    if (import.meta.env?.WMR) {
      return 'wmr'
    }

    // Default to 'vite' for import.meta.hot (most common)
    return 'vite'
  }

  // module.hot family
  if (typeof module !== 'undefined' && module.hot) {
    // Try to differentiate Webpack/Turbopack/Rspack/Parcel

    // Turbopack (Next.js sets process.turbopack)
    if (typeof process !== 'undefined' && process.env?.TURBOPACK) {
      return 'turbopack'
    }

    // Rspack (checks for specific global)
    if (
      typeof __webpack_require__ !== 'undefined' &&
      typeof __rspack_version__ !== 'undefined'
    ) {
      return 'rspack'
    }

    // Webpack (has more complete API)
    if (module.hot.status) {
      return 'webpack'
    }

    // Parcel (simpler API)
    return 'parcel'
  }

  // No HMR
  return 'none'
}

// Normalize into API families for easier handling
export function getHMRFamily(
  bundler: BundlerType
): 'esm' | 'commonjs' | 'custom' | 'none' {
  switch (bundler) {
    case 'vite':
    case 'farm':
    case 'wmr':
    case 'rollup':
      return 'esm'

    case 'webpack':
    case 'turbopack':
    case 'rspack':
    case 'parcel':
      return 'commonjs'

    case 'bun':
      return 'custom'

    default:
      return 'none'
  }
}
```

## Simplified Universal Adapter (Family-Based)

```typescript
// packages/flesh-cage/src/hmr/adapter.ts

export interface HMRAdapter {
  accept(callback: (newModule: any) => void): void
  dispose(callback: (data: any) => void): void
  invalidate(): void
  data: Record<string, any>
}

export function createHMRAdapter(): HMRAdapter | null {
  const bundler = detectBundler()
  const family = getHMRFamily(bundler)

  switch (family) {
    case 'esm':
      // Vite, Farm, WMR, Rollup
      return {
        accept: (cb) => import.meta.hot!.accept(cb),
        dispose: (cb) => import.meta.hot!.dispose(cb),
        invalidate: () => import.meta.hot!.invalidate(),
        data: import.meta.hot!.data || {},
      }

    case 'commonjs':
      // Webpack, Turbopack, Rspack, Parcel
      let data = {}
      return {
        accept: (cb) => {
          module.hot!.accept(() => {
            // For module.hot, callback doesn't get new module
            // Must re-import or use workaround
            cb(module) // module is updated after accept
          })
        },
        dispose: (cb) => {
          module.hot!.dispose((d) => {
            cb(d)
            data = d
          })
        },
        invalidate: () => {
          // Webpack/Turbopack/Rspack have decline
          if ('decline' in module.hot!) {
            module.hot!.decline()
          } else {
            // Parcel fallback
            window.location.reload()
          }
        },
        data,
      }

    case 'custom':
      // Bun
      return {
        accept: (cb) => Bun.hot!.accept(cb),
        dispose: (cb) => Bun.hot!.dispose?.(cb) || (() => {}),
        invalidate: () => Bun.hot!.invalidate?.() || window.location.reload(),
        data: Bun.hot!.data || {},
      }

    case 'none':
    default:
      return null
  }
}
```

## TypeScript Declarations (Extended)

```typescript
// packages/flesh-cage/src/types/hmr.d.ts

// Vite, Farm, WMR, Rollup
interface ImportMeta {
  hot?: {
    accept(cb?: (newModule: any) => void): void
    accept(deps: string[], cb: (modules: any[]) => void): void
    dispose(cb: (data: any) => void): void
    decline(): void
    invalidate(): void
    on(event: string, cb: (...args: any[]) => void): void
    data: any
  }

  env?: {
    VITE?: boolean
    FARM?: boolean
    WMR?: boolean
    [key: string]: any
  }
}

// Webpack, Turbopack, Rspack, Parcel
interface NodeModule {
  hot?: {
    accept(path?: string | string[], cb?: () => void): void
    decline(deps?: string | string[]): void
    dispose(cb: (data: any) => void): void
    addStatusHandler?(cb: (status: string) => void): void
    removeStatusHandler?(cb: (status: string) => void): void
    status?(): string
    data?: any
  }
}

// Bun
declare namespace Bun {
  export const hot: {
    accept(cb: (newModule: any) => void): void
    dispose?(cb: (data: any) => void): void
    invalidate?(): void
    data?: any
  }
}

// Webpack/Rspack specific
declare const __webpack_require__: any
declare const __rspack_version__: string | undefined

// Turbopack
interface Process {
  env?: {
    TURBOPACK?: boolean
    [key: string]: any
  }
}

declare const module: NodeModule | undefined
declare const process: Process | undefined
```

## Real-World Framework Integration

### Next.js (Turbopack/Webpack)

```typescript
// Next.js uses Webpack or Turbopack
// Both use module.hot API
// Fast Refresh handles React components automatically

if (module.hot) {
  module.hot.accept()
  // Your custom CSS updates here
}
```

### Remix (esbuild)

```typescript
// Remix uses esbuild - NO HMR for CSS-in-JS
// Use live reload or manual refresh
// Future: May adopt Vite mode
```

### Astro (Vite)

```typescript
// Astro uses Vite internally
if (import.meta.hot) {
  import.meta.hot.accept()
  // Works seamlessly
}
```

### SvelteKit (Vite)

```typescript
// SvelteKit uses Vite
if (import.meta.hot) {
  import.meta.hot.accept()
  // Works seamlessly
}
```

### Nuxt (Vite/Webpack)

```typescript
// Nuxt 3 uses Vite by default, Webpack optionally
// Support both APIs
```

### Qwik (Vite)

```typescript
// Qwik uses Vite
if (import.meta.hot) {
  import.meta.hot.accept()
}
```

## Market Share Summary (2026 Estimate)

```
Vite:                ████████████████████████████████████████ 60%
Webpack:             ████████████████                         24%
Turbopack:           ████                                      6%
Rspack:              ███                                       4%
Parcel:              ██                                        3%
Rollup (direct):     ██                                        2%
Bun:                 █                                         1%
Farm:                ▌                                        <1%
Other:               ▌                                        <1%
```

## Prioritized Support Strategy

### Phase 1: Core (Covers 90%)

1. ✅ Vite (`import.meta.hot`)
2. ✅ Webpack (`module.hot` with re-import)
3. ✅ Turbopack (same as Webpack)

### Phase 2: Extended (Covers 98%)

4. ✅ Rspack (same as Webpack)
5. ✅ Parcel (same as Webpack, simpler)
6. ✅ Rollup (same as Vite)

### Phase 3: Future (Covers 99%+)

7. ⚠️ Bun (monitor for stability)
8. ⚠️ Farm (auto-works if Vite compatible)

### Explicitly Not Supporting

- ❌ esbuild (no HMR capability)
- ❌ Snowpack (deprecated)
- ❌ FuseBox (inactive)

## Testing Matrix

```typescript
// package.json scripts
{
  "test:hmr:vite": "vitest --config test/hmr/vite.config.ts",
  "test:hmr:webpack": "jest --config test/hmr/webpack.config.js",
  "test:hmr:turbopack": "jest --config test/hmr/turbopack.config.js",
  "test:hmr:rspack": "jest --config test/hmr/rspack.config.js",
  "test:hmr:parcel": "parcel test test/hmr/parcel.test.ts",
  "test:hmr:all": "npm run test:hmr:vite && npm run test:hmr:webpack && ..."
}
```

## Documentation Template

````markdown
# HMR Support

Flesh Cage supports Hot Module Replacement (HMR) across all major bundlers:

## Fully Supported ✅

- **Vite** - Native support, zero configuration
- **Webpack** - Full support via adapter
- **Turbopack** (Next.js) - Full support via adapter
- **Rspack** - Full support via adapter
- **Parcel** - Basic support
- **Rollup** - Via plugins (rollup-plugin-hot)

## Experimental ⚠️

- **Bun** - Basic support (API still evolving)

## Not Supported ❌

- **esbuild** - No HMR capability (use live reload)

## Setup

### Vite (Zero Config)

```typescript
// Works automatically! No setup needed.
```

### Webpack/Turbopack/Rspack

```typescript
// Works automatically via universal adapter
// Optional: Install @flesh-cage/webpack-plugin for advanced features
```

### Other Bundlers

Check our [bundler compatibility guide](./docs/bundlers.md)
````

## Rollup-Specific Considerations

Since you specifically asked about Rollup:

### When Rollup is Used

1. **Library development** (your use case!)
2. **Via Vite** (Vite uses Rollup for production builds)
3. **With dev servers** (WMR, custom setups)

### Rollup HMR Plugins

#### Option 1: rollup-plugin-hot

```bash
npm install -D rollup-plugin-hot
```

```javascript
// rollup.config.js
import hot from 'rollup-plugin-hot'

export default {
  plugins: [
    hot({
      public: 'dist',
      inMemory: true,
    }),
  ],
}
```

Provides: `import.meta.hot` (Vite-compatible)

#### Option 2: @rollup/plugin-hot

```bash
npm install -D @rollup/plugin-hot
```

Similar API to rollup-plugin-hot

### Rollup Reality Check

**Important:** Most Rollup users don't use HMR because:

- Rollup is primarily for **building libraries**, not running dev servers
- App developers using Rollup typically use it through Vite
- Direct Rollup HMR setups are rare (<1% of Rollup users)

**Recommendation:** If you support Vite's `import.meta.hot`, you automatically support Rollup users who use compatible plugins. No extra work needed.

## Final Recommendation Matrix

| Bundler   | Support Level   | Implementation                  | Priority |
| --------- | --------------- | ------------------------------- | -------- |
| Vite      | ✅ Full         | Native `import.meta.hot`        | **P0**   |
| Webpack   | ✅ Full         | Universal adapter               | **P0**   |
| Turbopack | ✅ Full         | Universal adapter (Webpack API) | **P0**   |
| Rspack    | ✅ Full         | Universal adapter (Webpack API) | **P1**   |
| Parcel    | ⚠️ Basic        | Universal adapter (Webpack API) | **P1**   |
| Rollup    | ✅ Auto         | Works if Vite API supported     | **P2**   |
| Farm      | ✅ Auto         | Works if Vite API supported     | **P2**   |
| Bun       | ⚠️ Experimental | Custom adapter                  | **P3**   |
| esbuild   | ❌ None         | Document "not supported"        | **N/A**  |

## Action Items

1. **Implement universal adapter** covering ESM and CommonJS families
2. **Test on Vite + Webpack** (covers 84% of users)
3. **Add CI tests** for Turbopack and Rspack
4. **Document** which bundlers work and which don't
5. **Monitor** Bun and Farm but don't prioritize yet
6. **Ignore** esbuild (no HMR), Snowpack (dead)

**Bottom line:** By supporting just 2 API families (ESM and CommonJS), you cover 98%+ of bundler users. The ecosystem has consolidated more than it appears.
