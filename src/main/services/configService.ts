import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { AppConfig } from '../../shared/types'

const defaults: AppConfig = {
  openClawPath: '',
  workspacePath: '',
  model: 'gpt-4o',
  provider: 'openai',
  apiKey: '',
  welcomeSeen: false,
  presets: [
    { id: '1', name: 'Quick Chat', mode: 'default', description: 'Simple conversational task' },
    { id: '2', name: 'Starter Mode', mode: 'starter', description: 'Guided, safe defaults for beginners' },
    { id: '3', name: 'Coding Helper', mode: 'code', description: 'Code generation and review' },
    { id: '4', name: 'Local Researcher', mode: 'research', description: 'Investigate, summarize, and report' },
    { id: '5', name: 'Advanced Custom', mode: 'advanced', description: 'Full control, no guardrails' },
  ],
}

function getConfigPath(): string {
  const dir = app.getPath('userData')
  mkdirSync(dir, { recursive: true })
  return join(dir, 'config.json')
}

export function getConfig(): AppConfig {
  const configPath = getConfigPath()
  if (!existsSync(configPath)) {
    writeFileSync(configPath, JSON.stringify(defaults, null, 2))
    return { ...defaults }
  }
  try {
    const raw = readFileSync(configPath, 'utf8')
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return { ...defaults }
  }
}

export function setConfig(updates: Partial<AppConfig>): AppConfig {
  const current = getConfig()
  // Never persist apiKey in the config JSON — it is stored securely via keychainService
  const { apiKey: _stripped, ...safeUpdates } = updates
  const updated = { ...current, ...safeUpdates, apiKey: '' }
  writeFileSync(getConfigPath(), JSON.stringify(updated, null, 2))
  return updated
}
