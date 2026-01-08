# Performance & Memory Profiling Harness

This harness is a tool for deep-profiling the `flesh-cage` library with a focus on performance, memory behavior, and leaks. It is designed to be run both locally for development and in CI for regression testing.

## Quick Start

### 1. Installation

Dependencies are managed by the root workspace. Ensure you've run `yarn install` from the project root.

### 2. Running a Scenario

To run a profiling scenario, use the `run` command.

```bash
# From the project root directory
yarn perf start run simple-usage
```

- **UA Memory support**: If you want `performance.measureUserAgentSpecificMemory`, use a local Chrome channel:

  ```bash
  PERF_CHROME_CHANNEL=chrome yarn perf start run simple-usage
  ```

- **`simple-usage`**: This is the name of the scenario file `perf/scenarios/simple-usage.scenario.ts`.
- The command will output artifacts to `/artifacts/simple-usage/<timestamp>/`.

**Common Options:**

- `--runs <number>`: Number of measurement runs (default: 10).
- `--warmup <number>`: Number of warmup runs (default: 1).
- `--output <dir>`: Change the output directory.
- `--no-headless`: Run with a visible browser window for debugging.

### 3. Comparing Reports

To check for regressions, use the `compare` command with two `summary.json` files.

```bash
# From the project root directory
yarn perf start compare \
  --baseline ./artifacts/main-branch/summary.json \
  --current ./artifacts/my-feature-branch/summary.json
```

- The command will exit with a non-zero status code if a regression is detected.
- `--threshold <percent>`: Sets the failure threshold (default: 10).

## How It Works

The harness uses **Playwright** to launch a headless Chromium browser and controls it using the **Chrome DevTools Protocol (CDP)** to collect detailed profiling data. React and ReactDOM are bundled into the scenario script so runs stay offline and deterministic.

When you run a scenario, the harness:

1.  Uses **`esbuild`** to bundle your scenario and its imports from the local `packages/flesh-cage/src` into a single script.
2.  Launches Chromium.
3.  For each run, it injects the script into a blank page and executes the `workload` function defined in your scenario.
4.  It captures a performance trace, CPU profile, and heap snapshots.
5.  After all runs, it analyzes the captured data to produce a `summary.json` and a human-readable `report.md`.

## Understanding the Artifacts

For each run, several raw data files are generated. You can open these in Chrome DevTools for in-depth analysis.

1.  **CPU Profile (`.cpuprofile`)**:
    - Open Chrome DevTools (`Cmd+Opt+I` or `F12`).
    - Go to the **Performance** panel.
    - Click the **"Load profile"** icon (an up arrow).
    - Select a `cpu.cpuprofile` file to view the flamegraph and identify CPU hotspots.

2.  **Performance Trace (`trace.json`)**:
    - In the same **Performance** panel, load a `trace.json` file.
    - This gives you a complete timeline of browser activity, including rendering, scripting, and garbage collection events.

3.  **Heap Snapshot (`.heapsnapshot`)**:
    - Go to the **Memory** panel.
    - Click **"Load"** to open a `.heapsnapshot` file.
    - To find memory leaks, load a snapshot from before a workload and one from after. Then, use the "Comparison" view to see which objects were allocated and not released.

## Creating New Scenarios

1.  Create a new file in `perf/scenarios/` named `my-scenario.scenario.ts`.
2.  The file must export an `async function workload({ root })`.
3.  Write your workload inside this function. This is where you should call your library's API to simulate a realistic usage pattern.
4.  Run your scenario with `yarn perf start run my-scenario`.
