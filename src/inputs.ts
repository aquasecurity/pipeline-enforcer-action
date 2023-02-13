import * as core from '@actions/core'
import {TraceeStartFlags} from './types'

export const extractStartInputs = (): TraceeStartFlags => {
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
