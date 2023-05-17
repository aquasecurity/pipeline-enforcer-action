import crypto from 'crypto'

import * as core from '@actions/core'
import {exec} from '@actions/exec'
import * as http from '@actions/http-client'
import * as fs from 'fs'
import {extractStartInputs, isLogFilePathValid, validateInputs} from './inputs'
import {PipelineEnforcerStartFlags} from './types'

const PIPELINE_ENFORCER_INIT_FILE = '/tmp/pipeline-enforcer.start'
const INSTALLATION_SCRIPT_PATH = 'install.sh'
const INTEGRITY_CLI_DOWNLOAD_URL =
  'https://download.codesec.aquasec.com/pipeline-enforcer/install.sh'
const INTEGRITY_INSTALLATION_SCRIPT_CHECKSUM_URL =
  'https://github.com/argonsecurity/integrity-releases/releases/latest/download/install.sh.checksum'

const httpClient = new http.HttpClient('pipeline-enforcer-action')

const downloadToFile = async (url: string, filePath: string) => {
  const response = await httpClient.get(url)
  const responseBody = await response.readBody()
  fs.writeFileSync(filePath, responseBody)
}

const getChecksum = async () => {
  const response = await httpClient.get(
    INTEGRITY_INSTALLATION_SCRIPT_CHECKSUM_URL
  )
  const responseBody = await response.readBody()
  // The checksum is the first word in the response
  const checksum = responseBody.split(' ')[0]
  return checksum
}

const getFileSHA256 = (filePath: string) => {
  const data = fs.readFileSync(filePath)
  const hash = crypto.createHash('sha256').update(data).digest('hex')
  return hash
}

const executeInstallationScript = async () => {
  const command = `sh`
  await exec(command, [INSTALLATION_SCRIPT_PATH], {
    env: {
      ...process.env,
      BINDIR: '.'
    }
  })
}

const downloadPipelineEnforcerCommercial = async () => {
  await downloadToFile(INTEGRITY_CLI_DOWNLOAD_URL, INSTALLATION_SCRIPT_PATH)
  const expectedChecksum = await getChecksum()
  const actualChecksum = getFileSHA256(INSTALLATION_SCRIPT_PATH)
  core.debug(`Expected checksum: ${expectedChecksum}`)
  core.debug(`Actual checksum: ${actualChecksum}`)
  if (expectedChecksum !== actualChecksum) {
    throw new Error(
      `Checksum mismatch. Expected ${expectedChecksum} but got ${actualChecksum}`
    )
  }

  await executeInstallationScript()
  try {
    fs.rmSync(INSTALLATION_SCRIPT_PATH)
  } catch (error) {
    if (error instanceof Error) {
      core.warning(`Failed to delete installation script: ${error.message}`)
    }
  }
}

const generateCommand = (flags: PipelineEnforcerStartFlags): string => {
  const pipelineEnforcerCommand = [
    './pipeline-enforcer',
    'ci',
    'start',
    '-r',
    `"${flags.repoPath}"`,
    '--github-matrix',
    `'${flags.matrix}'`
  ]

  if (flags.verbose && !flags.quiet) {
    pipelineEnforcerCommand.push('-v')
  }

  if (flags.quiet) {
    pipelineEnforcerCommand.push('-q')
  }

  if (flags.logFile) {
    if (isLogFilePathValid(flags.logFile)) {
      pipelineEnforcerCommand.push('--log-file', `"${flags.logFile}"`)
    } else {
      core.warning(
        `Log file path ${flags.logFile} is invalid. Ignoring log file flag`
      )
    }
  }

  pipelineEnforcerCommand.push('&')

  return pipelineEnforcerCommand.join(' ')
}

const executePipelineEnforcerInBackground = async (
  pipelineEnforcerFlags: PipelineEnforcerStartFlags
) => {
  const {aquaKey, aquaSecret, accessToken} = pipelineEnforcerFlags
  const command = 'bash'
  const pipelineEnforcerCommand = generateCommand(pipelineEnforcerFlags)
  await exec(command, ['-c', pipelineEnforcerCommand], {
    env: {
      ...process.env,
      AQUA_KEY: aquaKey,
      AQUA_SECRET: aquaSecret,
      ACCESS_TOKEN: accessToken
    },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    detached: true
  })
}

const waitForPipelineEnforcerToInitialize = (
  timeout: number,
  initFilePath: string
) => {
  return new Promise<void>((resolve, reject) => {
    const interval = setInterval(() => {
      if (fs.existsSync(initFilePath)) {
        core.debug(`Found pipeline-enforcer init file: ${initFilePath}`)
        clearInterval(interval)
        resolve()
      }
    }, 1000)

    setTimeout(() => {
      clearInterval(interval)
      reject(new Error('Timeout waiting for pipeline-enforcer to initialize'))
    }, timeout)
  })
}

const checkPipelineEnforcerError = (
  timeout: number,
  errorFilePath: string
) => {
  return new Promise<void>((resolve, reject) => {
    const interval = setInterval(() => {
      if (fs.existsSync(errorFilePath)) {
        core.debug(`Found pipeline-enforcer error file: ${errorFilePath}`)
        clearInterval(interval)
        reject(new Error('pipeline enforce error'))
      }
    }, 1000)

    setTimeout(() => {
      clearInterval(interval)
      resolve()
    }, timeout)
  })
}

async function run(): Promise<void> {
  try {
    const pipelineEnforcerFlags = extractStartInputs()
    core.debug('validating inputs')
    validateInputs(pipelineEnforcerFlags)
    core.debug('inputs validated successfully')
    core.debug('Downloading pipeline-enforcer binary')
    await downloadPipelineEnforcerCommercial()
    core.info('pipeline-enforcer binary downloaded successfully')
    core.debug('Starting pipeline-enforcer in the background')
    await executePipelineEnforcerInBackground(pipelineEnforcerFlags)
    core.info('pipeline-enforcer started successfully')

    core.debug('Waiting for pipeline-enforcer to initialize.')
    await waitForPipelineEnforcerToInitialize(
      30000,
      PIPELINE_ENFORCER_INIT_FILE
    )
    core.info('pipeline-enforcer initialized successfully')
    await checkPipelineEnforcerError(
      30000,
      "tmp/pipeline-enforcer.error"
    )
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()
