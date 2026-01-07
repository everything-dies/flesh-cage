/**
 * Automated benchmark runner using Puppeteer
 * Runs all three implementations and compares results
 */
const puppeteer = require('puppeteer')
const { spawn } = require('child_process')

const PORT = 4173
const URL = `http://localhost:${PORT}`

const implementations = ['flesh-cage', 'styled-components', 'emotion']

async function runBenchmarks() {
  console.log('Starting HTTP server...')

  // Start the preview server
  const server = spawn('npm', ['run', 'preview'], {
    stdio: 'inherit',
    shell: true,
  })

  // Wait for server to be ready
  await new Promise((resolve) => setTimeout(resolve, 3000))

  console.log('Launching browser...')
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()

  console.log('Navigating to benchmarks page...')
  await page.goto(URL, { waitUntil: 'networkidle2' })

  const allResults = {}

  // Run benchmarks for each implementation
  for (const impl of implementations) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Running benchmarks for: ${impl.toUpperCase()}`)
    console.log('='.repeat(60))

    allResults[impl] = {}

    // Click the implementation button
    await page.evaluate((implName) => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const button = buttons.find(b => b.textContent?.includes(implName))
      if (button) button.click()
    }, impl)

    // Wait for UI to update
    await new Promise(resolve => setTimeout(resolve, 500))

    // Find all benchmark sections (excluding the selector buttons)
    const sections = await page.$$('h3')

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i]

      // Get the benchmark name
      const name = await page.evaluate((el) => el.textContent, section)

      // Skip if this is not a benchmark section
      if (!name || name.includes('Select') || name.includes('Architecture')) {
        continue
      }

      console.log(`\nRunning: ${name}`)

      // Find the button in this section
      const button = await section.evaluateHandle((el) => {
        const parent = el.closest('div')
        return parent?.querySelector('button')
      })

      // Check if button exists
      const hasButton = await button.evaluate((btn) => btn !== null && typeof btn.click === 'function')

      if (!hasButton) {
        continue
      }

      // Click the button to start the benchmark
      await button.asElement().click()

      // Wait for results to appear
      try {
        await page.waitForFunction(
          (index) => {
            const sections = document.querySelectorAll('h3')
            const parent = sections[index]?.closest('div')
            const resultDiv = parent?.querySelector('[data-testid="run-result"]')
            const meanText = resultDiv?.querySelector('p:nth-child(1)')?.textContent
            return meanText && meanText.includes('ms') && !meanText.includes('NaN')
          },
          { timeout: 60000 },
          i
        )

        // Extract results
        const results = await page.evaluate((index) => {
          const sections = document.querySelectorAll('h3')
          const parent = sections[index]?.closest('div')
          const resultDiv = parent?.querySelector('[data-testid="run-result"]')

          const meanText = resultDiv?.querySelector('p:nth-child(1)')?.textContent || ''
          const stdDevText = resultDiv?.querySelector('p:nth-child(2)')?.textContent || ''

          // Extract numbers
          const mean = parseFloat(meanText.match(/[\d.]+/)?.[0] || '0')
          const stdDev = parseFloat(stdDevText.match(/[\d.]+/)?.[0] || '0')

          return { mean, stdDev, meanText, stdDevText }
        }, i)

        console.log(`  ${results.meanText}`)
        console.log(`  ${results.stdDevText}`)

        // Store results for comparison
        const benchmarkName = name.replace(`${impl} - `, '')
        allResults[impl][benchmarkName] = results

      } catch (error) {
        console.log(`  ERROR: Benchmark timed out or failed`)
      }

      // Wait between benchmarks
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  // Print comparison table
  console.log(`\n${'='.repeat(60)}`)
  console.log('COMPARISON TABLE')
  console.log('='.repeat(60))

  const benchmarks = Object.keys(allResults[implementations[0]] || {})

  for (const benchmark of benchmarks) {
    console.log(`\n${benchmark}`)
    console.log('-'.repeat(60))

    for (const impl of implementations) {
      const result = allResults[impl]?.[benchmark]
      if (result) {
        const padding = ' '.repeat(Math.max(0, 20 - impl.length))
        console.log(`  ${impl}:${padding}${result.mean.toFixed(2)}ms ± ${result.stdDev.toFixed(2)}ms`)
      }
    }

    // Calculate relative performance
    const means = implementations.map(impl => allResults[impl]?.[benchmark]?.mean || Infinity)
    const fastest = Math.min(...means)
    const fastestImpl = implementations[means.indexOf(fastest)]

    console.log(`\n  Fastest: ${fastestImpl} (baseline)`)

    for (const impl of implementations) {
      const mean = allResults[impl]?.[benchmark]?.mean
      if (mean && impl !== fastestImpl) {
        const slower = ((mean / fastest - 1) * 100).toFixed(1)
        console.log(`  ${impl}: ${slower}% slower`)
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log('Benchmarks complete!')
  console.log('='.repeat(60))

  await browser.close()
  server.kill()
  process.exit(0)
}

runBenchmarks().catch((error) => {
  console.error('Benchmark error:', error)
  process.exit(1)
})
