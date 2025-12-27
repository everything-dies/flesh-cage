# Benchmark Methodology: Constructable Stylesheets Performance

**Version:** 0.1
**Date:** 2025-12-27
**Purpose:** Validate performance and memory characteristics of the proposed architecture

---

## Philosophy Validation

**Core Assumption to Test:**
> Encouraging consumers to break CSS into hyper-granular, per-component specifications that load/compute only when needed and release when components unmount will result in better performance and memory efficiency than traditional approaches.

---

## Benchmark Scenarios

### Scenario 1: Small App (Typical SPA)
- **Components**: 20 unique component types
- **Instances**: 50-100 total instances across the app
- **Skins**: 3 themes (light, dark, high-contrast)
- **CSS per component**: 1-3 KB
- **Total CSS potential**: 20 × 3 × 2 KB = 120 KB

### Scenario 2: Medium App (Dashboard)
- **Components**: 50 unique component types
- **Instances**: 200-500 total instances
- **Skins**: 5 themes
- **CSS per component**: 2-5 KB
- **Total CSS potential**: 50 × 5 × 3.5 KB = 875 KB

### Scenario 3: Large App (Enterprise Design System)
- **Components**: 100 unique component types
- **Instances**: 1000-5000 total instances
- **Skins**: 10 themes (brand variations)
- **CSS per component**: 3-8 KB
- **Total CSS potential**: 100 × 10 × 5.5 KB = 5.5 MB

### Scenario 4: Extreme (Microfrontends)
- **Components**: 500 unique component types
- **Instances**: 10,000+ total instances
- **Skins**: 20 themes
- **CSS per component**: 2-10 KB
- **Total CSS potential**: 500 × 20 × 6 KB = 60 MB

---

## Benchmark Dimensions

### 1. Memory Consumption
- **Baseline**: Traditional CSS-in-JS (styled-components, Emotion)
- **Test**: Constructable Stylesheets with caching
- **Variables**:
  - Number of component instances
  - Number of unique component types
  - Number of skins loaded simultaneously
  - Cache strategy (eternal vs. ref-counting)

### 2. Style Application Performance
- **Baseline**: `<style>` tag insertion in `<head>`
- **Test**: Constructable Stylesheet adoption
- **Metrics**:
  - Time to first style (TTFS)
  - Time for 100 component mounts
  - Time for 100 component unmounts
  - Time for global theme switch

### 3. Initial Load Performance
- **Baseline**: All CSS bundled in main chunk
- **Test**: Lazy-loaded skins via dynamic imports
- **Metrics**:
  - Main bundle size reduction
  - Time to Interactive (TTI) improvement
  - Largest Contentful Paint (LCP)

### 4. Runtime Performance
- **Test**: Component lifecycle operations
- **Metrics**:
  - Mount + style adoption time
  - Unmount + cleanup time
  - Skin switch time (per component)
  - Global theme switch time (all components)

### 5. Memory Lifecycle
- **Test**: Memory behavior over component lifetime
- **Metrics**:
  - Memory before component mount
  - Memory after 100 components mount
  - Memory after 100 components unmount
  - Memory after GC (does CSS release?)

---

## Test Implementation

### Browser-Based Benchmarks
Using Playwright + Chrome DevTools Protocol for accurate profiling.

### Metrics Collection
- **Performance API**: `performance.now()`, `performance.measure()`
- **Memory API**: `performance.memory` (Chrome-specific)
- **DevTools Protocol**: Heap snapshots, precise memory allocation

---

## Expected Outcomes

### Hypothesis 1: Memory Efficiency
**Claim**: Lifecycle-bound CSS with ref-counting uses less memory than global CSS.

**Prediction**:
- Traditional (all CSS loaded): Constant ~5.5 MB (Scenario 3)
- Proposed (lazy + ref-counting): Peak ~500 KB, average ~200 KB

### Hypothesis 2: Style Application Speed
**Claim**: Constructable Stylesheets are faster than header manipulation.

**Prediction**:
- Traditional: 1-3ms per component (global recalc)
- Proposed: 0.1-0.5ms per component (isolated to shadow)

### Hypothesis 3: Bundle Size Impact
**Claim**: Lazy skins reduce initial bundle size significantly.

**Prediction**:
- Traditional: All CSS in main bundle (+5.5 MB)
- Proposed: Base CSS only (+50 KB), skins lazy-loaded

### Hypothesis 4: Theme Switching
**Claim**: Global theme switch is faster with shared Constructable Sheets.

**Prediction**:
- Traditional: Re-inject all `<style>` tags (100-500ms for 100 components)
- Proposed: Swap `adoptedStyleSheets` array (10-50ms for 100 components)

---

## Benchmark Scripts Location

Scripts are located in:
- `benchmarks/browser/` - Playwright-based browser benchmarks
- `benchmarks/synthetic/` - Synthetic workloads (approximations)
- `benchmarks/results/` - Raw data and analysis

---

## Validation Criteria

For the architecture to be validated, we need:

1. **Memory**: ≥50% reduction in steady-state CSS memory vs. traditional
2. **Performance**: ≥2× faster style adoption vs. header manipulation
3. **Bundle**: ≥80% reduction in initial CSS bundle size
4. **Theme switch**: ≥5× faster global theme switch

---

**Status:** Methodology defined. Running benchmarks...
