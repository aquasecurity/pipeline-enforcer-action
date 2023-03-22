import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'

import {PipelineEnforcerStartFlags} from './types'

export const extractStartInputs = (): PipelineEnforcerStartFlags => {
  const repoPath = core.getInput('repo-path')

  return {
    verbose: core.getInput('verbose') === 'true',
    quiet: core.getInput('quiet') === 'true',
    logFile: core.getInput('log-file'),
    repoPath: repoPath || '.',
    accessToken: core.getInput('access-token'),
    aquaKey: core.getInput('aqua-key'),
    aquaSecret: core.getInput('aqua-secret')
  }
}

export const isLogFilePathValid = (logFilePath: string): boolean => {
  // Check that the directory exists
  const logFileDir = path.dirname(logFilePath)
  if (!fs.existsSync(logFileDir)) {
    return false
  }

  // Check that the file does not exit
  if (fs.existsSync(logFilePath)) {
    return false
  }

  return true
}
