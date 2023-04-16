import * as core from '@actions/core'
import {getExecOutput} from '@actions/exec'
import * as fs from 'fs'

class CommandError extends Error {
  exitCode: number

  constructor(exitCode: number, message: string) {
    super(message)
    this.exitCode = exitCode
  }
}

const addSummary = async (summary: string) => {
  const lines = summary.split('\n')
  core.summary.addHeading('Aqua Security Pipeline Enforcer').addSeparator()
  for (const line of lines) {
    if (line.startsWith('20')) {
      continue
    }
    core.summary.addRaw(line, true)
  }
  core.summary.addSeparator()

  await core.summary.write()
}

const executePipelineEnforcerEnd = async (verbose: boolean) => {
  if (!fs.existsSync('./pipeline-enforcer')) {
    throw new Error('pipeline-enforcer was not found')
  }

  const pipelineEnforcerCommand = `./pipeline-enforcer ci end ${
    verbose ? '-v' : ''
  }`

  const result = await getExecOutput(pipelineEnforcerCommand, [], {
    ignoreReturnCode: true
  })

  if (result.exitCode != 0) {
    throw new CommandError(result.exitCode, result.stdout + result.stderr)
  }
}

async function run(): Promise<void> {
  try {
    const verbose = core.getInput('verbose') === 'true'
    core.info('Ending pipeline-enforcer run')
    await executePipelineEnforcerEnd(verbose)
    core.debug('pipeline-enforcer ended successfully')
  } catch (error) {
    if (error instanceof CommandError) {
      await addSummary(error.message)
      core.setFailed(error.message)
      process.exitCode = error.exitCode
    } else if (error instanceof Error) {
      core.setFailed(error.message)
    }
  } finally {
    const logFile = core.getInput('log-file')
    if (logFile && fs.existsSync(logFile)) {
      const log = fs.readFileSync(logFile, 'utf8')
      core.info(`pipeline-enforcer logs`)
      core.info(log)
    }
  }
}

run()
