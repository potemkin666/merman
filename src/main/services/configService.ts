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
  presets: [
    { id: '1', name: 'Default', mode: 'default', description: 'Standard agent mode' },
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
  const updated = { ...current, ...updates }
  writeFileSync(getConfigPath(), JSON.stringify(updated, null, 2))
  return updated
}
