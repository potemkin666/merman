import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { AppConfig } from '../../shared/types'
import { defaultConfig } from '../../shared/defaults'

const defaults: AppConfig = { ...defaultConfig }

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
