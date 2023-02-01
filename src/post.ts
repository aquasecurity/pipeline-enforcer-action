import * as core from '@actions/core'
import {exec} from '@actions/exec'

const executeTraceeEnd = async () => {
  await exec('./tracee ci end')
}

async function run(): Promise<void> {
  try {
    core.info('Ending Tracee Commercial run')
    await executeTraceeEnd()
    core.debug('Tracee Commercial ended successfully')
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()
