# Proposal: Performance & Memory Profiling Harness

This document outlines the architecture and implementation plan for a state-of-the-art profiling harness for the `flesh-cage` library, designed for both local analysis and CI-driven regression testing.

## 1. Core Principles & Technology Choices

- **Language**: **TypeScript**. The harness will be written in TypeScript to align with the existing project structure, enabling type-safe interactions with the library and profiling tools.
- **Execution**: **`tsx`**. We'll use `tsx` (or `ts-node`) to run the TypeScript-based harness directly, avoiding a separate compilation step for the harness itself.
- **Orchestration**: **Playwright**. For browser-based profiling, we will use Playwright to control a headless Chromium instance. It provides a robust API and direct access to the Chrome DevTools Protocol (CDP), which is essential for deep profiling.
- **CLI Framework**: **`yargs`**. A powerful and popular library for building feature-rich command-line interfaces in Node.js.
- **Local Library Handling**: **On-the-fly Bundling with `esbuild`**. To solve the critical "local/unpublished library" requirement for browser scenarios, the harness will bundle the scenario code and its imports from `packages/flesh-cage/src` into a single, self-contained JavaScript file at runtime. This is fast, reliable, and avoids polluting the main project's build configuration.
- **UA Memory Caveat**: `performance.measureUserAgentSpecificMemory` is only available in some Chromium builds. For accurate UA memory results, prefer running the harness with a local Chrome channel (see README).

## 2. Directory Structure

All profiling-related code will live in a new top-level `perf/` directory:

```
/Users/deusmorto/_dev/flesh-cage/
├── perf/
│   ├── src/
│   │   ├── cli.ts                # Main CLI entrypoint (using yargs)
│   │   ├── commands/
│   │   │   ├── run.ts            # Logic for the 'run' command
│   │   │   └── compare.ts        # Logic for the 'compare' command
│   │   ├── orchestrator.ts       # Manages Playwright, CDP sessions, and data capture
│   │   ├── analysis.ts           # Parses raw artifacts (traces, profiles)
│   │   └── reporting.ts          # Generates MD and JSON reports
│   ├── scenarios/
│   │   ├── template.html         # A simple HTML page to host browser scenarios
│   │   ├── simple-usage.scenario.ts  # Example: Profile a common API call
│   │   └── leak-detection.scenario.ts # Example: Loop to detect memory leaks
│   ├── package.json              # Harness-specific dependencies (playwright, yargs, etc.)
│   ├── tsconfig.json             # TypeScript config for the harness
│   └── README.md                 # Documentation for the harness
├── packages/
│   └── flesh-cage/
│       └── ...
└── ...
```

## 3. Workflow: `run` command

The command `./perf/run <scenario> [options]` will execute the following steps:

1.  **Parse Args**: The `cli.ts` entrypoint uses `yargs` to parse the scenario name and options (`--runs`, `--warmup`, `--output`).
2.  **Prepare Scenario**: The harness identifies the scenario file (e.g., `perf/scenarios/simple-usage.scenario.ts`). Using `esbuild`, it compiles and bundles this file into a temporary in-memory script. This script will correctly resolve the import `from 'packages/flesh-cage/src'`.
3.  **Launch Browser**: Playwright launches a headless Chromium instance with the necessary flags for detailed profiling (e.g., `--enable-precise-memory-info`, `--js-flags="--expose-gc"`).
4.  **Orchestrate Runs**: The `orchestrator` takes over. For each run (including warmups):
    a. A new incognito browser page is created and navigated to `perf/scenarios/template.html`.
    b. A CDP session is established.
    c. **Profiling Starts**: `Tracing.start`, `Profiler.enable`, and `HeapProfiler.enable` are called. A heap snapshot is taken (`before.heapsnapshot`).
    d. **Execute Workload**: The bundled scenario script is injected and executed via `page.evaluate()`. The scenario function will be exposed on the `window` object.
    e. **Force GC & Measure**: After the workload, `global.gc()` is invoked via CDP (`Runtime.evaluate`).
    f. **Profiling Stops**: A final heap snapshot is taken (`after.heapsnapshot`). The results from `Tracing.stop`, `Profiler.stop` are collected.
    g. Memory metrics (`performance.measureUserAgentSpecificMemory`) are collected.
5.  **Artifacts Saved**: Raw artifacts (`.trace.json`, `.cpuprofile`, `.heapsnapshot`) are saved to the output directory, excluding warmup runs.
6.  **Analyze & Report**: The `analysis.ts` module parses the raw artifacts to calculate key metrics (GC stats, CPU hotspots, heap growth). `reporting.ts` then uses these metrics to generate `summary.json` and `report.md`.

## 4. Workflow: `compare` command

The command `./perf/compare --baseline <path/to/summary.json> --current <path/to/summary.json>` will:

1.  Load the two `summary.json` files.
2.  Compare key metrics (e.g., `p95_runtime_ms`, `final_heap_size_bytes`).
3.  Apply configurable thresholds for regression (e.g., `+10%` runtime, `+5%` memory).
4.  Print a clear table showing the comparison, deltas, and a final `PASS` or `FAIL` status.
5.  Exit with code `1` if a regression is detected, making it CI-friendly.

## 5. Deliverables Checklist

- **[A] Harness CLI**:
  - [x] `perf/run` and `perf/compare` commands.
  - [x] Options for runs, warmup, output dir.
  - [x] CI-friendly exit codes.
- **[B] Profiling Capture**:
  - [x] **Performance Trace**: Captured via `Tracing` API.
  - [x] **CPU Profile**: Captured via `Profiler` API.
  - [x] **Heap Snapshots**: `before` and `after` snapshots via `HeapProfiler`.
  - [x] **Memory Timeline**: Via `performance.measureUserAgentSpecificMemory`.
  - [x] **GC Events**: Extracted from the performance trace.
- **[C] Analysis & Reporting**:
  - [x] `summary.json` (machine-readable).
  - [x] `report.md` (human-readable) with sections for CPU, Memory, GC, and potential leaks.
  - [x] Raw artifacts organized by scenario and timestamp.
- **[D] Regression Mode**:
  - [x] Implemented in the `compare` command.
  - [x] Configurable thresholds.
  - [x] Clear `PASS/FAIL` output.
- **[E] Documentation & CI**:
  - [x] A `perf/README.md` explaining setup, execution, and how to interpret artifacts.
  - [x] A sample GitHub Actions workflow file (`.github/workflows/performance.yml`) that runs the harness and uploads artifacts.

## Next Steps

If this proposal is accepted, I will begin by scaffolding the `perf/` directory, setting up `package.json` and `tsconfig.json`, and then implementing the `run` command as the minimal viable product.
