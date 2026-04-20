export interface AppConfig {
  openClawPath: string
  workspacePath: string
  model: string
  provider: string
  apiKey: string
  emissaryName: string
  presets: Preset[]
  welcomeSeen?: boolean
}

export interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error'
  message: string
  raw?: string
}

export interface EnvCheckResult {
  name: string
  version?: string
  ok: boolean
  message?: string
}

export interface TaskResult {
  id: string
  prompt: string
  mode: string
  status: 'pending' | 'running' | 'done' | 'error'
  output?: string
  startedAt: string
  finishedAt?: string
}

export type ServiceStatus = 'idle' | 'running' | 'stopped' | 'error'

export interface Preset {
  id: string
  name: string
  mode: string
  description?: string
}

export interface ErrorExplanation {
  what: string
  cause: string
  action: string
  retryable: boolean
}

export interface CommandResult {
  ok: boolean
  output?: string
  error?: string
  explanation?: ErrorExplanation
}

export interface HabitSuggestion {
  text: string
  mode: string
  confidence: number
}
