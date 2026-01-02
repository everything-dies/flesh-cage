# Feature Proposals

This directory contains **planning documents** for future features that are **not yet implemented**.

These documents represent design explorations and architectural proposals. They are useful for:
- Understanding the long-term vision for the library
- Discussing potential features before implementation
- Reference material for future development work

## Status: Planning Only

⚠️ **None of these features are currently implemented in the codebase.**

For current, working features, see:
- [Root README](../../README.md) - Current API and features
- [Package README](../../packages/flesh-cage/README.md) - Package documentation
- [CURRENT_VS_PLANNED.md](../CURRENT_VS_PLANNED.md) - Clear comparison

## Proposed Features

### Performance & Loading

- **[SIMPLIFIED_ARRAY_API.md](./SIMPLIFIED_ARRAY_API.md)** - Simplified array-based syntax for multi-chunk skins
- **[ASYNC_SKIN_LOADING_PLAN.md](./ASYNC_SKIN_LOADING_PLAN.md)** - ReadableStream-based progressive loading
- **[ABORT_STALE_SKIN_LOADS.md](./ABORT_STALE_SKIN_LOADS.md)** - AbortController integration for canceling stale loads
- **[CLIENT_ONLY_STREAMING.md](./CLIENT_ONLY_STREAMING.md)** - Client-side streaming architecture

### Developer Experience

- **[HMR_INTEGRATION_GUIDE.md](./HMR_INTEGRATION_GUIDE.md)** - Hot Module Replacement integration
- **[HMR_BUNDLER_COMPARISON.md](./HMR_BUNDLER_COMPARISON.md)** - Bundler compatibility for HMR
- **[HMR_EXTENDED_BUNDLERS.md](./HMR_EXTENDED_BUNDLERS.md)** - Extended bundler support

## Contributing Proposals

To propose a new feature:

1. Create a markdown file in this directory
2. Use the existing proposals as templates
3. Include:
   - Problem statement
   - Proposed solution
   - Implementation details
   - Trade-offs and alternatives
   - Migration path (if breaking)

## Timeline

These proposals have no set timeline for implementation. They represent exploratory work and may be implemented, modified, or discarded based on:
- User feedback
- Technical constraints
- Priority shifts
- Alternative solutions
