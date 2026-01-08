# Scaling Summary (Bulk Scenarios)

This table compares bulk element scenarios and highlights how CPU, GC, and heap growth scale with element count and with skin switches.

Runs:

- 1k bulk: `artifacts/bulk-elements/2026-01-08T17-56-20.968Z/summary.json`
- 5k bulk: `artifacts/bulk-elements-5000/2026-01-08T18-05-23.765Z/summary.json`
- 20k bulk (no heap snapshots): `artifacts/bulk-elements-20000/2026-01-08T20-06-16.622Z/summary.json`
- 1k switch: `artifacts/bulk-elements-switch/2026-01-08T18-07-14.438Z/summary.json`
- 5k switch: `artifacts/bulk-elements-switch-5000/2026-01-08T18-13-00.183Z/summary.json`
- 20k switch (no heap snapshots): `artifacts/bulk-elements-switch-20000/2026-01-08T20-15-11.887Z/summary.json`

## Bulk Mount (single skin)

| Elements | CPU Time (ms) | GC Time (ms) | GC Count | Heap Delta (MB) |
| -------- | ------------- | ------------ | -------- | --------------- |
| 1,000    | 379.21        | 884.57       | 1,015.67 | 22.7            |
| 5,000    | 1,187.36      | 4,064.65     | 1,482.00 | 72.9            |
| 20,000   | 3,078.06      | 4,835.23     | 4,060.00 | 259.9           |

## Bulk Mount + Skin Switch

| Elements | CPU Time (ms) | GC Time (ms) | GC Count | Heap Delta (MB) |
| -------- | ------------- | ------------ | -------- | --------------- |
| 1,000    | 462.12        | 1,156.51     | 1,094.33 | 19.6            |
| 5,000    | 1,640.95      | 5,718.76     | 2,235.67 | 81.8            |
| 20,000   | 4,493.09      | 7,388.10     | 3,035.00 | 298.9           |

## Notes

- Heap deltas use the `Runtime.getHeapUsage` measurement, so the numbers remain available even when heap snapshots are skipped.
- 20k runs skipped heap snapshots via `PERF_SKIP_HEAP=1` to avoid excessive snapshot size.
