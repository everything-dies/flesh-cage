import fs from 'fs/promises'
import path from 'path'
import Mustache from 'mustache'
import { RunAnalysis, AnalysisMetrics } from './analysis.js'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

type Stats = {
  average: string
  p95: string
  stddev: string
}

type Summary = {
  [K in keyof AnalysisMetrics]?: Stats
}

function calculateStats(numbers: number[]): Stats {
  if (numbers.length === 0) {
    return { average: 'N/A', p95: 'N/A', stddev: 'N/A' }
  }
  const sum = numbers.reduce((a, b) => a + b, 0)
  const avg = sum / numbers.length

  const sorted = [...numbers].sort((a, b) => a - b)
  const p95Index = Math.floor(sorted.length * 0.95)
  const p95 = sorted[p95Index]

  const stddev = Math.sqrt(
    numbers.map((x) => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) /
      numbers.length
  )

  return {
    average: avg.toFixed(2),
    p95: p95.toFixed(2),
    stddev: stddev.toFixed(2),
  }
}

function createSummary(analyses: RunAnalysis[]): Summary {
  const metrics: { [K in keyof AnalysisMetrics]?: number[] } = {
    totalGCTimeMs: [],
    gcCount: [],
    majorGcCount: [],
    meanGcPauseMs: [],
    cpuTimeMs: [],
    heapUsedBeforeBytes: [],
    heapUsedAfterBytes: [],
    heapUsedDeltaBytes: [],
    uaMemoryBytes: [],
  }

  for (const analysis of analyses) {
    metrics.totalGCTimeMs?.push(analysis.metrics.totalGCTimeMs)
    metrics.gcCount?.push(analysis.metrics.gcCount)
    metrics.majorGcCount?.push(analysis.metrics.majorGcCount)
    metrics.meanGcPauseMs?.push(analysis.metrics.meanGcPauseMs)
    metrics.cpuTimeMs?.push(analysis.metrics.cpuTimeMs)
    metrics.heapUsedBeforeBytes?.push(analysis.metrics.heapUsedBeforeBytes)
    metrics.heapUsedAfterBytes?.push(analysis.metrics.heapUsedAfterBytes)
    metrics.heapUsedDeltaBytes?.push(analysis.metrics.heapUsedDeltaBytes)
    if (analysis.uaMemoryAvailable) {
      metrics.uaMemoryBytes?.push(analysis.metrics.uaMemoryBytes)
    }
  }

  return {
    totalGCTimeMs: calculateStats(metrics.totalGCTimeMs),
    gcCount: calculateStats(metrics.gcCount),
    majorGcCount: calculateStats(metrics.majorGcCount),
    meanGcPauseMs: calculateStats(metrics.meanGcPauseMs),
    cpuTimeMs: calculateStats(metrics.cpuTimeMs),
    heapUsedBeforeBytes: calculateStats(metrics.heapUsedBeforeBytes),
    heapUsedAfterBytes: calculateStats(metrics.heapUsedAfterBytes),
    heapUsedDeltaBytes: calculateStats(metrics.heapUsedDeltaBytes),
    uaMemoryBytes: calculateStats(metrics.uaMemoryBytes),
  }
}

function bytesToMegabytes(bytes: number): number {
  return bytes / (1024 * 1024)
}

function statsToMegabytes(stats?: Stats): Stats {
  if (!stats || stats.average === 'N/A') {
    return { average: 'N/A', p95: 'N/A', stddev: 'N/A' }
  }
  return {
    average: bytesToMegabytes(Number(stats.average)).toFixed(2),
    p95: bytesToMegabytes(Number(stats.p95)).toFixed(2),
    stddev: bytesToMegabytes(Number(stats.stddev)).toFixed(2),
  }
}

export async function generateReport(
  analyses: RunAnalysis[],
  scenarioName: string,
  outputDir: string
): Promise<void> {
  const summary = createSummary(analyses)

  // Write machine-readable summary
  const summaryJsonPath = path.join(outputDir, 'summary.json')
  await fs.writeFile(
    summaryJsonPath,
    JSON.stringify({ scenarioName, summary, runs: analyses }, null, 2)
  )
  console.log(`\nMachine-readable summary saved to: ${summaryJsonPath}`)

  // Write human-readable report
  const templatePath = path.resolve(
    __dirname,
    'templates',
    'report.md.mustache'
  )
  const template = await fs.readFile(templatePath, 'utf-8')

  const view = {
    scenarioName,
    timestamp: new Date().toUTCString(),
    summary,
    summaryHeapUsedBeforeMB: statsToMegabytes(summary.heapUsedBeforeBytes),
    summaryHeapUsedAfterMB: statsToMegabytes(summary.heapUsedAfterBytes),
    summaryHeapUsedDeltaMB: statsToMegabytes(summary.heapUsedDeltaBytes),
    summaryUaMemoryMB: statsToMegabytes(summary.uaMemoryBytes),
    uaMemoryAvailable: analyses.some((a) => a.uaMemoryAvailable),
    runs: analyses.map((a) => ({
      run: a.run,
      metrics: {
        totalGCTimeMs: a.metrics.totalGCTimeMs.toFixed(2),
        meanGcPauseMs: a.metrics.meanGcPauseMs.toFixed(2),
        gcCount: a.metrics.gcCount,
        majorGcCount: a.metrics.majorGcCount,
        cpuTimeMs: a.metrics.cpuTimeMs.toFixed(2),
        heapUsedBeforeMB: bytesToMegabytes(
          a.metrics.heapUsedBeforeBytes
        ).toFixed(2),
        heapUsedAfterMB: bytesToMegabytes(a.metrics.heapUsedAfterBytes).toFixed(
          2
        ),
        heapUsedDeltaMB: bytesToMegabytes(a.metrics.heapUsedDeltaBytes).toFixed(
          2
        ),
        uaMemoryMB: a.uaMemoryAvailable
          ? bytesToMegabytes(a.metrics.uaMemoryBytes).toFixed(2)
          : 'N/A',
      },
    })),
  }

  const reportMd = Mustache.render(template, view)
  const reportMdPath = path.join(outputDir, 'report.md')
  await fs.writeFile(reportMdPath, reportMd)
  console.log(`Human-readable report saved to: ${reportMdPath}`)
}
