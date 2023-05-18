export type PipelineEnforcerFlags = {
  verbose?: boolean
  quiet?: boolean
  logFile?: string
  aquaKey: string
  aquaSecret: string
  devDownloadToken?: string
}

export type PipelineEnforcerStartFlags = PipelineEnforcerFlags & {
  repoPath: string
  accessToken: string
  matrix: string
}

export type PipelineEnforcerEndFlags = PipelineEnforcerFlags
