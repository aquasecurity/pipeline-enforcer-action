import * as core from '@actions/core'
import { getExecOutput } from '@actions/exec'
import * as fs from 'fs'

const TRACEE_END_SLEEP_MS = 3000
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
class CommandError extends Error {
  exitCode: number

  constructor(exitCode: number, message: string) {
    super(message)
    this.exitCode = exitCode
  }
}

const executeTraceeEnd = async () => {
  if (!fs.existsSync('./tracee')) {
    throw new Error('Tracee Commercial was not found')
  }

  // workaround for tracee end cmd buffer tail issue: https://github.com/aquasecurity/tracee/issues/2171
  // we add a delay between the last step of the workflow and the tracee end command
  await sleep(TRACEE_END_SLEEP_MS);
  
  const result = await getExecOutput('./tracee ci end')
  if (result.exitCode != 0) {
    throw new CommandError(result.exitCode, result.stdout + result.stderr)
  }
}

async function run(): Promise<void> {
  try {
    core.info('Ending Tracee Commercial run')
    await executeTraceeEnd()
    core.debug('Tracee Commercial ended successfully')
  } catch (error) {
    if (error instanceof CommandError) {
      core.setFailed(error.message)
      process.exitCode = error.exitCode
    } else if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()
