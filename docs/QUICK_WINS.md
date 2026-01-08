# Quick Performance Wins

This document outlines **immediate, low-risk optimizations** that can improve flesh-cage's mount performance without major architectural changes.

## 1. Prevent Double Custom Element Registration

**Impact**: Prevents errors and unnecessary work
**Effort**: 5 minutes
**Risk**: None

### Current Issue

```typescript
// styled.tsx:103
customElements.define(name, CustomElement)
```

This throws an error if `styled()` is called twice with the same name (e.g., during hot module reload).

### Solution

```typescript
// Check if already registered
if (!customElements.get(name)) {
  customElements.define(name, CustomElement)
}
```

### Implementation

**File**: `packages/flesh-cage/src/core/styled.tsx`

```diff
  const Styled = (props: Props) => {
    const { container, ...core } = useCore({ suspendable })

    return createElement(
      name,
      { ...attributes, ...core },
      createPortal(<Component {...props} />, container)
    )
  }

- customElements.define(name, CustomElement)
+ if (!customElements.get(name)) {
+   customElements.define(name, CustomElement)
+ }

  return Styled
}
```

### Benefits

- ✅ Enables hot module reload
- ✅ Prevents "already defined" errors
- ✅ Allows styled() to be called multiple times safely
- ✅ Zero performance cost

---

## 2. Add Stylesheet Pre-warming API

**Impact**: Reduces first-render latency
**Effort**: 30 minutes
**Risk**: Low

### Problem

Skins are loaded async when first used, creating a waterfall:

1. Component mounts
2. Skin requested
3. Skin loaded
4. Styles applied

### Solution

Add a `warmup()` method to preload skins before mount:

```typescript
// Load skins before rendering
await Button.warmup(['primary', 'secondary', 'danger'])

// Now first render is instant
<Button skin="primary">Click me</Button>
```

### Implementation

**File**: `packages/flesh-cage/src/core/styled.tsx`

```typescript
export const styled = <
  Props extends PropsWithChildren,
  Names extends string = string,
>(
  Component: ComponentType<Props>,
  { suspendable = false, name, skins, ...attributes }: StyledConfig<Names>
): ComponentType<Props> & {
  warmup: (skinNames: Names[]) => Promise<CSSStyleSheet[]>
} => {
  const sheets = new Sheets({ skins })

  // ... CustomElement definition ...

  const Styled = (props: Props) => {
    // ... existing code ...
  }

  // Add warmup method
  Styled.warmup = (skinNames: Names[]) => {
    return Promise.all(skinNames.map((skin) => sheets.get(skin)))
  }

  if (!customElements.get(name)) {
    customElements.define(name, CustomElement)
  }

  return Styled
}
```

### Usage

```typescript
import { Button } from './components'

// In app initialization
await Promise.all([
  Button.warmup(['primary', 'secondary']),
  Input.warmup(['default', 'error']),
  Modal.warmup(['light', 'dark']),
])

// Now first renders are fast
function App() {
  return <Button skin="primary">Hello</Button>
}
```

### Benefits

- ✅ Eliminates async delay on first render
- ✅ Useful for SSR/SSG scenarios
- ✅ Enables prefetching critical skins
- ✅ Optional - doesn't break existing code

---

## 3. Batch adoptedStyleSheets Updates

**Impact**: Reduces layout thrashing
**Effort**: 15 minutes
**Risk**: Low

### Problem

Currently, `adoptedStyleSheets` is updated synchronously:

```typescript
// styled.tsx:39
Object.assign(this.shadow, { adoptedStyleSheets: [sheet] })
```

If multiple components update skins simultaneously, this causes multiple reflows.

### Solution

Batch updates using `requestAnimationFrame`:

```typescript
class CustomElement extends HTMLElement {
  #pendingSheet: CSSStyleSheet | null = null
  #rafId: number | null = null

  adorn = (skin: string) => {
    // ... existing validation and sheet loading ...

    return sheets
      .get(skin)
      .then((sheet) => {
        next.signal.throwIfAborted()

        // Batch the update
        this.#pendingSheet = sheet
        if (!this.#rafId) {
          this.#rafId = requestAnimationFrame(() => {
            if (this.#pendingSheet) {
              this.shadow.adoptedStyleSheets = [this.#pendingSheet]
              this.#pendingSheet = null
            }
            this.#rafId = null
          })
        }

        return this.shadow
      })
      .catch(verify)
  }

  disconnectedCallback() {
    if (this.#rafId) {
      cancelAnimationFrame(this.#rafId)
    }
    this.shadow.adoptedStyleSheets = []
    this.removeEventListener('change', this.change)
  }
}
```

### Benefits

- ✅ Reduces layout thrashing
- ✅ Better for rapid skin switching
- ✅ Batches multiple updates into single frame

### Trade-offs

- ⚠️ Adds one frame of delay
- ⚠️ More complex lifecycle management

---

## 4. Share CSSStyleSheet Instances (Already Optimal!)

**Status**: ✅ Already implemented correctly

The `Sheets` class already caches and shares `CSSStyleSheet` instances:

```typescript
// sheets.ts:18-19
override get(skin: Names): CSSStyleSheet | Promise<CSSStyleSheet> {
  return super.get(skin) || this.load(skin)
}
```

This means:

- ✅ One CSSStyleSheet instance per skin (not per component)
- ✅ Shared across all shadow roots
- ✅ Cached for lifetime of the styled component

**No action needed** - this is already optimal!

---

## 5. Lazy Shadow DOM (Experimental)

**Impact**: Could significantly improve mount
**Effort**: High
**Risk**: High

### Concept

Delay `attachShadow()` until styles are actually needed:

```typescript
class CustomElement extends HTMLElement {
  #shadow: ShadowRoot | null = null

  get shadow(): ShadowRoot {
    if (!this.#shadow) {
      this.#shadow = this.attachShadow({ mode: 'open' })
    }
    return this.#shadow
  }

  // Only creates shadow when adorn() is called
  adorn = (skin: string) => {
    // This triggers shadow creation via getter
    const { shadow } = this
    // ...
  }
}
```

### Benefits

- ✅ Defers expensive Shadow DOM creation
- ✅ Only creates when needed

### Risks

- ⚠️ May cause layout shifts
- ⚠️ Timing issues with React Portal
- ⚠️ Against Web Components best practices
- ⚠️ Requires extensive testing

**Recommendation**: Test in a branch before committing

---

## Implementation Priority

### Do First (Low-Hanging Fruit)

1. ✅ **Registration check** - 5 minutes, zero risk
2. ✅ **Warmup API** - 30 minutes, high value for SSR

### Do Second (Proven Techniques)

3. ⏸️ **Batch updates** - Test impact first
4. ⏸️ **AbortController pooling** - Measure GC pressure first

### Experiment Later (High Risk)

5. 🧪 **Lazy Shadow DOM** - Needs thorough testing
6. 🧪 **Hybrid mode** - Major architectural change

---

## Expected Impact

### Before Optimizations

- Mount: ~14.48ms (2-3x slower than competitors)

### After Quick Wins (#1 + #2)

- Mount (cold): ~14.48ms (first time, unchanged)
- Mount (warm): ~8-10ms (skins preloaded, 30-40% faster)
- HMR: Works without errors

### After All Optimizations (#1-4)

- Mount (warm): ~6-8ms (batching + warmup, 40-50% faster)
- Still ~1.5-2x slower than competitors (Shadow DOM overhead)

---

## Benchmarking Changes

After implementing optimizations, re-run benchmarks:

```bash
cd packages/benchmarks
npm run build
npm run benchmark
```

Compare results in `docs/BENCHMARK_RESULTS.md`

---

## Conclusion

The **2-3x mount overhead** is primarily due to Shadow DOM creation, which is the core feature. Quick wins can improve performance by 30-50%, but we'll never match libraries that don't use Shadow DOM.

**The question isn't "how to be as fast as emotion"** - it's **"is the isolation worth the overhead?"**

For many apps, the answer is yes:

- Prevents style conflicts
- True component isolation
- Predictable styling
- Worth 5-10ms extra on mount
