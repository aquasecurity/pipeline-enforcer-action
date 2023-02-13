import * as core from '@actions/core'
import {getExecOutput} from '@actions/exec'
import * as fs from 'fs'
import {validateLogFilePath} from './inputs'

class CommandError extends Error {
  exitCode: number

  constructor(exitCode: number, message: string) {
    super(message)
    this.exitCode = exitCode
  }
}

const executeTraceeEnd = async (verbose: boolean) => {
  if (!fs.existsSync('./tracee')) {
    throw new Error('Tracee Commercial was not found')
  }

  const traceeCommand = `./tracee ci end ${verbose ? '-v' : ''}`

  const result = await getExecOutput(traceeCommand)
  if (result.exitCode != 0) {
    throw new CommandError(result.exitCode, result.stdout + result.stderr)
  }
}

async function run(): Promise<void> {
  try {
    const verbose = core.getInput('verbose') === 'true'
    core.info('Ending Tracee Commercial run')
    await executeTraceeEnd(verbose)
    core.debug('Tracee Commercial ended successfully')
  } catch (error) {
    if (error instanceof CommandError) {
      core.setFailed(error.message)
      process.exitCode = error.exitCode
    } else if (error instanceof Error) {
      core.setFailed(error.message)
    }
  } finally {
    const logFile = core.getInput('log-file')
    if (logFile && validateLogFilePath(logFile)) {
      const log = fs.readFileSync(logFile, 'utf8')
      core.info(`Tracee Commercial logs`)
      core.info(log)
    }
  }
}

run()
