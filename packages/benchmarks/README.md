# Flesh Cage Benchmarks

Performance benchmarks for flesh-cage, adapted from styled-components and emotion benchmarking patterns.

## Overview

These benchmarks measure flesh-cage's rendering performance with Shadow DOM and Custom Elements. They test:

- **Mount benchmarks**: Time to create custom elements, attach shadow DOM, and set up adoptedStyleSheets
- **Update benchmarks**: Time to switch skins and update styles via adoptedStyleSheets

## Running Benchmarks

### Interactive Mode (Browser)

```bash
npm run dev
```

Then open http://localhost:3001 in your browser. Click "Run Benchmark" buttons to see results.

### Stress Tests (Browser)

```bash
npm run dev
```

Then open http://localhost:3001/stress.html to run extreme stress tests that push the library to its limits.

### Automated Mode (Headless)

```bash
npm run build
npm run benchmark
```

This will run all benchmarks automatically using Puppeteer and print results to console.

## Benchmark Tests

### Mount Deep Tree

Tests mounting a deeply nested component tree (depth: 7, breadth: 2) with:

- 127 custom elements
- 127 shadow DOM instances
- 127 adoptedStyleSheets

### Mount Wide Tree

Tests mounting a wide component tree (depth: 3, breadth: 6) with:

- 259 custom elements
- 259 shadow DOM instances
- 259 adoptedStyleSheets

### Update Dynamic Styles

Tests updating styles via skin switching using a Sierpinski Triangle pattern with:

- Continuous re-renders
- Dynamic adoptedStyleSheets updates
- Provider context changes

## Understanding Results

- **Mean**: Average time in milliseconds
- **Std Dev**: Standard deviation (consistency of performance)
- **Samples**: Number of iterations run

Lower is better for all metrics.

## Architecture Differences from styled-components/emotion

Unlike traditional CSS-in-JS libraries that inject `<style>` tags into the document head, flesh-cage:

1. Creates custom elements for each styled component
2. Attaches shadow DOM for style isolation
3. Uses constructable stylesheets (adoptedStyleSheets API)
4. Renders children via React portals into shadow DOM
5. Manages async skin loading with AbortController

These architectural differences mean flesh-cage benchmarks measure different overhead than traditional CSS-in-JS libraries.

## Stress Tests

In addition to standard benchmarks, stress tests push the library to extremes to discover limitations:

### Available Stress Tests

1. **Massive Mount** - Mounts 1000+ components simultaneously
2. **Deep Nesting** - Tests with 100+ levels of nesting
3. **Rapid Cycles** - Rapid mount/unmount cycles for memory leak detection
4. **Wide Tree** - Tests 1000+ sibling components
5. **Memory Leak Test** - Interactive tool to measure memory usage
6. **Skin Switching Storm** - Rapid skin changes across many components
7. **Mixed Complexity** - Both deep and wide hierarchies (3125 components)
8. **Limit Finder** - Incrementally finds browser breaking points

### Running Stress Tests

Open `http://localhost:3001/stress.html` and select:

1. Implementation (flesh-cage, styled-components, or emotion)
2. Stress test to run
3. Monitor Chrome DevTools Performance/Memory tabs

### Stress Testing Tips

- **Performance Profiling**: Open DevTools Performance tab before running
- **Memory Profiling**: Use Memory tab to take heap snapshots before/after
- **Enable Precise Memory**: Launch Chrome with `--enable-precise-memory-info`
- **Performance Monitor**: Open with Cmd+Shift+P → "Performance monitor"
- **Compare Implementations**: Run same test across different libraries

## Performance Optimization

See [docs/PERFORMANCE_OPTIMIZATION.md](../../docs/PERFORMANCE_OPTIMIZATION.md) for:

- Analysis of mount performance overhead
- Optimization strategies (immediate and long-term)
- Trade-offs between isolation and performance
- Recommended improvements

## Notes

- Benchmarks do not necessarily represent real-world performance
- Useful for detecting performance regressions during development
- Results may vary based on browser and hardware
- Stress tests may cause browser slowdown or hangs - this is intentional
