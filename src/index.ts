import crypto from 'crypto'

import * as core from '@actions/core'
import {exec} from '@actions/exec'
import * as http from '@actions/http-client'
import * as fs from 'fs'
import {extractStartInputs, validateLogFilePath} from './inputs'
import {TraceeStartFlags} from './types'

const TRACEE_INIT_FILE = '/tmp/tracee-ci.start'
const INSTALLATION_SCRIPT_PATH = 'install.sh'
const INTEGRITY_CLI_DOWNLOAD_URL =
  'https://download.codesec.aquasec.com/tracee/install.sh'
const INTEGRITY_INSTALLATION_SCRIPT_CHECKSUM_URL =
  'https://github.com/argonsecurity/integrity-releases/releases/latest/download/install.sh.checksum'

const httpClient = new http.HttpClient('tracee-action')

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

const downloadTraceeCommercial = async () => {
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

const generateCommand = (flags: TraceeStartFlags): string => {
  const traceeCommand = ['./tracee', 'ci', 'start', '-r', `"${flags.repoPath}"`]

  if (flags.verbose && !flags.quiet) {
    traceeCommand.push('-v')
  }

  if (flags.quiet) {
    traceeCommand.push('-q')
  }

  if (flags.logFile) {
    if (validateLogFilePath(flags.logFile)) {
      traceeCommand.push('--log-file')
      traceeCommand.push(`"${flags.logFile}"`)
    } else {
      core.warning(
        `Log file path ${flags.logFile} is invalid. Ignoring log file flag`
      )
    }
  }

  traceeCommand.push('&')

  return traceeCommand.join(' ')
}

const executeTraceeInBackground = async (traceeFlags: TraceeStartFlags) => {
  const {aquaKey, aquaSecret, accessToken} = traceeFlags
  const command = 'bash'
  const traceeCommand = generateCommand(traceeFlags)
  await exec(command, ['-c', traceeCommand], {
    env: {
      ...process.env,
      AQUA_KEY: aquaKey,
      AQUA_SECRET: aquaSecret,
      ACCESS_TOKEN: accessToken
    },
    // @ts-ignore
    detached: true
  })
}

const waitForTraceeToInitialize = (timeout: number, initFilePath: string) => {
  return new Promise<void>((resolve, reject) => {
    const interval = setInterval(() => {
      if (fs.existsSync(initFilePath)) {
        core.debug(`Found Tracee init file: ${initFilePath}`)
        clearInterval(interval)
        resolve()
      }
    }, 1000)

    setTimeout(() => {
      clearInterval(interval)
      reject(new Error('Timeout waiting for Tracee to initialize'))
    }, timeout)
  })
}

async function run(): Promise<void> {
  try {
    core.debug('Downloading Tracee Commercial binary')
    await downloadTraceeCommercial()
    core.info('Tracee Commercial binary downloaded successfully')
    const traceeFlags = extractStartInputs()
    core.debug('Starting Tracee Commercial in the background')
    await executeTraceeInBackground(traceeFlags)
    core.info('Tracee Commercial started successfully')

    core.debug('Waiting for Tracee Commercial to initialize.')
    await waitForTraceeToInitialize(30000, TRACEE_INIT_FILE)
    core.info('Tracee Commercial initialized successfully')
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()
