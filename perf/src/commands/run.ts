import type { CommandModule } from 'yargs'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { runScenario } from '../orchestrator.js'
import { analyzeRuns } from '../analysis.js'
import { generateReport } from '../reporting.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface RunOptions {
  scenario: string
  runs: number
  warmup: number
  output: string
  headless: boolean
}

export const runCommand: CommandModule<{}, RunOptions> = {
  command: 'run <scenario>',
  describe: 'Run a performance profiling scenario',
  builder: (yargs) =>
    yargs
      .positional('scenario', {
        describe: 'Name of the scenario file to run (e.g., simple-usage)',
        type: 'string',
        demandOption: true,
      })
      .option('runs', {
        alias: 'r',
        describe: 'Number of times to run the scenario for measurement',
        type: 'number',
        default: 10,
      })
      .option('warmup', {
        alias: 'w',
        describe: 'Number of warmup runs before measurement',
        type: 'number',
        default: 1,
      })
      .option('output', {
        alias: 'o',
        describe: 'Directory to save artifacts',
        type: 'string',
        default: 'artifacts', // Relative to project root
      })
      .option('headless', {
        describe: 'Run browser in headless mode',
        type: 'boolean',
        default: true,
      }),
  handler: async (argv) => {
    try {
      console.log(`Starting performance run for scenario: ${argv.scenario}`)
      const projectRoot = path.resolve(process.cwd(), '..')

      const scenarioFileName = argv.scenario.endsWith('.scenario.tsx')
        ? argv.scenario
        : `${argv.scenario}.scenario.tsx`

      const scenarioPath = path.resolve(
        projectRoot,
        'perf',
        'scenarios',
        scenarioFileName
      )

      if (!fs.existsSync(scenarioPath)) {
        console.error(`Error: Scenario file not found at ${scenarioPath}`)
        process.exit(1)
      }

      const isLeakScenario = argv.scenario.includes('leak')
      const timestamp = new Date().toISOString().replace(/[:]/g, '-')
      const outputDir = path.resolve(
        projectRoot,
        argv.output,
        argv.scenario,
        timestamp
      )

      await fs.promises.mkdir(outputDir, { recursive: true })
      console.log(`Artifacts will be saved to: ${outputDir}`)

      const results = await runScenario({
        scenarioPath,
        runs: argv.runs,
        warmup: argv.warmup,
        outputDir,
        headless: argv.headless,
        isLeakScenario,
      })

      if (results.length > 0) {
        console.log('\nAnalyzing results...')
        const analysis = await analyzeRuns(results)
        await generateReport(analysis, argv.scenario, outputDir)
        console.log('\n✅ Performance analysis complete.')
      } else {
        console.log('\nNo measurement runs were performed, skipping analysis.')
      }
    } catch (error) {
      console.error('\n❌ An error occurred during the performance run:')
      console.error(error)
      process.exit(1)
    }
  },
}
