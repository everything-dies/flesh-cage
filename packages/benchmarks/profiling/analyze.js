import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * Analyze captured profiling data
 * Identifies bottlenecks and generates comparison reports
 */

const OUTPUT_DIR = './profiling/data'

function analyzeTrace(trace) {
  // Parse Chrome trace format
  const events = trace.traceEvents || []

  // Find key events
  const paintEvents = events.filter((e) => e.name === 'Paint')
  const layoutEvents = events.filter((e) => e.name === 'Layout')
  const styleEvents = events.filter((e) => e.name === 'UpdateLayoutTree')
  const scriptEvents = events.filter((e) => e.cat?.includes('devtools.timeline') && e.name === 'EvaluateScript')
  const functionCalls = events.filter((e) => e.cat?.includes('v8.cpu_profiler'))

  // Calculate totals
  const totalPaintTime = paintEvents.reduce((sum, e) => sum + (e.dur || 0), 0) / 1000
  const totalLayoutTime = layoutEvents.reduce((sum, e) => sum + (e.dur || 0), 0) / 1000
  const totalStyleTime = styleEvents.reduce((sum, e) => sum + (e.dur || 0), 0) / 1000
  const totalScriptTime = scriptEvents.reduce((sum, e) => sum + (e.dur || 0), 0) / 1000

  // Find hot functions
  const functionTimes = {}
  functionCalls.forEach((event) => {
    if (event.dur && event.name) {
      functionTimes[event.name] = (functionTimes[event.name] || 0) + event.dur / 1000
    }
  })

  const hotFunctions = Object.entries(functionTimes)
    .map(([name, time]) => ({ name, time }))
    .sort((a, b) => b.time - a.time)
    .slice(0, 10)

  return {
    events: {
      total: events.length,
      paint: paintEvents.length,
      layout: layoutEvents.length,
      style: styleEvents.length,
      script: scriptEvents.length,
    },
    timing: {
      paint: totalPaintTime,
      layout: totalLayoutTime,
      style: totalStyleTime,
      script: totalScriptTime,
      total: totalPaintTime + totalLayoutTime + totalStyleTime + totalScriptTime,
    },
    hotFunctions,
  }
}

async function analyzeProfile(profilePath) {
  const profile = JSON.parse(await readFile(profilePath, 'utf-8'))

  console.log(`\n${'='.repeat(80)}`)
  console.log(`📊 ${profile.implementation} - ${profile.testName}`)
  console.log('='.repeat(80))

  console.log('\n⏱️  Benchmark Results:')
  console.log(`   Mean: ${profile.benchmark.mean.toFixed(2)}ms`)
  console.log(`   Std Dev: ${profile.benchmark.stdDev.toFixed(2)}ms`)
  console.log(`   Wall Clock: ${profile.wallClockTime}ms`)

  console.log('\n💾 Memory:')
  const memDeltaMB = profile.memory.delta.usedJSHeapSize / 1024 / 1024
  const memBeforeMB = profile.memory.before.usedJSHeapSize / 1024 / 1024
  const memAfterMB = profile.memory.after.usedJSHeapSize / 1024 / 1024
  console.log(`   Before: ${memBeforeMB.toFixed(2)}MB`)
  console.log(`   After: ${memAfterMB.toFixed(2)}MB`)
  console.log(`   Delta: ${memDeltaMB.toFixed(2)}MB`)

  console.log('\n📈 Metrics:')
  console.log(`   DOM Nodes Created: ${profile.metrics.delta.Nodes}`)
  console.log(`   Layout Events: ${profile.metrics.delta.LayoutCount}`)
  console.log(`   Style Recalcs: ${profile.metrics.delta.RecalcStyleCount}`)
  console.log(`   Event Listeners: ${profile.metrics.delta.JSEventListeners}`)

  // Analyze trace if available
  if (profile.tracePath) {
    try {
      const trace = JSON.parse(await readFile(profile.tracePath, 'utf-8'))
      const analysis = analyzeTrace(trace)

      console.log('\n🔥 Chrome Trace Analysis:')
      console.log(`   Total Events: ${analysis.events.total}`)
      console.log(`   Paint: ${analysis.timing.paint.toFixed(2)}ms (${analysis.events.paint} events)`)
      console.log(`   Layout: ${analysis.timing.layout.toFixed(2)}ms (${analysis.events.layout} events)`)
      console.log(`   Style: ${analysis.timing.style.toFixed(2)}ms (${analysis.events.style} events)`)
      console.log(`   Script: ${analysis.timing.script.toFixed(2)}ms (${analysis.events.script} events)`)

      if (analysis.hotFunctions.length > 0) {
        console.log('\n🔥 Hot Functions (top 10):')
        analysis.hotFunctions.forEach((fn, i) => {
          console.log(`   ${i + 1}. ${fn.name}: ${fn.time.toFixed(2)}ms`)
        })
      }

      return { ...profile, traceAnalysis: analysis }
    } catch (error) {
      console.log(`   ⚠️  Could not analyze trace: ${error.message}`)
    }
  }

  return profile
}

function generateComparison(profiles) {
  console.log('\n\n' + '='.repeat(80))
  console.log('📊 COMPARATIVE ANALYSIS')
  console.log('='.repeat(80))

  // Group by test
  const byTest = {}
  profiles.forEach((p) => {
    if (!byTest[p.testName]) byTest[p.testName] = {}
    byTest[p.testName][p.implementation] = p
  })

  Object.entries(byTest).forEach(([testName, impls]) => {
    console.log(`\n\n### ${testName.toUpperCase()}`)

    // Find baseline (fastest)
    const means = Object.entries(impls).map(([impl, p]) => ({
      impl,
      mean: p.benchmark.mean,
    }))
    means.sort((a, b) => a.mean - b.mean)
    const baseline = means[0]

    console.log('\n⏱️  Performance (Mean):')
    means.forEach(({ impl, mean }) => {
      const diff = ((mean - baseline.mean) / baseline.mean) * 100
      const comparison = impl === baseline.impl ? '(baseline)' : `(+${diff.toFixed(1)}%)`
      console.log(`   ${impl.padEnd(20)} ${mean.toFixed(2)}ms ${comparison}`)
    })

    // Memory comparison
    console.log('\n💾 Memory Delta:')
    Object.entries(impls)
      .sort((a, b) => a[1].memory.delta.usedJSHeapSize - b[1].memory.delta.usedJSHeapSize)
      .forEach(([impl, p]) => {
        const memMB = p.memory.delta.usedJSHeapSize / 1024 / 1024
        console.log(`   ${impl.padEnd(20)} ${memMB.toFixed(2)}MB`)
      })

    // DOM operations
    console.log('\n📈 DOM Operations:')
    Object.entries(impls).forEach(([impl, p]) => {
      console.log(`   ${impl.padEnd(20)} ${p.metrics.delta.Nodes} nodes, ${p.metrics.delta.LayoutCount} layouts, ${p.metrics.delta.RecalcStyleCount} style recalcs`)
    })

    // Trace timing breakdown (if available)
    if (Object.values(impls).some((p) => p.traceAnalysis)) {
      console.log('\n🔍 Breakdown (from trace):')
      Object.entries(impls).forEach(([impl, p]) => {
        if (p.traceAnalysis) {
          const t = p.traceAnalysis.timing
          console.log(
            `   ${impl.padEnd(20)} Paint: ${t.paint.toFixed(1)}ms, Layout: ${t.layout.toFixed(1)}ms, Style: ${t.style.toFixed(1)}ms, Script: ${t.script.toFixed(1)}ms`
          )
        }
      })
    }
  })

  // Overall winner
  console.log('\n\n' + '='.repeat(80))
  console.log('🏆 OVERALL RESULTS')
  console.log('='.repeat(80))

  const implScores = {}
  Object.values(byTest).forEach((impls) => {
    const sorted = Object.entries(impls).sort((a, b) => a[1].benchmark.mean - b[1].benchmark.mean)
    sorted.forEach(([impl], i) => {
      implScores[impl] = (implScores[impl] || 0) + (sorted.length - i)
    })
  })

  const rankings = Object.entries(implScores)
    .sort((a, b) => b[1] - a[1])
    .map(([impl], i) => {
      const medals = ['🥇', '🥈', '🥉']
      return `${medals[i] || '  '} ${i + 1}. ${impl}`
    })

  console.log('\nPerformance Ranking:')
  rankings.forEach((r) => console.log(`   ${r}`))
}

async function main() {
  console.log('🔍 Analyzing profiling data...\n')

  try {
    // Read summary
    const summaryPath = join(OUTPUT_DIR, 'summary.json')
    const summary = JSON.parse(await readFile(summaryPath, 'utf-8'))

    // Analyze each profile
    const analyzedProfiles = []
    for (const profileData of summary) {
      const profilePath = join(
        OUTPUT_DIR,
        `${profileData.implementation}-${profileData.testName}-profile.json`
      )
      const analyzed = await analyzeProfile(profilePath)
      analyzedProfiles.push(analyzed)
    }

    // Generate comparison
    generateComparison(analyzedProfiles)

    console.log('\n✅ Analysis complete!')
  } catch (error) {
    console.error('❌ Error analyzing profiles:', error.message)
    console.error('\nMake sure you ran: node profiling/capture.js first')
    process.exit(1)
  }
}

main().catch(console.error)
