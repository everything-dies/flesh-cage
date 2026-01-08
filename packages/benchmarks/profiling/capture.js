import puppeteer from 'puppeteer'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

/**
 * Automated Chrome DevTools profiling with Puppeteer
 * Captures traces, metrics, and performance data
 */

const IMPLEMENTATIONS = ['flesh-cage', 'styled-components', 'emotion']
const OUTPUT_DIR = './profiling/data'

async function captureProfile(implementation, testName) {
  console.log(`\n📊 Profiling: ${implementation} - ${testName}`)

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--enable-precise-memory-info',
      '--enable-gpu-benchmarking',
      '--disable-extensions',
      '--no-sandbox',
    ],
  })

  try {
    const page = await browser.newPage()

    // Capture console logs
    const logs = []
    page.on('console', (msg) => logs.push(msg.text()))

    // Navigate to benchmark page
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' })

    // Select implementation
    await page.select('#implementation-select', implementation)
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Start Chrome tracing
    const tracePath = join(OUTPUT_DIR, `${implementation}-${testName}-trace.json`)
    await page.tracing.start({
      path: tracePath,
      screenshots: false,
      categories: [
        '-*',
        'devtools.timeline',
        'disabled-by-default-devtools.timeline',
        'disabled-by-default-devtools.timeline.frame',
        'disabled-by-default-v8.cpu_profiler',
      ],
    })

    // Capture metrics before
    const metricsBefore = await page.metrics()
    const memoryBefore = await page.evaluate(() => {
      return {
        usedJSHeapSize: performance.memory?.usedJSHeapSize || 0,
        totalJSHeapSize: performance.memory?.totalJSHeapSize || 0,
        jsHeapSizeLimit: performance.memory?.jsHeapSizeLimit || 0,
      }
    })

    // Add performance marks in the page
    await page.evaluate(() => {
      window.performanceMarks = []
      const originalMark = performance.mark.bind(performance)
      const originalMeasure = performance.measure.bind(performance)

      performance.mark = function (name) {
        window.performanceMarks.push({ type: 'mark', name, timestamp: performance.now() })
        return originalMark(name)
      }

      performance.measure = function (name, start, end) {
        const result = originalMeasure(name, start, end)
        const entry = performance.getEntriesByName(name, 'measure')[0]
        if (entry) {
          window.performanceMarks.push({
            type: 'measure',
            name,
            duration: entry.duration,
            startTime: entry.startTime,
          })
        }
        return result
      }
    })

    // Run the benchmark
    const benchmarkSelector = `button[data-benchmark="${testName}"]`
    await page.waitForSelector(benchmarkSelector)

    // Start timing
    const startTime = Date.now()

    // Click run benchmark
    await page.click(benchmarkSelector)

    // Wait for completion (look for results)
    await page.waitForSelector('[data-testid="run-result"]', { timeout: 120000 })

    const endTime = Date.now()
    const wallClockTime = endTime - startTime

    // Capture metrics after
    const metricsAfter = await page.metrics()
    const memoryAfter = await page.evaluate(() => {
      return {
        usedJSHeapSize: performance.memory?.usedJSHeapSize || 0,
        totalJSHeapSize: performance.memory?.totalJSHeapSize || 0,
        jsHeapSizeLimit: performance.memory?.jsHeapSizeLimit || 0,
      }
    })

    // Get performance marks
    const performanceMarks = await page.evaluate(() => window.performanceMarks || [])

    // Get benchmark result
    const result = await page.evaluate(() => {
      const resultEl = document.querySelector('[data-testid="run-result"]')
      const meanText = resultEl?.querySelector('p:nth-child(1)')?.textContent || ''
      const stdDevText = resultEl?.querySelector('p:nth-child(2)')?.textContent || ''

      const mean = parseFloat(meanText.match(/[\d.]+/)?.[0] || '0')
      const stdDev = parseFloat(stdDevText.match(/[\d.]+/)?.[0] || '0')

      return { mean, stdDev }
    })

    // Stop tracing
    await page.tracing.stop()

    // Compile profile data
    const profile = {
      implementation,
      testName,
      timestamp: new Date().toISOString(),
      wallClockTime,
      benchmark: result,
      metrics: {
        before: metricsBefore,
        after: metricsAfter,
        delta: {
          Documents: metricsAfter.Documents - metricsBefore.Documents,
          Frames: metricsAfter.Frames - metricsBefore.Frames,
          JSEventListeners: metricsAfter.JSEventListeners - metricsBefore.JSEventListeners,
          Nodes: metricsAfter.Nodes - metricsBefore.Nodes,
          LayoutCount: metricsAfter.LayoutCount - metricsBefore.LayoutCount,
          RecalcStyleCount: metricsAfter.RecalcStyleCount - metricsBefore.RecalcStyleCount,
          JSHeapUsedSize: metricsAfter.JSHeapUsedSize - metricsBefore.JSHeapUsedSize,
          JSHeapTotalSize: metricsAfter.JSHeapTotalSize - metricsBefore.JSHeapTotalSize,
        },
      },
      memory: {
        before: memoryBefore,
        after: memoryAfter,
        delta: {
          usedJSHeapSize: memoryAfter.usedJSHeapSize - memoryBefore.usedJSHeapSize,
          totalJSHeapSize: memoryAfter.totalJSHeapSize - memoryBefore.totalJSHeapSize,
        },
      },
      performanceMarks,
      logs,
      tracePath,
    }

    // Save profile data
    const profilePath = join(OUTPUT_DIR, `${implementation}-${testName}-profile.json`)
    await writeFile(profilePath, JSON.stringify(profile, null, 2))

    console.log(`✅ Profile saved: ${profilePath}`)
    console.log(`   Trace saved: ${tracePath}`)
    console.log(`   Mean: ${result.mean.toFixed(2)}ms`)
    console.log(`   Memory delta: ${(profile.memory.delta.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`)
    console.log(`   Nodes created: ${profile.metrics.delta.Nodes}`)
    console.log(`   Layout count: ${profile.metrics.delta.LayoutCount}`)
    console.log(`   Style recalc: ${profile.metrics.delta.RecalcStyleCount}`)

    return profile
  } catch (error) {
    console.error(`❌ Error profiling ${implementation} - ${testName}:`, error.message)
    throw error
  } finally {
    await browser.close()
  }
}

async function main() {
  console.log('🚀 Starting automated profiling...')
  console.log('Make sure dev server is running on http://localhost:3001\n')

  // Create output directory
  await mkdir(OUTPUT_DIR, { recursive: true })

  const tests = [
    { name: 'mount-deep', selector: 'mount-deep' },
    { name: 'mount-wide', selector: 'mount-wide' },
    { name: 'mount-deep-single', selector: 'mount-deep-single' },
    { name: 'mount-wide-single', selector: 'mount-wide-single' },
    { name: 'update-triangle', selector: 'update-triangle' },
    { name: 'update-skin-switch', selector: 'update-skin-switch' },
  ]

  const profiles = []

  for (const impl of IMPLEMENTATIONS) {
    for (const test of tests) {
      try {
        const profile = await captureProfile(impl, test.name)
        profiles.push(profile)

        // Wait between runs
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`Failed to profile ${impl} - ${test.name}`)
      }
    }
  }

  // Save summary
  const summaryPath = join(OUTPUT_DIR, 'summary.json')
  await writeFile(summaryPath, JSON.stringify(profiles, null, 2))

  console.log(`\n✅ Profiling complete! Summary saved to ${summaryPath}`)
  console.log('\nRun: node profiling/analyze.js to analyze the results')
}

main().catch(console.error)
