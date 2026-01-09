# Benchmark Suite

This directory contains benchmarks for validating the Constructable Stylesheets architecture.

## Directory Structure

```
benchmarks/
├── browser/              # Browser-based benchmarks (real DOM, real memory)
│   ├── index.html       # Test harness UI
│   └── benchmark.js     # Benchmark implementations
├── synthetic/           # Synthetic projections (Node.js)
│   └── projections.js   # Memory and performance models
└── results/             # Benchmark results and analysis
    └── synthetic-projections.txt
```

## Running Benchmarks

### Synthetic Projections (Node.js)

Run memory and performance projections based on theoretical models:

```bash
cd synthetic
node projections.js
```

Or save to file:

```bash
node projections.js > ../results/synthetic-projections.txt
```

**What it tests:**

- Memory usage projections for various app sizes
- Performance estimates based on empirical constants
- Scenarios: Small app → Extreme microfrontends

**Output:**

- Detailed breakdown per scenario
- Memory composition analysis
- Performance metrics (mount, theme switch)
- Summary comparison table

---

### Browser Benchmarks (Real Measurements)

#### Option 1: Simple HTTP Server

```bash
cd browser

# Using Python
python3 -m http.server 8000

# Or using Node.js
npx http-server -p 8000

# Or using PHP
php -S localhost:8000
```

Then open: http://localhost:8000

#### Option 2: Chrome with Memory Profiling

For accurate memory measurements, run Chrome with precise memory info:

```bash
# macOS/Linux
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --enable-precise-memory-info \
  --js-flags="--expose-gc" \
  http://localhost:8000

# Windows
chrome.exe --enable-precise-memory-info --js-flags="--expose-gc" http://localhost:8000
```

**Flags explained:**

- `--enable-precise-memory-info`: Enables `performance.memory` API with precise values
- `--js-flags="--expose-gc"`: Exposes `window.gc()` for manual garbage collection

---

## Available Tests

### 1. Component Mount Benchmark

Tests performance of mounting N components with styles.

**Buttons:**

- "Constructable: 100/500/1000 Components"
- "Traditional: 100/500/1000 Components"

**Metrics:**

- Mount time (total and per-component average)
- Memory increase
- Cache stats (constructable only)

---

### 2. Theme Switch Benchmark

Tests performance of switching themes across all mounted components.

**Button:** "Theme Switch Speed"

**Test:**

- Mounts 500 components
- Performs 5 theme switches
- Measures average switch time

**Metrics:**

- Switch time (total and per-component)
- Speedup comparison
- Memory impact

---

### 3. Memory Comparison

Comprehensive memory test across multiple component counts.

**Button:** "Memory Comparison"

**Test:**

- Tests 100, 500, and 1000 components
- Both constructable and traditional approaches
- Measures memory increase for each

**Metrics:**

- Memory increase per scenario
- Side-by-side comparison table
- Memory efficiency analysis

---

## Interpreting Results

### Performance Metrics

**Mount Time:**

- **Good:** <0.5ms per component (constructable)
- **Acceptable:** <1ms per component
- **Poor:** >2ms per component

**Theme Switch:**

- **Good:** <0.3ms per component (constructable)
- **Acceptable:** <0.5ms per component
- **Poor:** >1ms per component

**Expected speedup (Constructable vs Traditional):**

- Mount: 4-6× faster
- Theme switch: 6-10× faster

---

### Memory Metrics

**Memory increase per 100 components:**

- **Excellent:** <500 KB
- **Good:** 500-1000 KB
- **Acceptable:** 1-2 MB
- **Poor:** >2 MB

**Expected savings (Constructable vs Traditional):**

- Small apps (100 components): 3-7%
- Medium apps (500 components): 10-20%
- Large apps (1000+ components): 25-40%

**Red flags:**

- Constructable uses MORE memory than traditional (check cache strategy)
- Memory doesn't release after unmount (memory leak)
- Cache size grows unbounded (no eviction)

---

## Benchmark Scenarios

### Scenario Comparison

| Scenario       | Components | Instances | Skins | Complexity | Expected Memory Savings |
| -------------- | ---------- | --------- | ----- | ---------- | ----------------------- |
| Small SPA      | 20         | 100       | 3     | Medium     | 5-10%                   |
| Dashboard      | 50         | 400       | 5     | Medium     | 10-15%                  |
| Enterprise DS  | 100        | 2000      | 10    | Large      | 30-40%                  |
| Microfrontends | 500        | 10000     | 20    | Medium     | ⚠️ Potential regression |

---

## Common Issues

### 1. Memory API Not Available

**Error:** `performance.memory is undefined`

**Solution:** Run Chrome with `--enable-precise-memory-info` flag

**Alternative:** Memory metrics will show "N/A" but performance tests still work

---

### 2. Garbage Collection Not Available

**Error:** `window.gc is not a function`

**Solution:** Run Chrome with `--js-flags="--expose-gc"` flag

**Impact:** Memory after unmount may include uncollected garbage (less accurate)

---

### 3. Results Seem Inconsistent

**Causes:**

- Browser extensions interfering
- Background tabs consuming resources
- System under load

**Solutions:**

- Use incognito mode
- Close other tabs
- Close resource-heavy applications
- Run multiple times and average

---

## Validating Synthetic Projections

Compare browser results with synthetic projections:

1. Run synthetic projections: `node synthetic/projections.js`
2. Run browser benchmarks for same scenarios
3. Compare results:

```
Synthetic prediction: 54ms mount for 100 components
Browser actual: ~50-60ms
→ Validation: ✅ Within 10% margin
```

Expected variance: ±10-20% (synthetic is a model, not exact)

---

## Extending Benchmarks

### Adding New Scenarios

Edit `benchmark.js`:

```javascript
async function runCustomScenario() {
  const config = {
    count: 300,
    skins: ['light', 'dark', 'custom'],
    tagName: 'constructable-component',
  }

  // Your test logic...
}
```

### Adding New Metrics

Chrome DevTools Protocol can expose:

- Layout thrashing (forced reflows)
- Paint events
- JavaScript heap allocation
- CSS recalc time

See: https://chromedevtools.github.io/devtools-protocol/

---

## CI/CD Integration

To run benchmarks in CI (headless):

```bash
# Install Playwright
npm install -g playwright

# Run headless benchmark
playwright test benchmarks/browser/index.html
```

See `BENCHMARK_METHODOLOGY_v0.1.md` for Playwright integration details.

---

## Next Steps

1. ✅ Run synthetic projections (quick validation)
2. ⏳ Run browser benchmarks (real measurements)
3. ⏳ Compare results with projections
4. ⏳ Test with real component CSS (not synthetic)
5. ⏳ Profile memory lifecycle (mount → use → unmount → GC)

---

**Questions?** See `BENCHMARK_RESULTS_v0.1.md` for detailed analysis and recommendations.
