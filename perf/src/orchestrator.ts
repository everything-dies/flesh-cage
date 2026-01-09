import { chromium, Browser, Page } from 'playwright'
import { build } from 'esbuild'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import http from 'http'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export interface RunOptions {
  scenarioPath: string
  runs: number
  warmup: number
  outputDir: string
  headless: boolean
  isLeakScenario: boolean
}

export interface RunResult {
  run: number
  heapUsage?: {
    usedBeforeBytes: number
    usedAfterBytes: number
    totalBeforeBytes: number
    totalAfterBytes: number
  }
  uaMemoryBytes?: number | null
  artifacts: {
    trace?: string
    cpuProfile?: string
    heapBefore?: string
    heapAfter?: string
  }
}

async function prepareScenario(scenarioPath: string): Promise<string> {
  const result = await build({
    stdin: {
      contents: `
        import * as React from 'react';
        import * as ReactDOM from 'react-dom/client';
        import * as scenario from '${scenarioPath.replace(/\\/g, '\\\\')}';
        window.React = React;
        window.ReactDOM = ReactDOM;
        window.scenario = scenario;
      `,
      resolveDir: path.dirname(scenarioPath),
      loader: 'ts',
    },
    bundle: true,
    write: false,
    format: 'iife',
    jsx: 'automatic', // Instruct esbuild to transform JSX
    absWorkingDir: path.resolve(__dirname, '..', '..'),
  })
  if (!result.outputFiles[0]) {
    throw new Error('esbuild failed to generate output')
  }
  return result.outputFiles[0].text
}

async function setupPage(
  browser: Browser,
  scenarioJs: string,
  baseUrl: string
): Promise<Page> {
  const page = await browser.newPage()
  await page.goto(baseUrl)

  await page.addScriptTag({ content: scenarioJs })

  page.on('console', (msg) => console.log(`[Browser Console]: ${msg.text()}`))
  return page
}

async function startScenarioServer(): Promise<{
  server: http.Server
  url: string
}> {
  const templatePath = path.resolve(
    __dirname,
    '..',
    'scenarios',
    'template.html'
  )
  const templateHtml = await fs.readFile(templatePath, 'utf-8')

  const server = http.createServer((req, res) => {
    if (!req.url || req.url === '/') {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Permissions-Policy': 'measure-user-agent-specific-memory=(self)',
      })
      res.end(templateHtml)
      return
    }
    res.writeHead(404)
    res.end()
  })

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve())
  })

  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Failed to start scenario server')
  }
  return { server, url: `http://127.0.0.1:${address.port}/` }
}

async function collectHeapSnapshotToFile(
  cdp: any,
  filePath: string
): Promise<void> {
  const fileHandle = await fs.open(filePath, 'w')
  let pending = Promise.resolve()
  let resolveDone: (() => void) | null = null
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve
  })

  const onChunk = (event: { chunk: string }) => {
    pending = pending.then(() => fileHandle.write(event.chunk)).then(() => {})
  }
  const onProgress = (event: { done: number; total: number }) => {
    if (event.done >= event.total && resolveDone) {
      resolveDone()
    }
  }

  cdp.on('HeapProfiler.addHeapSnapshotChunk', onChunk)
  cdp.on('HeapProfiler.reportHeapSnapshotProgress', onProgress)

  await cdp.send('HeapProfiler.takeHeapSnapshot', { reportProgress: true })
  await done
  await pending

  cdp.off('HeapProfiler.addHeapSnapshotChunk', onChunk)
  cdp.off('HeapProfiler.reportHeapSnapshotProgress', onProgress)

  await fileHandle.close()
}

async function collectTrace(cdp: any): Promise<any[]> {
  const events: any[] = []
  let resolveDone: (() => void) | null = null
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve
  })

  const onData = (event: { value: any[] }) => {
    events.push(...event.value)
  }
  const onComplete = () => {
    if (resolveDone) {
      resolveDone()
    }
  }

  cdp.on('Tracing.dataCollected', onData)
  cdp.on('Tracing.tracingComplete', onComplete)

  await cdp.send('Tracing.end')
  await done

  cdp.off('Tracing.dataCollected', onData)
  cdp.off('Tracing.tracingComplete', onComplete)

  return events
}

export async function runScenario(options: RunOptions): Promise<RunResult[]> {
  const { scenarioPath, runs, warmup, outputDir, headless, isLeakScenario } =
    options
  const totalRuns = warmup + runs
  const results: RunResult[] = []
  const skipHeapSnapshots = process.env['PERF_SKIP_HEAP'] === '1'

  console.log('Preparing scenario...')
  const scenarioJs = await prepareScenario(scenarioPath)

  console.log(`Launching browser (headless: ${headless})...`)
  const channel = process.env['PERF_CHROME_CHANNEL'] || undefined
  const browser = await chromium.launch({
    headless,
    channel,
    args: [
      '--enable-precise-memory-info',
      '--js-flags=--expose-gc',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--enable-blink-features=MeasureMemory',
      '--enable-features=MeasureMemory',
    ],
  })

  const { server, url } = await startScenarioServer()

  try {
    for (let i = 1; i <= totalRuns; i++) {
      const isWarmup = i <= warmup
      console.log(
        `\nRunning scenario: Run ${i}/${totalRuns} ${isWarmup ? '(Warmup)' : ''}`
      )

      const page = await setupPage(browser, scenarioJs, url)
      const cdp = await page.context().newCDPSession(page)

      // Enable profilers
      await cdp.send('Runtime.enable')
      await cdp.send('Profiler.enable')
      await cdp.send('HeapProfiler.enable')

      const scenarioOutputDir = path.join(outputDir, `run-${i}`)
      if (!isWarmup) {
        await fs.mkdir(scenarioOutputDir, { recursive: true })
        await cdp.send('Tracing.start', {
          categories:
            'devtools.timeline,v8.execute,blink.user_timing,v8,disabled-by-default-v8.gc',
          transferMode: 'ReportEvents',
        })
        await cdp.send('Profiler.start')
      }

      const heapBeforePath = path.join(
        scenarioOutputDir,
        'heap-before.heapsnapshot'
      )
      let heapUsageBefore = { usedSize: 0, totalSize: 0 }
      if (!isWarmup) {
        await page.evaluate(() => (window as any).gc())
        heapUsageBefore = await cdp.send('Runtime.getHeapUsage')
        if (!skipHeapSnapshots) {
          await collectHeapSnapshotToFile(cdp, heapBeforePath)
        }
      }

      // Run the workload
      await page.evaluate(async (leakScenario) => {
        const { React, ReactDOM, scenario } = window as any
        const rootElement = document.getElementById('root')
        const root = ReactDOM.createRoot(rootElement)

        if (typeof scenario.run === 'function') {
          await scenario.run({ root, React, ReactDOM, leakScenario })
          return
        }

        const { Workload } = scenario
        if (leakScenario) {
          for (let i = 0; i < 500; i++) {
            root.render(React.createElement(Workload, { iteration: i }))
            await new Promise((resolve) => setTimeout(resolve, 10))
          }
        } else {
          await new Promise<void>((resolve) => {
            root.render(React.createElement(Workload))
            setTimeout(resolve, 200)
          })
        }
      }, isLeakScenario)

      // Force GC
      await page.evaluate(() => (window as any).gc())
      const heapUsageAfter = !isWarmup
        ? await cdp.send('Runtime.getHeapUsage')
        : { usedSize: 0, totalSize: 0 }
      const uaMemoryAfter = !isWarmup
        ? await page.evaluate(async () => {
            try {
              if (
                typeof performance.measureUserAgentSpecificMemory !== 'function'
              ) {
                return null
              }
              const result = await performance.measureUserAgentSpecificMemory()
              return result?.bytes ?? null
            } catch {
              return null
            }
          })
        : null

      const runResult: RunResult = {
        run: i,
        heapUsage: !isWarmup
          ? {
              usedBeforeBytes: heapUsageBefore.usedSize,
              usedAfterBytes: heapUsageAfter.usedSize,
              totalBeforeBytes: heapUsageBefore.totalSize,
              totalAfterBytes: heapUsageAfter.totalSize,
            }
          : undefined,
        uaMemoryBytes: !isWarmup ? uaMemoryAfter : null,
        artifacts: {},
      }

      if (!isWarmup) {
        const { profile } = await cdp.send('Profiler.stop')
        const traceEvents = await collectTrace(cdp)
        const heapAfterPath = path.join(
          scenarioOutputDir,
          'heap-after.heapsnapshot'
        )
        if (!skipHeapSnapshots) {
          await collectHeapSnapshotToFile(cdp, heapAfterPath)
        }

        const tracePath = path.join(scenarioOutputDir, 'trace.json')
        const cpuProfilePath = path.join(scenarioOutputDir, 'cpu.cpuprofile')

        await fs.writeFile(tracePath, JSON.stringify(traceEvents, null, 2))
        await fs.writeFile(cpuProfilePath, JSON.stringify(profile, null, 2))

        runResult.artifacts.trace = tracePath
        runResult.artifacts.cpuProfile = cpuProfilePath
        if (!skipHeapSnapshots) {
          runResult.artifacts.heapBefore = heapBeforePath
          runResult.artifacts.heapAfter = heapAfterPath
        }
        results.push(runResult)
      }

      await cdp.detach()
      await page.close()
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })
    await browser.close()
  }

  return results
}
