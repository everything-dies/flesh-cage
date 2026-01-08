# Benchmark Accuracy Updates

This document records changes made to improve benchmark accuracy and comparability across flesh-cage, styled-components, and emotion.

## Goals

- Reduce noise from cold starts and transient effects.
- Ensure update benchmarks include actual skin/theme switching.
- Keep benchmark methodology transparent and repeatable.

## Changes Implemented

### 1) Warmup and Sample Discarding

All benchmarks now run a warmup phase and discard a small number of initial samples before computing mean/std dev.

- Warmup: 10 iterations (not recorded)
- Discard: 5 initial samples from measured runs

These defaults are set in the benchmark UI to reduce cold-start variance.

### 2) New Update Benchmark: Skin/Theme Switching

A new update benchmark exercises skin/theme switching rather than only inline style updates:

- flesh-cage: changes `Provider` skin to switch constructable stylesheets
- styled-components/emotion: changes `ThemeProvider` theme to force style recalculation

This adds an update case that directly measures the styling mechanism each library uses.

### 3) Result Reporting Enhancements

The benchmark UI now displays:

- Warmup count
- Discarded sample count

This makes results easier to interpret and compare across runs.

## Notes on Methodology

- Mount benchmarks still measure time to render a component tree and complete a frame.
- Update benchmarks measure per-update re-render time with a frame boundary.
- The new skin/theme switching test is more representative of real style updates than the Sierpinski inline style test.

## Next Steps

- Compare fresh results against prior data for deltas.
- Decide whether to add a "style applied" marker for flesh-cage (adoptedStyleSheets) and for style-tag based libraries.
- Add stress test results if you want to track limits and memory behavior.

### 4) Stable Props and Style References

To reduce re-render noise from new object identities, benchmark props and theme objects are now hoisted and reused across renders. For flesh-cage, common box styles and the skin switch box style are reused as static objects. The dot geometry styles are cached per position/size and the color is updated in-place to avoid new object allocations on every update frame.
