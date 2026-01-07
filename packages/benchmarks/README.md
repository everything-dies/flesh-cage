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

## Notes

- Benchmarks do not necessarily represent real-world performance
- Useful for detecting performance regressions during development
- Results may vary based on browser and hardware
