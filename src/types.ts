export type TraceeFlags = {
  verbose?: boolean
  quiet?: boolean
  logFile?: string
}

export type TraceeStartFlags = TraceeFlags & {
  repoPath: string
  aquaKey: string
  aquaSecret: string
  accessToken: string
}

export type TraceeEndFlags = TraceeFlags & {}
