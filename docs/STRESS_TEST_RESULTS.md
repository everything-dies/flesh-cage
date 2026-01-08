# Stress Test Results

> **Note**: This document will be populated after running stress tests to discover flesh-cage's limits.

## How to Run Stress Tests

```bash
cd packages/benchmarks
npm run dev
# Open http://localhost:3001/stress.html
```

Select an implementation (flesh-cage, styled-components, or emotion) and a stress test, then monitor Chrome DevTools.

## Tests Overview

### 1. Massive Mount (1000+ components)

**Purpose**: Test mounting thousands of components simultaneously

**What to watch**:

- Mount time
- Memory usage
- Browser responsiveness
- FPS during render

### 2. Deep Nesting (100+ levels)

**Purpose**: Test extremely deep component hierarchies

**What to watch**:

- Stack depth limits
- Portal nesting overhead
- Event bubbling performance
- Maximum achievable depth

### 3. Rapid Cycles (Mount/Unmount Loops)

**Purpose**: Detect memory leaks

**What to watch**:

- Memory growth over time
- GC pressure
- Cleanup efficiency (disconnectedCallback)
- Memory after 100+ cycles

### 4. Wide Tree (1000+ siblings)

**Purpose**: Test horizontal scaling

**What to watch**:

- Reconciliation performance
- Layout performance
- Memory per-component overhead

### 5. Memory Leak Test

**Purpose**: Interactive tool to measure memory

**How to use**:

1. Take baseline memory snapshot
2. Create 1000 components
3. Measure memory (should increase)
4. Destroy all components
5. Force GC
6. Measure again (should return close to baseline)

### 6. Skin Switching Storm

**Purpose**: Test rapid skin changes

**What to watch**:

- adoptedStyleSheets update performance
- AbortController churn
- Style recalculation overhead

### 7. Mixed Complexity (3125 components)

**Purpose**: Realistic complex UI

**What to watch**:

- Overall performance with both depth and breadth
- Real-world applicability

### 8. Limit Finder

**Purpose**: Find browser breaking points

**How to use**:

1. Click "Add 100 Components"
2. Repeat until browser slows/crashes
3. Note the count where issues begin

## Expected Results

### flesh-cage Expectations

Based on profiling data:

- **Memory**: ~12MB per 100 components
- **Mount**: ~7-10ms per 100 components
- **Breaking point**: Likely 5000-10000 components (Shadow DOM limit)

### Competitor Comparisons

- **styled-components**: Higher DOM nodes, may break earlier
- **emotion**: Lowest memory, likely highest limit

## Results (To Be Filled)

### Massive Mount Test

| Implementation    | 1000 Components | 2000 Components | 5000 Components | 10000 Components |
| ----------------- | --------------- | --------------- | --------------- | ---------------- |
| flesh-cage        | TBD             | TBD             | TBD             | TBD              |
| styled-components | TBD             | TBD             | TBD             | TBD              |
| emotion           | TBD             | TBD             | TBD             | TBD              |

### Deep Nesting Test

| Implementation    | Max Depth | Time at Max | Notes |
| ----------------- | --------- | ----------- | ----- |
| flesh-cage        | TBD       | TBD         |       |
| styled-components | TBD       | TBD         |       |
| emotion           | TBD       | TBD         |       |

### Memory Leak Test

| Implementation    | Initial | After Create | After Destroy | Leaked |
| ----------------- | ------- | ------------ | ------------- | ------ |
| flesh-cage        | TBD     | TBD          | TBD           | TBD    |
| styled-components | TBD     | TBD          | TBD           | TBD    |
| emotion           | TBD     | TBD          | TBD           | TBD    |

### Wide Tree Test

| Implementation    | 1000 Siblings | 2000 Siblings | 5000 Siblings |
| ----------------- | ------------- | ------------- | ------------- |
| flesh-cage        | TBD           | TBD           | TBD           |
| styled-components | TBD           | TBD           | TBD           |
| emotion           | TBD           | TBD           | TBD           |

### Skin Switching Storm

| Implementation    | 100 Components | FPS | Notes |
| ----------------- | -------------- | --- | ----- |
| flesh-cage        | TBD            | TBD |       |
| styled-components | TBD            | TBD |       |
| emotion           | TBD            | TBD |       |

### Mixed Complexity (3125 components)

| Implementation    | Mount Time | Memory | Usable? |
| ----------------- | ---------- | ------ | ------- |
| flesh-cage        | TBD        | TBD    | TBD     |
| styled-components | TBD        | TBD    | TBD     |
| emotion           | TBD        | TBD    | TBD     |

### Limit Finder

| Implementation    | Breaking Point | Symptoms |
| ----------------- | -------------- | -------- |
| flesh-cage        | TBD            |          |
| styled-components | TBD            |          |
| emotion           | TBD            |          |

## Conclusions (To Be Filled)

### flesh-cage Limits

- **Practical limit**: TBD components
- **Hard limit**: TBD components
- **Bottleneck**: TBD

### Recommendations

- TBD

### Real-World Applicability

- TBD
