import fs from 'fs/promises'
import { RunResult } from './orchestrator.js'

// From DevTools, but simplified.
// https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/core/sdk/TracingModel.ts
interface TraceEvent {
  cat: string
  name: string
  ph: 'X' | 'I' | 'B' | 'E' // Phase: Complete, Instant, Begin, End
  ts: number // Timestamp in microseconds
  dur?: number // Duration in microseconds
  pid: number
  tid: number
  args: {
    data?: any
    [key: string]: any
  }
}

export interface AnalysisMetrics {
  totalGCTimeMs: number
  gcCount: number
  majorGcCount: number
  meanGcPauseMs: number
  cpuTimeMs: number
  heapUsedBeforeBytes: number
  heapUsedAfterBytes: number
  heapUsedDeltaBytes: number
  uaMemoryBytes: number
}

export interface RunAnalysis {
  run: number
  uaMemoryAvailable: boolean
  metrics: AnalysisMetrics
}

function analyzeTrace(traceEvents: TraceEvent[]): AnalysisMetrics {
  const gcEvents = traceEvents.filter(
    (e) => e.cat.includes('v8') && e.name.startsWith('V8.GC')
  )

  const totalGCTimeMs =
    gcEvents.reduce((sum, e) => sum + (e.dur || 0), 0) / 1000
  const gcCount = gcEvents.length
  const majorGcCount = gcEvents.filter((e) => e.args.data?.isMajorMC).length
  const meanGcPauseMs = totalGCTimeMs / gcCount || 0

  return {
    totalGCTimeMs,
    gcCount,
    majorGcCount,
    meanGcPauseMs,
    cpuTimeMs: 0,
    heapUsedBeforeBytes: 0,
    heapUsedAfterBytes: 0,
    heapUsedDeltaBytes: 0,
    uaMemoryBytes: 0,
  }
}

function analyzeCpuProfile(profile: { timeDeltas?: number[] } | null): number {
  if (!profile?.timeDeltas?.length) {
    return 0
  }
  const totalMicroseconds = profile.timeDeltas.reduce(
    (sum, delta) => sum + delta,
    0
  )
  return totalMicroseconds / 1000
}

export async function analyzeRuns(
  results: RunResult[]
): Promise<RunAnalysis[]> {
  const analyses: RunAnalysis[] = []

  for (const result of results) {
    const metrics: AnalysisMetrics = {
      totalGCTimeMs: 0,
      gcCount: 0,
      majorGcCount: 0,
      meanGcPauseMs: 0,
      cpuTimeMs: 0,
      heapUsedBeforeBytes: 0,
      heapUsedAfterBytes: 0,
      heapUsedDeltaBytes: 0,
      uaMemoryBytes: 0,
    }

    if (result.artifacts.trace) {
      const traceData = await fs.readFile(result.artifacts.trace, 'utf-8')
      const traceJson = JSON.parse(traceData)
      const traceEvents: TraceEvent[] = traceJson.traceEvents || traceJson // Handle both formats

      Object.assign(metrics, analyzeTrace(traceEvents))
    }

    if (result.artifacts.cpuProfile) {
      const cpuProfileData = await fs.readFile(
        result.artifacts.cpuProfile,
        'utf-8'
      )
      const cpuProfileJson = JSON.parse(cpuProfileData)
      metrics.cpuTimeMs = analyzeCpuProfile(cpuProfileJson)
    }

    if (result.heapUsage) {
      metrics.heapUsedBeforeBytes = result.heapUsage.usedBeforeBytes
      metrics.heapUsedAfterBytes = result.heapUsage.usedAfterBytes
      metrics.heapUsedDeltaBytes =
        result.heapUsage.usedAfterBytes - result.heapUsage.usedBeforeBytes
    }
    if (typeof result.uaMemoryBytes === 'number') {
      metrics.uaMemoryBytes = result.uaMemoryBytes
    }

    analyses.push({
      run: result.run,
      uaMemoryAvailable: typeof result.uaMemoryBytes === 'number',
      metrics,
    })
  }

  return analyses
}
