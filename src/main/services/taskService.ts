import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import type { TaskResult } from '../../shared/types'

const MAX_ENTRIES = 200
const PERSIST_DEBOUNCE_MS = 2000

let tasks: TaskResult[] = []
let taskFilePath: string | null = null
let persistTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Initialise the task store with a file path for persistence.
 * Call once at app startup with `app.getPath('userData')`.
 * If never called (e.g. in tests), tasks are kept in memory only.
 */
export function initTaskStore(userDataDir: string): void {
  mkdirSync(userDataDir, { recursive: true })
  taskFilePath = join(userDataDir, 'tasks.json')

  if (existsSync(taskFilePath)) {
    try {
      const raw = readFileSync(taskFilePath, 'utf8')
      const parsed: TaskResult[] = JSON.parse(raw)
      tasks = Array.isArray(parsed) ? parsed.slice(-MAX_ENTRIES) : []
    } catch {
      tasks = []
    }
  }
}

function persistNow(): void {
  if (!taskFilePath) return
  try {
    mkdirSync(dirname(taskFilePath), { recursive: true })
    writeFileSync(taskFilePath, JSON.stringify(tasks))
  } catch {
    // Best-effort — don't crash the app if the disk write fails
  }
}

/**
 * Debounced persist — batches rapid task updates into a single write.
 */
function persist(): void {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    persistNow()
    persistTimer = null
  }, PERSIST_DEBOUNCE_MS)
}

/**
 * Add a completed task result to the store.
 * Newest tasks are stored first (most recent at index 0).
 */
export function addTask(task: TaskResult): TaskResult {
  tasks = [task, ...tasks].slice(0, MAX_ENTRIES)
  persist()
  return task
}

/**
 * Get all stored tasks (most recent first).
 */
export function getTasks(): TaskResult[] {
  return [...tasks]
}

/**
 * Flush any pending debounced writes immediately.
 * Call before app quit to ensure tasks are not lost.
 */
export function flushTasks(): void {
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
  persistNow()
}

/**
 * Reset the task store — intended for tests only.
 */
export function _resetForTesting(): void {
  tasks = []
  taskFilePath = null
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
}
