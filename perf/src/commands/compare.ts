import type { CommandModule } from 'yargs'
import path from 'path'
import fs from 'fs/promises'
import chalk from 'chalk'

interface CompareOptions {
  baseline: string
  current: string
  threshold: number
}

// A simplified structure of what we expect in summary.json
interface SummaryFile {
  summary: {
    [metric: string]: {
      average: string
    }
  }
}

export const compareCommand: CommandModule<{}, CompareOptions> = {
  command: 'compare',
  describe: 'Compare two performance reports for regressions',
  builder: (yargs) =>
    yargs
      .option('baseline', {
        alias: 'b',
        describe: 'Path to the baseline summary.json file',
        type: 'string',
        demandOption: true,
      })
      .option('current', {
        alias: 'c',
        describe: 'Path to the current summary.json file to compare',
        type: 'string',
        demandOption: true,
      })
      .option('threshold', {
        alias: 't',
        describe: 'Regression threshold percentage (e.g., 10 for 10%)',
        type: 'number',
        default: 10,
      }),
  handler: async (argv) => {
    try {
      console.log(chalk.bold(`Comparing performance reports`))
      console.log(`  - Baseline:  ${argv.baseline}`)
      console.log(`  - Current:   ${argv.current}`)
      console.log(`  - Threshold: ${argv.threshold}%\n`)

      const baselinePath = path.resolve(process.cwd(), argv.baseline)
      const currentPath = path.resolve(process.cwd(), argv.current)

      const baselineFile = JSON.parse(
        await fs.readFile(baselinePath, 'utf-8')
      ) as SummaryFile
      const currentFile = JSON.parse(
        await fs.readFile(currentPath, 'utf-8')
      ) as SummaryFile

      const metricsToCompare = Object.keys(baselineFile.summary)
      let hasRegression = false

      const results = []

      for (const metric of metricsToCompare) {
        const baselineValue = parseFloat(baselineFile.summary[metric]?.average)
        const currentValue = parseFloat(currentFile.summary[metric]?.average)

        if (isNaN(baselineValue) || isNaN(currentValue)) {
          results.push({
            metric,
            baseline: 'N/A',
            current: 'N/A',
            change: 'N/A',
            status: chalk.gray('skipped'),
          })
          continue
        }

        const diff = currentValue - baselineValue
        const change = (diff / baselineValue) * 100

        let status
        if (baselineValue === 0 && currentValue > 0) {
          status = chalk.red('regression')
          hasRegression = true
        } else if (Math.abs(change) < 0.01) {
          status = chalk.gray('no change')
        } else if (change > argv.threshold) {
          status = chalk.red('regression')
          hasRegression = true
        } else if (change < -argv.threshold) {
          status = chalk.green('improvement')
        } else {
          status = chalk.yellow('neutral')
        }

        results.push({
          metric,
          baseline: baselineValue.toFixed(2),
          current: currentValue.toFixed(2),
          change: `${change > 0 ? '+' : ''}${change.toFixed(2)}%`,
          status,
        })
      }

      console.table(
        results.reduce(
          (acc, { metric, ...rest }) => {
            acc[metric] = rest
            return acc
          },
          {} as Record<string, Omit<(typeof results)[0], 'metric'>>
        )
      )

      if (hasRegression) {
        console.log(chalk.red.bold('\n❌ Performance regression detected.'))
        process.exit(1)
      } else {
        console.log(
          chalk.green.bold('\n✅ No performance regressions detected.')
        )
      }
    } catch (error) {
      console.error(chalk.red('\n❌ An error occurred during comparison:'))
      console.error(error)
      process.exit(1)
    }
  },
}
