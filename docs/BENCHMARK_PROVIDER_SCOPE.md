# Benchmark Provider Scope Variants

This document explains the new "single provider" mount benchmarks and why they were added.

## Motivation

The original mount benchmarks for flesh-cage wrapped each node in a `Provider`, which is not representative of typical usage. Most apps use a single top-level provider (similar to Redux or ThemeProvider) and rely on attribute-driven styling or other props for per-node differences.

To avoid unfairly penalizing flesh-cage, we now track two mount variants:

1. **Per-node Provider** (legacy) — stresses context usage and worst-case overhead.
2. **Single Provider** (new) — matches common app structure and a realistic performance baseline.

## Implementation Details

- **Per-node Provider** uses the original `BoxWithSkin` wrapper.
- **Single Provider** uses a single `Provider` at the root and a skin with attribute selectors:
  - `data-color` drives red/blue/black/transparent styles.
  - Layout/padding/margins remain inline for parity with other implementations.

## Benchmark IDs

- `mount-deep-single`
- `mount-wide-single`

## Interpretation

Use the single-provider results as the primary indicator for real-world mount performance. The per-node Provider results remain useful for stress testing and regression detection.
