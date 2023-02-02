import * as core from '@actions/core'
import {getExecOutput} from '@actions/exec'
import * as fs from 'fs'

const executeTraceeEnd = async (verbose: boolean = false) => {
  if (!fs.existsSync('./tracee')) {
    throw new Error('Tracee Commercial was not found')
  }

  const traceeCommand = `./tracee ci end ${verbose ? '-v' : ''}`

  const result = await getExecOutput(traceeCommand)
  if (result.exitCode != 0) {
    throw new Error(result.stdout + result.stderr)
  }
}

async function run(): Promise<void> {
  try {
    const verbose = core.getInput('verbose') === 'true'
    core.info('Ending Tracee Commercial run')
    await executeTraceeEnd(verbose)
    core.debug('Tracee Commercial ended successfully')
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()
