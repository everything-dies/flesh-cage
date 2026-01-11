# Performance Report: simple-usage

**Run at:** Sun, 11 Jan 2026 22:54:41 GMT

## Summary

| Metric                    | Average  | p95      | StdDev   |
| ------------------------- | -------- | -------- | -------- |
| **GC Time (ms)**          | 31.80    | 33.53    | 1.22     |
| **GC Pause (ms)**         | 0.07     | 0.07     | 0.00     |
| **GC Count**              | 462.10   | 469.00   | 5.49     |
| **Major GC Count**        | 0.00     | 0.00     | 0.00     |
| **CPU Time (ms)**         | 90.27    | 97.98    | 4.47     |
| **Heap Used Before (MB)** | 2.77     | 2.77     | 0.00     |
| **Heap Used After (MB)**  | 2.34     | 2.48     | 0.16     |
| **Heap Used Delta (MB)**  | -0.43    | -0.29    | 0.16     |
| **UA Memory (MB)**        | N&#x2F;A | N&#x2F;A | N&#x2F;A |

_UA memory is unavailable in this environment; values are omitted._

---

## Raw Data (per run)

| Run | GC Time (ms) | GC Pause (ms) | GC Count | Major GC Count | CPU Time (ms) | Heap Used Before (MB) | Heap Used After (MB) | Heap Used Delta (MB) | UA Memory (MB) |
| --- | ------------ | ------------- | -------- | -------------- | ------------- | --------------------- | -------------------- | -------------------- | -------------- |
| 2   | 32.03        | 0.07          | 458      | 0              | 97.98         | 2.77                  | 2.48                 | -0.30                | N&#x2F;A       |
| 3   | 33.53        | 0.07          | 463      | 0              | 86.00         | 2.77                  | 2.48                 | -0.30                | N&#x2F;A       |
| 4   | 31.25        | 0.07          | 463      | 0              | 93.25         | 2.77                  | 2.14                 | -0.63                | N&#x2F;A       |
| 5   | 33.31        | 0.07          | 469      | 0              | 86.00         | 2.77                  | 2.47                 | -0.31                | N&#x2F;A       |
| 6   | 30.93        | 0.07          | 462      | 0              | 85.30         | 2.77                  | 2.48                 | -0.29                | N&#x2F;A       |
| 7   | 30.67        | 0.07          | 464      | 0              | 94.02         | 2.77                  | 2.14                 | -0.63                | N&#x2F;A       |
| 8   | 32.20        | 0.07          | 459      | 0              | 89.39         | 2.77                  | 2.48                 | -0.30                | N&#x2F;A       |
| 9   | 29.30        | 0.07          | 449      | 0              | 84.29         | 2.77                  | 2.48                 | -0.29                | N&#x2F;A       |
| 10  | 32.53        | 0.07          | 466      | 0              | 94.14         | 2.77                  | 2.14                 | -0.63                | N&#x2F;A       |
| 11  | 32.25        | 0.07          | 468      | 0              | 92.37         | 2.77                  | 2.14                 | -0.63                | N&#x2F;A       |

---

## How to view artifacts

To dive deeper, open the raw artifact files in Chrome DevTools:

1.  **CPU Profile**: Open DevTools, go to the "Performance" panel, and click the "Load profile" icon (up arrow). Select a `cpu.cpuprofile` file from the artifacts directory.
2.  **Performance Trace**: In the same "Performance" panel, load a `trace.json` file.
3.  **Heap Snapshot**: Go to the "Memory" panel, and click "Load" to open a `.heapsnapshot` file. You can load two snapshots and compare them to find leaks.
