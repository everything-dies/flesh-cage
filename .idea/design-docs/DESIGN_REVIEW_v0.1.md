# CSS-in-TS Library Design Review

**Version:** 0.1
**Date:** 2025-12-27
**Status:** Initial Analysis - Awaiting Feedback

---

## Executive Summary

This document analyzes the current PoC for a CSS-in-TS library using Web Components + Shadow DOM + Constructable Stylesheets, and proposes potential API directions for production use.

**Current State:** Working PoC with significant architectural decisions still open
**Goal:** Define 1-2 production-ready API candidates for prototyping
**Blocker:** Need to answer foundational questions about Web Components requirement, browser support, and SSR strategy

---

## 🔍 Current PoC Analysis

### Architecture Strengths

✅ **Performance-first approach**
- Constructable StyleSheets = fast style adoption
- Lazy-loaded skins via dynamic imports
- Centralized cache to avoid duplication

✅ **React integration**
- Portals + Suspense for async loading
- ErrorBoundary for graceful degradation

✅ **Type-safe skin validation**
- Runtime validation with TypeScript guards
- Const assertions for skin registry

### Critical Issues Found

🔴 **Correctness bugs:**
1. `attributeChangedCallback` logic broken - skips initial render when `current === null`
2. `CSSStyleSheet.replace()` returns Promise but not awaited
3. Race conditions on rapid skin changes (no abort mechanism)
4. Promise cache doesn't resolve to final CSSStyleSheet value

🟡 **Design gaps:**
1. No SSR story (will crash on server)
2. No HMR integration (requires full reload)
3. No CSP strategy (constructable sheets blocked in strict CSP)
4. Memory leaks in Sheets cache (no eviction)
5. Event model unclear (`suspend` events with Promise in detail)

⚠️ **DX concerns:**
1. `useCore()` hook is opaque (not shown in snippet)
2. Lazy component pattern is convoluted
3. No documented testing approach
4. Hard to debug (multiple layers of abstraction)

---

## 🎯 Recommended API Directions

After exploring 6+ distinct approaches, I recommend prototyping **two** in parallel:

### Primary: Progressive Enhancement (Hybrid)

**Philosophy:** Works without build tools, optimizes with optional plugin

```typescript
// Works day 1 (no plugin)
import { createShadowComponent } from '@my-lib/react'

export const Counter = createShadowComponent({
  name: 'counter',
  styles: {
    default: () => import('./counter.css?inline'),
    dark: () => import('./counter.dark.css?inline')
  },
  render: ({ count }) => <div>Count: {count}</div>
})

// Later: add plugin for optimization
// vite.config.ts
import { shadowOptimizer } from '@my-lib/vite-plugin'
export default { plugins: [shadowOptimizer()] }
```

**Why this wins:**
- ✅ Lowest barrier to entry
- ✅ Clear upgrade path (progressive enhancement)
- ✅ Supports small apps (no plugin) and large apps (with plugin)
- ✅ Easier to pivot if design changes

**Risks:**
- Maintaining two code paths (runtime vs. plugin-optimized)
- DX confusion about when plugin is needed
- Performance gap between modes may not justify plugin

### Alternative: Hook-Based (React-Only)

**Philosophy:** No Web Components, pure React + hooks

```typescript
import { useShadowStyles, ShadowRoot } from '@my-lib/react'

const styles = {
  default: () => import('./counter.css?inline'),
  dark: () => import('./counter.dark.css?inline')
}

export const Counter = ({ count }) => {
  const { shadowRef, skin, setSkin } = useShadowStyles(styles, 'default')

  return (
    <ShadowRoot ref={shadowRef}>
      <div>Count: {count}</div>
    </ShadowRoot>
  )
}
```

**Why validate this:**
- ✅ Simpler mental model (familiar React patterns)
- ✅ Better SSR story (render without shadow on server)
- ✅ Easier to test (shallow rendering works)
- ✅ **Tests assumption that Web Components are necessary**

**Risks:**
- No custom element lifecycle hooks
- Manual state management
- Less encapsulation (no `attributeChangedCallback`)

---

## ❓ Critical Unanswered Questions

These **must** be answered before committing to an API:

### 1. Web Components: Required or Optional?

**Impact:** Entire API surface
**Trade-offs:**
- **With WC:** Strong encapsulation, attribute-based API, lifecycle hooks
- **Without WC:** Better SSR, easier testing, simpler debugging

**Recommendation:** Prototype both, measure DX + testability differences

---

### 2. Browser Support Baseline

**Current PoC requires:**
- Constructable Stylesheets (Chrome 73+, Safari 16.4+, Firefox 101+)
- Eliminates ~5-10% of users (older Safari especially)

**Options:**
- A) Accept baseline, document clearly
- B) Build polyfill (complexity + perf cost)
- C) Graceful degradation (fallback to `<style>` tags)

**Recommendation:** Option A initially, monitor analytics

---

### 3. SSR/SSG Strategy

**Current state:** Client-only (crashes on server)

**Options:**
- A) Client-only forever (simplest)
- B) Declarative Shadow DOM (limited browser support)
- C) Static fallback + hydration (FOUC)
- D) Critical CSS extraction via plugin

**Recommendation:** Start with C, explore D if plugin is adopted

---

### 4. CSP Compatibility

**Problem:** `CSSStyleSheet.replace()` blocked by strict CSP (`style-src` without `unsafe-inline`)

**Impact:** Enterprise customers often have strict CSP

**Options:**
- A) Require `unsafe-inline` (document clearly)
- B) Fallback to `<link rel="stylesheet">` (complexity)
- C) Pre-built stylesheets (no dynamic loading)

**Recommendation:** Start with A, add B if enterprise demand exists

---

### 5. Theme Inheritance Model

**Current:** Each component manages own skin independently

**Problem:** User wants global theme toggle (all components switch together)

**Options:**
- A) React Context provider for global theme
- B) Attribute inheritance via DOM traversal
- C) Hybrid: context with per-component overrides

**Recommendation:** Implement A (React Context), document override pattern

---

### 6. Memory Management

**Current:** Global `Sheets` cache never evicts

**Problem:** With 50+ skins, unbounded memory growth

**Options:**
- A) No eviction (simple, predictable)
- B) LRU cache with size limit
- C) WeakMap + ref counting
- D) Manual `.evict(skin)` API

**Recommendation:** Start with A + D (manual control), add B if needed

---

### 7. Design Token Integration

**Current:** CSS custom properties in each skin

**Question:** How to integrate with design systems (Figma tokens, JSON tokens)?

**Options:**
- A) Manual: users write CSS with variables
- B) Codegen: plugin transforms tokens → CSS
- C) Runtime: JavaScript token objects → CSS variables

**Recommendation:** Start with A, explore B via plugin

---

### 8. Testing Strategy

**Problem:** Shadow DOM breaks React Testing Library queries

**Question:** What's the official testing story?

**Options:**
- A) Document workarounds (`{container: shadowRoot}`)
- B) Provide test utilities (`withinShadow()`)
- C) Non-shadow test mode (disable shadow for tests)

**Recommendation:** Implement B (utilities), document A

---

### 9. HMR Integration

**Current:** No HMR (full page reload on style change)

**Question:** Can we hot-reload styles without losing React state?

**Answer:** Yes, via `import.meta.hot.accept()` + `sheet.replace(newCSS)`

**Recommendation:** Implement HMR in core library (not plugin-dependent)

---

### 10. Migration Path

**Question:** How do users migrate from styled-components/Emotion/CSS Modules?

**Options:**
- A) Codemods for automated migration
- B) Incremental adoption (mix with existing styles)
- C) Compatibility layer (styled-components API)

**Recommendation:** Focus on B initially, build A if adoption grows

---

## 📦 Proposed Package Structure

```
@my-lib/
├── core/                  # Framework-agnostic runtime
│   ├── sheets.ts         # CSSStyleSheet cache
│   ├── element.ts        # Base custom element (optional)
│   └── types.ts
│
├── react/                 # React bindings
│   ├── hooks.ts          # useShadowStyles, useSkin
│   ├── components.ts     # ShadowRoot, createShadowComponent
│   ├── context.ts        # ThemeProvider
│   └── types.ts
│
├── vite-plugin/          # Optional optimizer (progressive enhancement)
│   ├── scanner.ts
│   ├── codegen.ts
│   └── hmr.ts
│
└── testing/              # Test utilities
    ├── rtl-helpers.ts    # withinShadow, getShadowRoot
    └── mocks.ts          # Mock CSSStyleSheet for Node
```

**Rationale:**
- Core is framework-agnostic (future: Vue, Svelte, etc.)
- React package is thin wrapper around core
- Plugin is truly optional (progressive enhancement)
- Testing utilities are first-class (not afterthought)

---

## 🧪 Proposed Experiments

Before building production API, run these spikes:

### 1. Performance: Sheets Cache Strategies
- Compare global singleton vs. per-component caches
- Measure memory with 100 components × 5 skins
- Test ref counting vs. WeakMap cleanup

### 2. SSR: Declarative Shadow DOM Spike
- Test browser support (Safari, Firefox)
- Measure FOUC duration on slow connections
- Validate hydration behavior

### 3. HMR: Vite Integration PoC
- Implement `import.meta.hot.accept()` wrapper
- Test style updates without state loss
- Measure update latency

### 4. DX: Developer Survey
- Show both APIs to 5-10 developers
- Time-to-hello-world benchmark
- Collect feedback on clarity, magic, debuggability

### 5. Testing: RTL Workarounds
- Prototype `withinShadow()` utility
- Test with real components
- Document patterns

---

## 🔄 Next Steps

### Immediate (This Week)
1. ✅ Review this document, provide feedback
2. ⏳ Answer critical questions #1-5 (Web Components, browser support, SSR, CSP, theming)
3. ⏳ Choose API direction (Progressive Enhancement vs. Hook-Based vs. both)

### Short-term (Next 2 Weeks)
4. Build minimal PoC of chosen API(s)
5. Run experiments #1, #3, #5 (performance, HMR, testing)
6. Write "Hello World" documentation

### Medium-term (Next Month)
7. Package structure + build setup
8. HMR integration
9. Test utilities
10. Migration guide (from styled-components)

---

## 📝 Open Questions for Discussion

Please provide feedback on:

1. **Web Components requirement**: Strong preference to keep or remove?
2. **Browser baseline**: Is dropping Safari <16.4 acceptable?
3. **SSR priority**: Must-have or nice-to-have?
4. **API preference**: Progressive Enhancement vs. Hook-Based vs. explore others?
5. **Plugin strategy**: Required from day 1, or truly optional?
6. **Testing**: What's your current testing setup (RTL, Vitest, Playwright)?
7. **Migration**: Existing codebase to migrate, or greenfield?
8. **Design tokens**: Current design system integration needs?

---

## 🗂️ Document Versioning

This is a living document. Future versions will track decisions and rationale.

**Version History:**
- **v0.1** (2025-12-27): Initial analysis, API exploration, critical questions
- **v0.2** (TBD): Incorporate feedback, finalize API direction
- **v0.3** (TBD): Document PoC results, update recommendations

**Change Process:**
1. You provide feedback/concerns in conversation
2. I update document with new version number
3. We iterate until consensus on API direction
4. Final version becomes implementation spec

---

## 📌 Key Takeaways

**What's working:**
- Core tech stack (Constructable Stylesheets, lazy loading, cache)
- React integration approach (portals, Suspense)

**What needs fixing:**
- Correctness bugs (attributeChangedCallback, Promise handling, races)
- Missing stories (SSR, HMR, testing)
- DX unclear (too much magic, hard to debug)

**What to decide:**
- Web Components: yes or no?
- API surface: Progressive Enhancement vs. simpler alternatives
- Browser baseline and trade-offs

**Recommended path forward:**
- Prototype 2 APIs in parallel (Progressive Enhancement + Hook-Based)
- Run focused experiments (performance, DX, testing)
- Make data-driven decision on final API

---

**Status:** Awaiting your feedback to proceed with v0.2
