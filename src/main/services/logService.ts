import type { LogEntry } from '../../shared/types'

const logs: LogEntry[] = []
let idCounter = 0

export function addLog(level: LogEntry['level'], message: string): LogEntry {
  const entry: LogEntry = {
    id: String(++idCounter),
    timestamp: new Date().toISOString(),
    level,
    message,
    raw: message,
  }
  logs.push(entry)
  if (logs.length > 1000) logs.splice(0, logs.length - 1000)
  return entry
}

export function getLogs(): LogEntry[] {
  return [...logs]
}
