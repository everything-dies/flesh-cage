# Design Documentation

This folder contains design reviews, architectural decision records (ADRs), benchmarks, and brainstorming documents for the CSS-in-TS library project.

## Quick Start

**New here?** Start with these in order:

1. **[BENCHMARK_SUMMARY.md](./BENCHMARK_SUMMARY.md)** - TL;DR of all findings
2. **[DESIGN_REVIEW_v0.1.md](./DESIGN_REVIEW_v0.1.md)** - Initial PoC analysis & API directions
3. **[TECHNICAL_DEEP_DIVE_v0.1.md](./TECHNICAL_DEEP_DIVE_v0.1.md)** - Architecture validation
4. **[BENCHMARK_RESULTS_v0.1.md](./BENCHMARK_RESULTS_v0.1.md)** - Detailed performance analysis

## Documents

### Core Analysis
- **DESIGN_REVIEW_v0.1.md** - Initial PoC analysis, API exploration, critical questions
- **TECHNICAL_DEEP_DIVE_v0.1.md** - Validates core assumptions (Constructable Stylesheets efficiency, scoping, Shadow Parts, memory management)

### Benchmarks
- **BENCHMARK_SUMMARY.md** ⭐ - Quick reference for all benchmark findings
- **BENCHMARK_METHODOLOGY_v0.1.md** - How benchmarks work and what they test
- **BENCHMARK_RESULTS_v0.1.md** - Detailed analysis of all scenarios
- **benchmarks/** - Actual benchmark code (browser + synthetic)
  - `benchmarks/README.md` - How to run benchmarks
  - `benchmarks/browser/` - Browser-based tests (real DOM/memory)
  - `benchmarks/synthetic/` - Projections (Node.js models)
  - `benchmarks/results/` - Raw results

## Key Findings

### ✅ Architecture Validated

**For typical to large apps (20-200 components, 3-10 skins):**
- 4-8× faster performance (mount + theme switching)
- Best fit: Enterprise design systems

**Critical requirements:**
- Ref-counting cache (mandatory)
- Limited skins (≤10) or LRU eviction
- Base + skin pattern (recommended)

### ⚠️ Caution Zones

**Extreme scenarios (>500 components, >15 skins):**
- Memory can regress (-20% to -37%)
- Still faster, but memory penalty
- Need eviction strategies

## Purpose

These documents are living artifacts that track:
- Initial PoC analysis ✅
- Technical assumption validation ✅
- Performance benchmarks ✅
- API design explorations ⏳
- Critical decisions and trade-offs ⏳
- Iteration history and rationale ⏳

## Workflow

1. Documents are versioned (v0.1, v0.2, etc.)
2. Each version includes date and status
3. Previous versions are kept for historical reference
4. Final version becomes implementation specification
5. Benchmarks provide empirical validation

## Next Steps

1. ⏳ Run browser benchmarks to validate synthetic projections
2. ⏳ Update DESIGN_REVIEW to v0.2 with API refinements
3. ⏳ Create implementation plan based on validated architecture
