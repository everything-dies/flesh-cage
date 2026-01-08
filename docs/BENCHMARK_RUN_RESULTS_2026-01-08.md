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
