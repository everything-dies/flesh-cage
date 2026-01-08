import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { runCommand } from './commands/run.js'
import { compareCommand } from './commands/compare.js'

yargs(hideBin(process.argv))
  .command(runCommand)
  .command(compareCommand)
  .demandCommand(1, 'Please specify a command.')
  .help()
  .alias('h', 'help')
  .strict()
  .parse()
