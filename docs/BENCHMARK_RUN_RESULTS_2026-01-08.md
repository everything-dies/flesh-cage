# Benchmark Run Results (2026-01-08)

These results were captured after adding warmup/discard handling and the new skin/theme switching update benchmark.

## Environment

- Runner: `npm run benchmark` (Puppeteer + Vite preview)
- Warmup: 10 iterations
- Discarded: 5 initial samples
- Sample count: 50 (mount) / 100 (update)

## Results

### Mount deep tree (depth: 7, breadth: 2)

- flesh-cage: 13.18ms ± 3.61ms
- styled-components: 4.56ms ± 0.47ms
- emotion: 4.56ms ± 0.64ms

### Mount wide tree (depth: 3, breadth: 6)

- flesh-cage: 13.39ms ± 3.37ms
- styled-components: 4.55ms ± 0.65ms
- emotion: 4.63ms ± 0.48ms

### Update dynamic styles (Sierpinski Triangle)

- flesh-cage: 10.65ms ± 0.56ms
- styled-components: 10.57ms ± 0.65ms
- emotion: 10.76ms ± 0.66ms

### Update skin/theme switching

- flesh-cage: 10.40ms ± 0.54ms
- styled-components: 10.29ms ± 0.54ms
- emotion: 10.36ms ± 0.61ms

## Notes

- The runner reported port 4173 in use and served the preview on 4174.
- The automated runner still navigates to the preview page and completed all benchmarks.
- If a stale preview server is suspected, free port 4173 or update the runner to a fixed strict port.

## Run 2 (re-run after commit)

### Mount deep tree (depth: 7, breadth: 2)

- flesh-cage: 12.70ms ± 3.93ms
- styled-components: 4.65ms ± 0.78ms
- emotion: 4.69ms ± 0.61ms

### Mount wide tree (depth: 3, breadth: 6)

- flesh-cage: 12.96ms ± 4.13ms
- styled-components: 4.80ms ± 0.51ms
- emotion: 4.66ms ± 0.62ms

### Update dynamic styles (Sierpinski Triangle)

- flesh-cage: 10.57ms ± 0.62ms
- styled-components: 10.60ms ± 0.64ms
- emotion: 10.72ms ± 0.71ms

### Update skin/theme switching

- flesh-cage: 10.38ms ± 0.63ms
- styled-components: 10.37ms ± 0.56ms
- emotion: 10.38ms ± 0.59ms

## Notes

- The runner reported port 4173 in use and served the preview on 4174.
- `vite preview` exits with code 143 when the runner stops it; the benchmark run completed successfully.

## Run 3 (single provider variants)

### Mount deep tree (depth: 7, breadth: 2)

- flesh-cage: 13.36ms ± 3.25ms
- styled-components: 4.67ms ± 0.55ms
- emotion: 4.68ms ± 0.60ms

### Mount wide tree (depth: 3, breadth: 6)

- flesh-cage: 13.06ms ± 3.03ms
- styled-components: 4.66ms ± 0.88ms
- emotion: 4.59ms ± 0.61ms

### Mount deep tree (single provider)

- flesh-cage: 13.50ms ± 2.63ms
- styled-components: 4.59ms ± 0.51ms
- emotion: 4.52ms ± 0.37ms

### Mount wide tree (single provider)

- flesh-cage: 13.40ms ± 1.76ms
- styled-components: 4.75ms ± 0.44ms
- emotion: 4.60ms ± 0.42ms

### Update dynamic styles (Sierpinski Triangle)

- flesh-cage: 10.58ms ± 0.46ms
- styled-components: 10.68ms ± 0.69ms
- emotion: 10.66ms ± 0.56ms

### Update skin/theme switching

- flesh-cage: 10.42ms ± 0.38ms
- styled-components: 10.42ms ± 0.51ms
- emotion: 10.49ms ± 0.41ms

## Notes

- The runner reported port 4173 in use and served the preview on 4174.
- `vite preview` exits with code 143 when the runner stops it; the benchmark run completed successfully.

## Run 4 (stable props/objects)

### Mount deep tree (depth: 7, breadth: 2)

- flesh-cage: 13.41ms ± 3.20ms
- styled-components: 4.78ms ± 0.84ms
- emotion: 4.61ms ± 0.47ms

### Mount wide tree (depth: 3, breadth: 6)

- flesh-cage: 12.70ms ± 4.32ms
- styled-components: 4.59ms ± 0.70ms
- emotion: 5.03ms ± 1.90ms

### Mount deep tree (single provider)

- flesh-cage: 13.51ms ± 2.10ms
- styled-components: 4.68ms ± 0.84ms
- emotion: 4.60ms ± 0.56ms

### Mount wide tree (single provider)

- flesh-cage: 13.16ms ± 3.54ms
- styled-components: 4.66ms ± 0.58ms
- emotion: 4.74ms ± 0.56ms

### Update dynamic styles (Sierpinski Triangle)

- flesh-cage: 10.89ms ± 0.47ms
- styled-components: 10.73ms ± 0.66ms
- emotion: 10.63ms ± 0.61ms

### Update skin/theme switching

- flesh-cage: 10.58ms ± 0.47ms
- styled-components: 10.32ms ± 0.55ms
- emotion: 10.42ms ± 0.62ms

## Notes

- The runner reported port 4173 in use and served the preview on 4174.
- `vite preview` exits with code 143 when the runner stops it; the benchmark run completed successfully.
