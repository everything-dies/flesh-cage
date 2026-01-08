# Performance Optimization Strategies

## Current Mount Performance Analysis

Based on benchmark results, flesh-cage is **2-3x slower** on mount operations compared to styled-components and emotion:

- **flesh-cage**: ~14.48ms ± 6.85ms
- **styled-components**: ~4.80ms ± 1.48ms
- **emotion**: ~4.76ms ± 0.92ms

## Root Causes

### 1. Shadow DOM Creation Overhead

```typescript
// In CustomElement constructor (styled.tsx:30)
shadow = this.attachShadow({ mode: 'open' })
```

- Shadow DOM creation is ~2-3x more expensive than regular DOM
- Happens synchronously for every component instance
- Cannot be avoided if we want style isolation

### 2. Custom Element Registration

```typescript
// styled.tsx:103
customElements.define(name, CustomElement)
```

- Currently happens every time `styled()` is called
- Could error if same element name registered twice
- No check for existing registration

### 3. Portal Creation

```typescript
createPortal(<Component {...props} />, container)
```

- Adds React reconciliation overhead
- Required to render children into shadow root

### 4. AbortController Churn

```typescript
adorn = (skin: string) => {
  const { controller: previous } = this
  const next = (this.controller = new AbortController())
  // ...
}
```

- New AbortController created on every skin change
- Previous controller aborted (GC pressure)

### 5. Stylesheet Adoption

```typescript
Object.assign(this.shadow, { adoptedStyleSheets: [sheet] })
```

- Already optimal - CSSStyleSheet instances are shared/cached
- adoptedStyleSheets API is designed for this pattern

## Optimization Strategies

### 🟢 High Impact, Low Risk

#### 1. Prevent Double Registration

**Impact**: Eliminates errors and unnecessary work
**Effort**: Low

```typescript
// Before: Always define
customElements.define(name, CustomElement)

// After: Check first
if (!customElements.get(name)) {
  customElements.define(name, CustomElement)
}
```

**Benefits**:

- Allows styled() to be called multiple times safely
- Reduces registration overhead
- Enables HMR scenarios

#### 2. Stylesheet Pre-warming

**Impact**: Reduces first-render latency
**Effort**: Low

```typescript
// New API to preload skins
const warmup = async (skins: string[]) => {
  await Promise.all(skins.map((skin) => sheets.get(skin)))
}

// Usage
await Button.warmup(['primary', 'secondary', 'danger'])
```

**Benefits**:

- Stylesheets loaded before mount
- Reduces async waterfall during initial render
- Especially useful for server-side rendering

#### 3. Batch adoptedStyleSheets Updates

**Impact**: Reduces reflow/repaint cycles
**Effort**: Medium

```typescript
// Instead of updating immediately, batch updates
requestAnimationFrame(() => {
  this.shadow.adoptedStyleSheets = [sheet]
})
```

**Benefits**:

- Multiple style updates batched into single frame
- Reduces layout thrashing
- Better for rapid skin switching

### 🟡 Medium Impact, Medium Risk

#### 4. AbortController Pooling

**Impact**: Reduces GC pressure
**Effort**: Medium

```typescript
// Pool of reusable AbortControllers
class ControllerPool {
  private pool: AbortController[] = []

  acquire(): AbortController {
    return this.pool.pop() || new AbortController()
  }

  release(controller: AbortController) {
    if (!controller.signal.aborted) {
      this.pool.push(controller)
    }
  }
}
```

**Benefits**:

- Reduces object allocation
- Less GC pressure
- Faster skin switching

**Risks**:

- More complex lifecycle management
- Potential memory leaks if not careful

#### 5. Lazy Shadow DOM (Experimental)

**Impact**: Could significantly improve mount
**Effort**: High

```typescript
class CustomElement extends HTMLElement {
  #shadow: ShadowRoot | null = null

  get shadow() {
    if (!this.#shadow) {
      this.#shadow = this.attachShadow({ mode: 'open' })
    }
    return this.#shadow
  }
}
```

**Benefits**:

- Defers expensive Shadow DOM creation
- Only creates when styles are actually applied

**Risks**:

- May cause layout shifts
- Timing issues with React rendering
- Against Web Components best practices

### 🔴 High Impact, High Risk

#### 6. Hybrid Mode (Light DOM Fallback)

**Impact**: Could match competitors' performance
**Effort**: Very High

```typescript
styled('button', {
  mode: 'shadow', // or 'light'
  // ...
})
```

**Benefits**:

- Light DOM mode bypasses Shadow DOM overhead
- Could match styled-components performance
- User chooses isolation vs performance

**Risks**:

- Breaks core isolation promise
- Style leakage in light mode
- Two code paths to maintain

#### 7. Virtual Shadow DOM

**Impact**: Potentially revolutionary
**Effort**: Very High

Concept: Delay actual Shadow DOM creation until after initial paint

```typescript
// Render to virtual shadow first
// Hydrate to real Shadow DOM after paint
requestIdleCallback(() => {
  actuallyCreateShadowDOM()
})
```

**Benefits**:

- Fast initial render
- Full isolation eventually

**Risks**:

- Complex implementation
- May cause FOUC (Flash of Unstyled Content)
- Requires significant architecture changes

## Recommended Immediate Actions

1. **Add registration check** - Quick win, zero risk
2. **Implement warmup API** - Helps with initial load
3. **Profile with DevTools** - Identify actual bottlenecks in real usage
4. **Create stress tests** - Understand limits before optimizing

## Long-term Considerations

### Accept the Trade-off

Shadow DOM isolation **is** the feature. The 2-3x overhead might be acceptable because:

- Real-world apps rarely mount 1000s of components at once
- Update performance is competitive (where it matters more)
- Style isolation prevents entire classes of bugs
- The cost is predictable and bounded

### When It Matters

Mount performance is critical for:

- Initial page load
- Large lists (virtualize instead)
- Modals with many components
- Data tables

### When It Doesn't Matter

- Incremental rendering
- Long-lived UIs
- Applications with < 100 components per route

## Stress Testing Strategy

See `packages/benchmarks/src/cases/StressTests.tsx` for:

- **Massive mount**: 10,000+ components
- **Deep nesting**: 500+ levels
- **Rapid cycles**: Mount/unmount in tight loops
- **Memory profiling**: Detect leaks
- **Browser limits**: Find breaking points
