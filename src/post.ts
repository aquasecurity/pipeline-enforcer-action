import * as core from '@actions/core'
import {getExecOutput} from '@actions/exec'
import * as fs from 'fs'
import {PipelineEnforcerEndFlags} from './types'
import {extractEndInputs, validateEndInputs} from './inputs'

class CommandError extends Error {
  exitCode: number

  constructor(exitCode: number, message: string) {
    super(message)
    this.exitCode = exitCode
  }
}

const executePipelineEnforcerEnd = async (flags: PipelineEnforcerEndFlags) => {
  if (!fs.existsSync('./pipeline-enforcer')) {
    throw new Error('pipeline-enforcer was not found')
  }

  const pipelineEnforcerCommand = `./pipeline-enforcer ci end ${
    flags.verbose ? '-v' : ''
  }`

  const result = await getExecOutput(pipelineEnforcerCommand, [], {
    ignoreReturnCode: true,
    env: {
      ...process.env,
      AQUA_KEY: flags.aquaKey,
      AQUA_SECRET: flags.aquaSecret
    }
  })

  if (result.exitCode != 0) {
    throw new CommandError(result.exitCode, result.stdout + result.stderr)
  }
}

async function run(): Promise<void> {
  const flags = extractEndInputs()
  try {
    validateEndInputs(flags)

    core.info('Ending pipeline-enforcer run')
    await executePipelineEnforcerEnd(flags)
    core.debug('pipeline-enforcer ended successfully')
  } catch (error) {
    if (error instanceof CommandError) {
      if (error.exitCode == 13) {
        core.setFailed(
          'Aqua Security Pipeline Enforcer - assurance policies failed'
        )
      } else {
        core.setFailed(error.message)
      }
      process.exitCode = error.exitCode
    } else if (error instanceof Error) {
      core.setFailed(error.message)
    }
  } finally {
    const {logFile} = flags
    if (logFile && fs.existsSync(logFile)) {
      const log = fs.readFileSync(logFile, 'utf8')
      core.info(`pipeline-enforcer logs`)
      core.info(log)
    }
  }
}

run()
