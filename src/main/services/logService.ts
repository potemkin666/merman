import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import type { LogEntry } from '../../shared/types'

const MAX_ENTRIES = 1000

let logs: LogEntry[] = []
let idCounter = 0
let logFilePath: string | null = null

/**
 * Initialise the log store with a file path for persistence.
 * Call once at app startup with `app.getPath('userData')`.
 * If never called (e.g. in tests), logs are kept in memory only.
 */
export function initLogStore(userDataDir: string): void {
  const dir = userDataDir
  mkdirSync(dir, { recursive: true })
  logFilePath = join(dir, 'logs.json')

  if (existsSync(logFilePath)) {
    try {
      const raw = readFileSync(logFilePath, 'utf8')
      const parsed: LogEntry[] = JSON.parse(raw)
      logs = Array.isArray(parsed) ? parsed.slice(-MAX_ENTRIES) : []
      // Resume id counter from the highest existing id
      for (const entry of logs) {
        const n = parseInt(entry.id, 10)
        if (!isNaN(n) && n > idCounter) idCounter = n
      }
    } catch {
      logs = []
    }
  }
}

function persist(): void {
  if (!logFilePath) return
  try {
    mkdirSync(dirname(logFilePath), { recursive: true })
    writeFileSync(logFilePath, JSON.stringify(logs))
  } catch {
    // Best-effort — don't crash the app if the disk write fails
  }
}

export function addLog(level: LogEntry['level'], message: string): LogEntry {
  const entry: LogEntry = {
    id: String(++idCounter),
    timestamp: new Date().toISOString(),
    level,
    message,
    raw: message,
  }
  logs.push(entry)
  if (logs.length > MAX_ENTRIES) logs.splice(0, logs.length - MAX_ENTRIES)
  persist()
  return entry
}

export function getLogs(): LogEntry[] {
  return [...logs]
}

/**
 * Reset the log store — intended for tests only.
 */
export function _resetForTesting(): void {
  logs = []
  idCounter = 0
  logFilePath = null
}
