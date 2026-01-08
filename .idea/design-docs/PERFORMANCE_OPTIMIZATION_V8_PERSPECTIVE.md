# Performance Optimization: V8 Engine Perspective

**Author**: V8 Core Team Analysis
**Date**: 2026-01-08
**Status**: Research & Prototype Phase

> [!note]
> Benchmark reference: `docs/BENCHMARK_SCALING_CHART.md`

---

## Executive Summary

This document analyzes flesh-cage's current architecture from a browser engine perspective (V8, Blink, Chromium) and proposes batching/pooling optimizations that maintain Shadow DOM encapsulation while significantly reducing resource consumption.

**Key Finding**: Current implementation performs work individually per component instance.
Batching operations across instances can reduce coordination overhead, but **does not remove**
the dominant costs of shadow root creation, stylesheet adoption, and allocation pressure.

> [!warning]
> The "~90%" claim for style adoption is not supported by current benchmarks. Browser
> style recalculation is already batched at paint time. Expect smaller wins focused on
> microtask and cache behavior.

---

## Current Architecture Analysis

### Data Flow

```
Provider (skin="dark")
    ↓ (React Context)
useContext() → skin="dark"
    ↓ (useLayoutEffect)
dispatchEvent(CustomEvent('change'))
    ↓ (DOM event)
CustomElement.change() handler
    ↓
adorn(skin)
    ↓
sheets.get(skin) → Promise<CSSStyleSheet>
    ↓
adoptedStyleSheets = [sheet]
```

### Performance Characteristics

#### Mount Storm Scenario (100 instances mount simultaneously)

**Current Behavior:**

```
Frame N:
  - React commit phase starts
  - useLayoutEffect runs for instance 1
    → dispatchEvent (allocates CustomEvent)
    → change handler fires
    → adorn() called
    → Promise.then queued
  - useLayoutEffect runs for instance 2
    → dispatchEvent (allocates CustomEvent)
    → change handler fires
    → adorn() called
    → Promise.then queued
  ... (repeat 98 more times)

Microtask queue:
  - 100 Promise.then callbacks waiting
  - Each will assign adoptedStyleSheets individually

Next microtask checkpoint:
  - All 100 assignments execute
  - Browser calculates style 100 times (?)
  - Actually: style calc happens once at paint (deferred)

Paint:
  - Style recalculation for all shadow roots
  - Layout
  - Paint
  - Composite
```

**Resource Consumption:**

- 100 CustomEvent allocations (V8 new space)
- 100 event dispatches (Blink event system)
- 100 Promise.then callbacks
- 100 AbortController allocations
- 100 individual adoptedStyleSheets assignments

**Browser Optimization:**
The browser DOES batch style recalculation - it only happens at paint, not per assignment. However, we're still doing unnecessary JS work.

---

## Browser Engine Internals

### V8 Memory Model

**DOM Wrapper Objects:**

```
CustomElement instance:
  ┌─────────────────────────────────┐
  │ V8 Wrapper (JavaScript side)    │
  │ - size: ~48 bytes (base)        │
  │ - properties: closures, refs    │
  └─────────────────────────────────┘
           ↓ ↑
  ┌─────────────────────────────────┐
  │ Blink C++ Object (native side)  │
  │ - size: varies (shadow root etc)│
  │ - owns: ShadowRoot, attrs       │
  └─────────────────────────────────┘
```

**Allocation Costs:**

- CustomEvent: ~120 bytes (V8) + Blink event overhead
- AbortController: ~80 bytes + AbortSignal (~60 bytes)
- Closures: 40-80 bytes each (captures context)

**GC Behavior:**

- Objects allocated in "new space" (1-8 MB)
- Short-lived objects cleaned up in minor GC (fast)
- BUT: allocation still has cost (pointer bumping, write barriers)

### Blink Style System

**adoptedStyleSheets Assignment:**

```cpp
// Simplified Blink internals
void ShadowRoot::setAdoptedStyleSheets(const StyleSheetList& sheets) {
  // 1. Clear existing adopted sheets
  adopted_style_sheets_.clear();

  // 2. Add new sheets
  for (auto& sheet : sheets) {
    adopted_style_sheets_.push_back(sheet);
  }

  // 3. Invalidate style
  this->SetNeedsStyleRecalc();
  // (actual recalc happens later during rendering)
}
```

**Key Insights:**

- Assignment is cheap (pointer manipulation)
- Style recalculation is deferred until paint
- Multiple assignments in same frame → one recalc
- **BUT**: Each assignment still invalidates, does bounds checks, etc.

### Custom Event Dispatch

**Event Propagation Cost:**

```cpp
// Simplified event dispatch
void EventTarget::dispatchEvent(Event* event) {
  // 1. Build event path (can cross shadow boundaries)
  BuildEventPath(event);

  // 2. Capture phase
  for (auto& target : capture_path) {
    InvokeEventListener(target, event);
  }

  // 3. Target phase
  InvokeEventListener(this, event);

  // 4. Bubble phase (if bubbles=true)
  for (auto& target : bubble_path) {
    InvokeEventListener(target, event);
  }
}
```

**Cost Analysis:**

- Path building: O(depth) tree traversal
- Listener invocation: Function call overhead
- Event object allocation: Heap allocation + GC pressure
- **For internal coordination**: MASSIVE OVERKILL

---

## Optimization Strategies

### Strategy 1: Global Style Adoption Scheduler

**Concept**: Batch all `adoptedStyleSheets` assignments into single microtask

```typescript
// Global singleton scheduler
class StyleAdoptionScheduler {
  private pending = new Map<ShadowRoot, CSSStyleSheet>()
  private scheduled = false

  schedule(shadowRoot: ShadowRoot, sheet: CSSStyleSheet) {
    this.pending.set(shadowRoot, sheet)

    if (!this.scheduled) {
      this.scheduled = true
      queueMicrotask(() => this.flush())
    }
  }

  private flush() {
    // Batch all adoptions in single synchronous pass
    for (const [root, sheet] of this.pending) {
      root.adoptedStyleSheets = [sheet]
    }

    this.pending.clear()
    this.scheduled = false

    // Browser style recalc happens once at next paint
  }
}

const globalScheduler = new StyleAdoptionScheduler()
```

**Benefits:**

- 100 schedule() calls → 1 flush() execution
- All adoptions happen in tight loop (better CPU cache locality)
- Reduces microtask queue pressure
- Still maintains per-element sheet isolation

**Integration:**

```typescript
// In CustomElement
adorn = (skin: string) => {
  // ... validation ...
  return sheets.get(skin).then((sheet) => {
    this.controller.signal.throwIfAborted()
    globalScheduler.schedule(this.shadow, sheet)
    return this.shadow
  })
}
```

**Performance Impact:**

- Before: 100 microtasks, 100 adoptedStyleSheets assignments scattered
- After: 1 microtask, 100 adoptedStyleSheets assignments batched
- CPU cache: Better locality (tight loop)
- Memory: Reduces microtask overhead

---

### Strategy 2: Direct Attribute Manipulation (Eliminate Events)

**Concept**: Skip CustomEvent entirely, use direct attribute manipulation

```typescript
// In useCore
useLayoutEffect(() => {
  const element = ref.current as HTMLElement

  // Direct attribute manipulation triggers attributeChangedCallback
  // No CustomEvent allocation, no dispatch overhead
  element.setAttribute('skin', skin)
}, [skin])
```

**Why This Works:**

- Custom elements observe 'skin' via `observedAttributes`
- Browser calls `attributeChangedCallback` synchronously
- No event allocation, no dispatch overhead
- Same end result, less work

**Current vs Optimized:**

```typescript
// CURRENT (line 35 in use-core.ts)
element.dispatchEvent(new CustomEvent('change', { detail: { skin } }))
// ↓
// CustomElement.change() handler
// ↓
// Reads: getAttribute('skin') ?? detail.skin

// OPTIMIZED
element.setAttribute('skin', skin)
// ↓
// CustomElement.attributeChangedCallback('skin', oldValue, newValue)
// ↓
// Direct access to new value
```

**Code Changes:**

```typescript
// CustomElement.attributeChangedCallback already exists
attributeChangedCallback(
  name: 'skin',
  _: string,
  skin: string
) {
  switch (true) {
    case name.trim().toLowerCase() === 'skin':
      return this.suspend(this.adorn(skin));
  }
}

// Remove the 'change' event handler entirely
// Remove addEventListener in connectedCallback
// Remove removeEventListener in disconnectedCallback
```

**Performance Impact:**

- Eliminates: CustomEvent allocation (~120 bytes × 100 = 12 KB)
- Eliminates: Event dispatch overhead
- Eliminates: Event handler registration/cleanup
- Uses native browser path (attribute observation)

> [!note]
> In large-tree benchmarks (5k+ elements), event dispatch contributes a small but measurable
> fraction of CPU time. The main bottleneck remains GC and allocation churn.

---

### Strategy 3: Stylesheet Prefetching via Provider

**Concept**: When Provider skin changes, prefetch stylesheet before children render

```typescript
export const Provider: FC<ProviderProps> = ({ skin, children }) => {
  // Prefetch stylesheet when skin changes
  useLayoutEffect(() => {
    // Assumes global registry of all Sheets instances
    globalSheetRegistry.prefetch(skin);
  }, [skin]);

  return <Context.Provider value={skin}>{children}</Context.Provider>
}
```

**Global Sheet Registry:**

```typescript
class GlobalSheetRegistry {
  private registeredSheets = new Set<Sheets<any>>()

  register(sheets: Sheets<any>) {
    this.registeredSheets.add(sheets)
  }

  async prefetch(skin: string) {
    // Load all matching skins in parallel
    const promises = Array.from(this.registeredSheets)
      .filter((sheets) => sheets.validate(skin))
      .map((sheets) => sheets.get(skin))

    await Promise.all(promises)
    // Sheets are now cached, synchronous access for children
  }
}

const globalSheetRegistry = new GlobalSheetRegistry()
```

**Benefits:**

- Eliminates async waterfall when Provider skin changes
- Children can synchronously adopt (sheet already loaded)
- Reduces time-to-interactive after theme switch

**Trade-off:**

- Loads sheets that might not be used (if no instances exist)
- Can mitigate with usage tracking

---

### Strategy 4: AbortController Pooling

**Concept**: Reuse AbortController instances instead of allocating new ones

```typescript
class AbortControllerPool {
  private pool: AbortController[] = []
  private maxPoolSize = 50

  acquire(): AbortController {
    return this.pool.pop() || new AbortController()
  }

  release(controller: AbortController) {
    if (this.pool.length < this.maxPoolSize) {
      // Can't actually reset AbortController, so this doesn't work
      // Would need custom implementation
    }
  }
}
```

**Problem:** AbortController cannot be reset once aborted

> [!warning]
> A custom abortable is a semantic deviation from web standards. Treat this as optional
> and only adopt if profiling shows AbortController allocations as a hotspot.

**Alternative: Custom Abortable**

```typescript
class AbortableOperation {
  private aborted = false

  abort() {
    this.aborted = true
  }

  get signal() {
    return {
      get aborted() {
        return this.aborted
      },
      throwIfAborted: () => {
        if (this.aborted) throw new DOMException('Aborted', 'AbortError')
      },
    }
  }

  reset() {
    this.aborted = false
  }
}

class AbortablePool {
  private pool: AbortableOperation[] = []

  acquire(): AbortableOperation {
    const op = this.pool.pop() || new AbortableOperation()
    op.reset()
    return op
  }

  release(op: AbortableOperation) {
    this.pool.push(op)
  }
}
```

**Benefits:**

- Reduces allocation pressure
- Eliminates GC overhead for short-lived controllers
- Custom implementation can be more lightweight

**Trade-off:**

- Non-standard AbortController API
- Need to ensure proper reset semantics

---

### Strategy 5: Microtask Batching for Skin Changes

**Concept**: Batch multiple skin changes in same microtask

```typescript
class SkinUpdateBatcher {
  private pending = new Map<HTMLElement, string>()
  private scheduled = false

  schedule(element: HTMLElement, skin: string) {
    this.pending.set(element, skin)

    if (!this.scheduled) {
      this.scheduled = true
      queueMicrotask(() => this.flush())
    }
  }

  private flush() {
    // Batch all skin attribute updates
    for (const [element, skin] of this.pending) {
      element.setAttribute('skin', skin)
    }

    this.pending.clear()
    this.scheduled = false
  }
}

const skinBatcher = new SkinUpdateBatcher()

// In useCore
useLayoutEffect(() => {
  skinBatcher.schedule(ref.current!, skin)
}, [skin])
```

**Benefits:**

- Multiple skin changes → single batch
- Reduces attributeChangedCallback invocations
- Better CPU cache locality

**When This Helps:**

- Rapid skin switching (theme toggle spam)
- Multiple Provider nesting changes simultaneously
- Programmatic skin changes in tight loops

---

## Advanced: Request Animation Frame Integration

### Use RAF for Visual Updates

**Concept**: Defer style adoptions to RAF for smoother animations

```typescript
class RAFStyleScheduler {
  private pending = new Map<ShadowRoot, CSSStyleSheet>()
  private rafId: number | null = null

  schedule(shadowRoot: ShadowRoot, sheet: CSSStyleSheet) {
    this.pending.set(shadowRoot, sheet)

    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => this.flush())
    }
  }

  private flush() {
    for (const [root, sheet] of this.pending) {
      root.adoptedStyleSheets = [sheet]
    }

    this.pending.clear()
    this.rafId = null
  }
}
```

**Benefits:**

- Synchronizes updates with display refresh
- Prevents flashing (all changes in same frame)
- Better for animations/transitions

**Trade-offs:**

- Adds one frame latency (16.67ms at 60fps)
- Not suitable for immediate feedback scenarios

**When to Use:**

- Theme switching animations
- Non-critical style updates
- Background skin preloading

---

## Memory Layout Optimizations

### Shared Closure Context

**Current Issue:** Each CustomElement instance creates separate closures

```typescript
class CustomElement extends HTMLElement {
  adorn = (skin: string) => {
    /* closure captures 'this' */
  }
  change = (event: Event) => {
    /* closure captures 'this' */
  }
  suspend = (promise: Promise<unknown>) => {
    /* closure captures 'this' */
  }
  resume = () => {
    /* closure captures 'this' */
  }
}
```

**Each instance:** 4 closures × ~60 bytes = 240 bytes overhead

**Optimization:** Use prototype methods

```typescript
class CustomElement extends HTMLElement {
  // Prototype methods (shared across all instances)
  adorn(skin: string) { /* uses 'this' normally */ }
  change(event: Event) { /* uses 'this' normally */ }
  suspend(promise: Promise<unknown>) { /* uses 'this' normally */ }
  resume() { /* uses 'this' normally */ }
}

// Bind in connectedCallback
connectedCallback() {
  this.addEventListener('change', this.change.bind(this));
}
```

**Wait, this creates new bound function!**

**Better: Use event listener object**

```typescript
connectedCallback() {
  this.addEventListener('change', this);
}

// Implement handleEvent
handleEvent(event: Event) {
  if (event.type === 'change') {
    this.change(event);
  }
}
```

**Savings:**

- Eliminates closure allocations
- Uses prototype chain (shared methods)
- ~200 bytes per instance saved

---

## DocumentFragment Optimization

### Current Implementation

```typescript
// use-core.ts lines 9-10
const [container, attach] = useState<DocumentFragment | ShadowRoot>(
  document.createDocumentFragment()
)
```

**This is good!** Initial render happens off-screen.

**Potential Enhancement:** Reuse DocumentFragment across instances

```typescript
class FragmentPool {
  private pool: DocumentFragment[] = []

  acquire(): DocumentFragment {
    return this.pool.pop() || document.createDocumentFragment()
  }

  release(fragment: DocumentFragment) {
    // Clear children
    while (fragment.firstChild) {
      fragment.removeChild(fragment.firstChild)
    }
    this.pool.push(fragment)
  }
}
```

**Benefits:**

- Reduces DocumentFragment allocations
- Fragments are lightweight but still have overhead

**Trade-off:**

- Clearing children has cost
- Pooling benefit is marginal (fragments are cheap)

**Verdict:** Probably not worth it for DocumentFragment specifically.

---

## Recommended Implementation Priority

### Phase 1: Low-Hanging Fruit (Immediate Wins)

1. **Eliminate CustomEvent** (Strategy 2)
   - Use `setAttribute('skin', skin)` directly
   - Remove event listener overhead
   - Estimated impact: -12KB allocation per 100 instances, -5% CPU

2. **Global Style Adoption Scheduler** (Strategy 1)
   - Batch adoptedStyleSheets assignments
   - Estimated impact: -30% microtask overhead

### Phase 2: Medium Effort (Significant Gains)

3. **Prototype Methods** (Memory Layout)
   - Replace arrow functions with prototype methods
   - Estimated impact: -200 bytes per instance

4. **Stylesheet Prefetching** (Strategy 3)
   - Prefetch on Provider skin change
   - Estimated impact: -80% time-to-interactive on theme switch

### Phase 3: Advanced (Diminishing Returns)

5. **Custom Abortable Pooling** (Strategy 4)
   - Only if profiling shows AbortController as hotspot

6. **RAF Scheduler** (Advanced)
   - For animation-heavy scenarios

---

## Benchmarking Strategy

### Metrics to Track

1. **Mount Storm (100 instances)**
   - Time to interactive
   - Total JS heap allocated
   - Peak microtask queue depth
   - Style recalculation time

2. **Theme Switch (100 instances)**
   - Time from skin change to paint
   - Number of microtasks queued
   - Memory allocated during transition

3. **Rapid Toggle (spam theme switch)**
   - Dropped frames
   - Main thread blocking
   - GC pressure

### Profiling Tools

```javascript
// Chrome DevTools Performance API
performance.mark('mount-start')
// ... mount 100 instances ...
performance.mark('mount-end')
performance.measure('mount-100', 'mount-start', 'mount-end')

// Memory pressure
if (performance.memory) {
  console.log('Heap:', performance.memory.usedJSHeapSize)
}

// User Timing
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(entry.name, entry.duration)
  }
})
observer.observe({ entryTypes: ['measure'] })
```

---

## Prototype Code

I'll create a prototype implementation in next section with full working code.

---

## Conclusion

From a V8 engine perspective, the biggest wins come from:

1. **Batching** - Amortize overhead across multiple instances
2. **Eliminating Allocations** - Reduce GC pressure
3. **Using Native Paths** - Attributes over events
4. **Prefetching** - Eliminate async waterfalls

The current implementation is already quite good (uses adoptedStyleSheets, Shadow DOM, microtasks). These optimizations are about going from "good" to "excellent" for high-instance scenarios (100+ components).

**Key Principle:** Do more with less by coordinating work across instances while maintaining encapsulation guarantees.
