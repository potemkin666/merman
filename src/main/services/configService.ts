import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { AppConfig } from '../../shared/types'
import { defaultConfig } from '../../shared/defaults'

const defaults: AppConfig = { ...defaultConfig }

function getConfigPath(): string {
  return join(app.getPath('userData'), 'config.json')
}

async function ensureDir(): Promise<void> {
  await mkdir(app.getPath('userData'), { recursive: true })
}

export async function getConfig(): Promise<AppConfig> {
  await ensureDir()
  const configPath = getConfigPath()
  if (!existsSync(configPath)) {
    await writeFile(configPath, JSON.stringify(defaults, null, 2))
    return { ...defaults }
  }
  try {
    const raw = await readFile(configPath, 'utf8')
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return { ...defaults }
  }
}

export async function setConfig(updates: Partial<AppConfig>): Promise<AppConfig> {
  const current = await getConfig()
  // Never persist apiKey in the config JSON — it is stored securely via keychainService
  const { apiKey: _stripped, ...safeUpdates } = updates
  const updated = { ...current, ...safeUpdates, apiKey: '' }
  await writeFile(getConfigPath(), JSON.stringify(updated, null, 2))
  return updated
}
