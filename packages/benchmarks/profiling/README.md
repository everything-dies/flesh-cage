# Automated Performance Profiling

This directory contains automated profiling tools that use Puppeteer to capture Chrome DevTools performance data programmatically.

## Why Automated Profiling?

Manual profiling requires:

- Opening DevTools
- Clicking through UI
- Interpreting flame charts visually
- Manually comparing implementations

Automated profiling:

- ✅ Captures all metrics programmatically
- ✅ Runs consistently across implementations
- ✅ Exports trace files for detailed analysis
- ✅ Generates comparison reports automatically
- ✅ Can run in CI/CD pipelines

## Quick Start

```bash
# Run the full profiling pipeline
npm run profile
```

This will:

1. Build the benchmarks
2. Start the dev server
3. Capture profiles for all implementations
4. Analyze and compare results
5. Stop the server

## What Gets Captured

### 1. Chrome Trace Files

- **Location**: `profiling/data/*-trace.json`
- **Contains**: Complete Chrome DevTools performance timeline
- **Use**: Load in Chrome DevTools for visual analysis

### 2. Profile Data

- **Location**: `profiling/data/*-profile.json`
- **Contains**:
  - Benchmark results (mean, std dev)
  - Memory metrics (heap size, delta)
  - DOM metrics (nodes, layouts, style recalcs)
  - Performance marks
  - Console logs

### 3. Summary Report

- **Location**: `profiling/data/summary.json`
- **Contains**: All profiles combined for comparison

## Manual Steps

### 1. Capture Only

```bash
# Make sure dev server is running
npm run dev

# In another terminal
npm run profile:capture
```

### 2. Analyze Only

```bash
npm run profile:analyze
```

### 3. View Instrumentation Guide

```bash
npm run profile:instrument
```

## Understanding the Output

### Console Output

```
📊 flesh-cage - mount-deep

⏱️  Benchmark Results:
   Mean: 14.48ms
   Std Dev: 6.85ms
   Wall Clock: 3245ms

💾 Memory:
   Before: 12.34MB
   After: 15.67MB
   Delta: 3.33MB

📈 Metrics:
   DOM Nodes Created: 254
   Layout Events: 127
   Style Recalcs: 127
   Event Listeners: 127

🔥 Chrome Trace Analysis:
   Total Events: 12453
   Paint: 45.23ms (34 events)
   Layout: 23.45ms (127 events)
   Style: 15.67ms (127 events)
   Script: 234.56ms (456 events)

🔥 Hot Functions (top 10):
   1. attachShadow: 45.23ms
   2. createElement: 23.45ms
   3. React.render: 156.78ms
   ...
```

### Comparison Report

```
📊 COMPARATIVE ANALYSIS

### MOUNT-DEEP

⏱️  Performance (Mean):
   emotion              4.76ms (baseline)
   styled-components    4.80ms (+0.8%)
   flesh-cage          14.48ms (+204.2%)

💾 Memory Delta:
   styled-components    2.45MB
   emotion             2.67MB
   flesh-cage          3.33MB

📈 DOM Operations:
   styled-components    259 nodes, 3 layouts, 4 style recalcs
   emotion             259 nodes, 3 layouts, 4 style recalcs
   flesh-cage          254 nodes, 127 layouts, 127 style recalcs

🔍 Breakdown (from trace):
   styled-components    Paint: 12.3ms, Layout: 8.4ms, Style: 5.2ms, Script: 45.6ms
   emotion             Paint: 11.8ms, Layout: 7.9ms, Style: 4.8ms, Script: 43.2ms
   flesh-cage          Paint: 45.2ms, Layout: 23.5ms, Style: 15.7ms, Script: 234.6ms
```

## Viewing Chrome Traces

Trace files can be loaded in Chrome DevTools for visual analysis:

1. Open Chrome DevTools (F12)
2. Go to **Performance** tab
3. Click **Load profile** (up arrow icon)
4. Select a trace file from `profiling/data/*-trace.json`
5. Analyze the flame chart, call tree, and timeline

### What to Look For

- **Main thread activity**: Long yellow blocks = JavaScript execution
- **Layout/Reflow**: Purple blocks = expensive layout calculations
- **Paint**: Green blocks = rendering
- **Function calls**: Click on blocks to see stack traces

## Performance Marks

The profiling system captures all `performance.mark()` calls. To add custom marks to flesh-cage source code:

```typescript
performance.mark('my-operation-start')
// ... expensive operation ...
performance.mark('my-operation-end')
performance.measure('my-operation', 'my-operation-start', 'my-operation-end')
```

See `INSTRUMENTATION_GUIDE.md` for recommended instrumentation points.

## Interpreting Results

### Mount Performance

**What it measures**: Time to create components from scratch

- Custom element creation
- Shadow DOM attachment
- Style injection
- Portal rendering

**Key metrics**:

- Mean time (lower = better)
- DOM nodes created (more = more overhead)
- Layout count (high = layout thrashing)
- Memory delta (lower = more efficient)

### Update Performance

**What it measures**: Time to update existing components

- Style recalculation
- Skin switching
- Re-renders

**Key metrics**:

- Mean time (lower = better)
- Style recalcs (fewer = more efficient)
- Memory delta (should be minimal)

## Common Bottlenecks

Based on profiling data, common bottlenecks include:

1. **Shadow DOM creation** (~2-3ms per component)
   - `attachShadow()` is expensive
   - Unavoidable if isolation is needed

2. **Layout thrashing** (one layout per component)
   - Caused by synchronous DOM measurements
   - Can be batched with `requestAnimationFrame()`

3. **Style recalculation** (one per shadow root)
   - Each shadow root has independent styles
   - More expensive than global styles

4. **Memory allocation** (3x more nodes)
   - Custom elements + shadow roots + portals
   - More GC pressure

## CI/CD Integration

You can run profiling in CI to detect performance regressions:

```yaml
# .github/workflows/profile.yml
- name: Run performance profiling
  run: |
    cd packages/benchmarks
    npm run profile

- name: Upload trace files
  uses: actions/upload-artifact@v3
  with:
    name: performance-traces
    path: packages/benchmarks/profiling/data/*.json
```

## Limitations

- **Headless mode**: Profiling runs in headless Chrome, which may differ from regular Chrome
- **Cold cache**: Each run starts with empty cache
- **Synthetic benchmarks**: Not representative of real-world usage
- **Single run**: Variance exists between runs
- **CPU throttling**: Not applied (could be added)

## Advanced Usage

### Custom Test Cases

Edit `capture.js` to add custom test cases:

```javascript
const tests = [
  { name: 'mount-deep', selector: 'mount-deep' },
  { name: 'mount-wide', selector: 'mount-wide' },
  { name: 'custom-test', selector: 'custom-test' }, // Add new test
]
```

### CPU Throttling

Simulate slower devices:

```javascript
const client = await page.target().createCDPSession()
await client.send('Emulation.setCPUThrottlingRate', { rate: 4 }) // 4x slowdown
```

### Memory Snapshots

Capture heap snapshots for detailed memory analysis:

```javascript
const client = await page.target().createCDPSession()
const snapshot = await client.send('HeapProfiler.takeHeapSnapshot')
```

## Troubleshooting

### "Server failed to start"

Make sure port 3001 is available:

```bash
lsof -ti:3001 | xargs kill -9
npm run dev
```

### "Element not found"

Check that benchmark buttons have correct `data-benchmark` attributes:

```tsx
<button data-benchmark="mount-deep">Run Benchmark</button>
```

### "Trace file empty"

Ensure Chrome tracing categories are correct. Check `capture.js`:

```javascript
categories: [
  'devtools.timeline',
  'disabled-by-default-devtools.timeline',
  // ...
]
```

## Next Steps

1. **Add instrumentation** - See `INSTRUMENTATION_GUIDE.md`
2. **Run profiling** - `npm run profile`
3. **Analyze traces** - Load in Chrome DevTools
4. **Optimize bottlenecks** - See `docs/PERFORMANCE_OPTIMIZATION.md`
5. **Verify improvements** - Re-run profiling
