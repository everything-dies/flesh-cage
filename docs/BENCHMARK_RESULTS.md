# Benchmark Results

Performance comparison of flesh-cage against styled-components and emotion.

**Date:** January 2026
**Environment:** Puppeteer (headless Chrome), macOS
**Sample Size:** 50-100 iterations per benchmark

## Summary

flesh-cage demonstrates **competitive performance** with established CSS-in-JS libraries, especially considering its unique Shadow DOM architecture:

- ✅ **Update performance on par** with emotion (10.75ms vs 10.76ms)
- ⚠️ **Mount overhead 2-3x slower** than traditional libraries (~13ms vs ~5ms)
- ✅ **Low variance** in updates (0.60ms std dev) shows good caching
- 🎯 **Trade-off:** Mount penalty for true style isolation via Shadow DOM

## Detailed Results

### Mount Deep Tree (depth: 7, breadth: 2, ~127 components)

| Library           | Mean       | Std Dev | vs Fastest |
| ----------------- | ---------- | ------- | ---------- |
| **emotion**       | **4.76ms** | 0.92ms  | baseline   |
| styled-components | 4.80ms     | 1.48ms  | +0.8%      |
| flesh-cage        | 14.48ms    | 6.85ms  | +204.2%    |

### Mount Wide Tree (depth: 3, breadth: 6, ~259 components)

| Library           | Mean       | Std Dev | vs Fastest |
| ----------------- | ---------- | ------- | ---------- |
| **emotion**       | **5.11ms** | 2.29ms  | baseline   |
| styled-components | 5.21ms     | 2.64ms  | +2.0%      |
| flesh-cage        | 12.89ms    | 3.16ms  | +152.3%    |

### Update Dynamic Styles (Sierpinski Triangle, 100 updates)

| Library           | Mean        | Std Dev | vs Fastest |
| ----------------- | ----------- | ------- | ---------- |
| **flesh-cage**    | **10.75ms** | 0.60ms  | baseline   |
| emotion           | 10.76ms     | 0.85ms  | +0.1%      |
| styled-components | 10.93ms     | 0.76ms  | +1.7%      |

## Analysis

### Why flesh-cage is slower on mount

flesh-cage has additional overhead during component mounting:

1. **Custom element registration** - Each styled component creates a custom element class
2. **Shadow DOM attachment** - Shadow root creation per component instance
3. **adoptedStyleSheets initialization** - Setting up constructable stylesheets
4. **Portal setup** - React portal to render children into shadow DOM
5. **Async skin loading** - Promise-based skin resolution (even with immediate resolution)

**Per-component overhead:** ~0.05-0.10ms additional cost per component

This is a **one-time cost** paid during initial render. For applications with:

- Frequent page navigations
- Large component trees on initial load
- Server-side rendering requirements

The mount overhead may be noticeable.

### Why flesh-cage is competitive on updates

Update performance is excellent because:

1. **adoptedStyleSheets replacement is efficient** - Browser-native API for stylesheet updates
2. **Good caching** - Low standard deviation (0.60ms) indicates consistent performance
3. **No DOM manipulation** - Unlike `<style>` tag injection, no DOM operations needed
4. **AbortController optimization** - Properly cancels in-flight skin loads during rapid changes

**Per-update overhead:** ~0.10ms per component, same as emotion

For applications with:

- Frequent theme/skin switching
- Real-time style updates
- Dynamic styling based on user interactions

flesh-cage performs **as well as or better than** established libraries.

## Architecture Trade-offs

### What flesh-cage provides that others don't:

- ✅ **True style isolation** - Shadow DOM prevents CSS leakage
- ✅ **Web Components compatibility** - Works with custom elements ecosystem
- ✅ **Scoped styles without classes** - No class name generation needed
- ✅ **Framework agnostic** - Shadow DOM works with any framework

### What you sacrifice:

- ⚠️ **2-3x slower mounts** - ~10ms overhead per component tree
- ⚠️ **Higher memory usage** - Each shadow root has overhead
- ⚠️ **Browser compatibility** - Requires Shadow DOM support (modern browsers only)
- ⚠️ **Higher variance on mount** - 6-7ms std dev vs 1-2ms for others

## Real-World Implications

### When flesh-cage is the right choice:

1. **Micro-frontends** - Style isolation between independent apps
2. **White-label applications** - Complete theme encapsulation
3. **Component libraries** - Prevent style conflicts with consumer apps
4. **Web Components** - Already using custom elements
5. **Long-lived applications** - Mount cost amortized over time

### When to consider alternatives:

1. **Server-side rendering** - Shadow DOM doesn't work with SSR
2. **SEO-critical apps** - Search engines may have issues with shadow DOM
3. **Legacy browser support** - Need IE11 or older browsers
4. **Extremely fast initial load** - Every millisecond of mount time matters

## Optimization Opportunities

Based on these benchmarks, potential optimizations for flesh-cage:

1. **Eager custom element definition** - Pre-register elements before first use
2. **Shared shadow DOM** - Reuse shadow roots where possible
3. **Synchronous skin loading** - Option for inline styles to avoid Promise overhead
4. **Pooling** - Reuse custom elements instead of creating/destroying

## Conclusion

flesh-cage demonstrates that **Shadow DOM + Custom Elements is a viable architecture** for CSS-in-JS libraries. While there's a mount performance penalty (~2-3x slower), the update performance is **competitive with industry leaders**.

The choice between flesh-cage and traditional CSS-in-JS libraries comes down to:

- **Do you need true style isolation?** → Use flesh-cage
- **Do you need fastest mount performance?** → Use emotion/styled-components

For applications where style encapsulation is critical (micro-frontends, component libraries, white-label apps), the ~10ms mount overhead is a **worthwhile trade-off** for guaranteed style isolation.

## Running Benchmarks

To run these benchmarks yourself:

```bash
cd packages/benchmarks
npm run build
npm run benchmark
```

Or run interactively in a browser:

```bash
npm run dev
# Open http://localhost:3001
```

## Methodology

- **Browser:** Puppeteer (headless Chrome)
- **Samples:** 50 iterations for mount, 100 for updates
- **Timing:** `performance.now()` before/after render
- **Mount:** Full component tree creation and initial render
- **Update:** Re-render with changed props (simulating theme/style changes)

Each benchmark runs in isolation with cleanup between samples to prevent GC interference.
