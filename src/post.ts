import * as core from '@actions/core'
import {exec} from '@actions/exec'
import * as fs from 'fs'

const executeTraceeEnd = async () => {
  if (fs.existsSync('./tracee')) {
    await exec('./tracee ci end')
  } else {
    throw new Error('Tracee Commercial was not found')
  }
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
