export type PipelineEnforcerFlags = {
  verbose?: boolean
  quiet?: boolean
  logFile?: string
}

export type PipelineEnforcerStartFlags = PipelineEnforcerFlags & {
  repoPath: string
  aquaKey: string
  aquaSecret: string
  accessToken: string
  matrix: string
}

export type PipelineEnforcerEndFlags = PipelineEnforcerFlags &
  Record<string, never>
