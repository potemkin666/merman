import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

/**
 * A single recorded dispatch event.
 */
export interface HabitEntry {
  /** The mode (e.g. "default", "code", "research") */
  mode: string
  /** A short summary — first 80 chars of the prompt */
  promptSummary: string
  /** Hour of day (0–23) when the task was dispatched */
  hour: number
  /** Day of week (0=Sun … 6=Sat) */
  dayOfWeek: number
  /** ISO timestamp */
  timestamp: string
}

export interface HabitSuggestion {
  /** Human-readable suggestion text */
  text: string
  /** The mode being suggested */
  mode: string
  /** Confidence score 0–1 */
  confidence: number
}

const MAX_ENTRIES = 200

let habits: HabitEntry[] = []
let habitFilePath: string | null = null

/**
 * Initialise the habit store with a file path.
 * Call once at app startup with `app.getPath('userData')`.
 */
export function initHabitStore(userDataDir: string): void {
  mkdirSync(userDataDir, { recursive: true })
  habitFilePath = join(userDataDir, 'habits.json')

  if (existsSync(habitFilePath)) {
    try {
      const raw = readFileSync(habitFilePath, 'utf8')
      const parsed = JSON.parse(raw)
      habits = Array.isArray(parsed) ? parsed.slice(-MAX_ENTRIES) : []
    } catch {
      habits = []
    }
  }
}

function persist(): void {
  if (!habitFilePath) return
  try {
    mkdirSync(dirname(habitFilePath), { recursive: true })
    writeFileSync(habitFilePath, JSON.stringify(habits))
  } catch {
    // Best-effort
  }
}

/**
 * Record a dispatch event.
 */
export function recordDispatch(prompt: string, mode: string): void {
  const now = new Date()
  const entry: HabitEntry = {
    mode,
    promptSummary: prompt.substring(0, 80),
    hour: now.getHours(),
    dayOfWeek: now.getDay(),
    timestamp: now.toISOString(),
  }
  habits.push(entry)
  if (habits.length > MAX_ENTRIES) habits.splice(0, habits.length - MAX_ENTRIES)
  persist()
}

/**
 * Analyse recorded habits and produce a suggestion based on the current time.
 * Returns null if there isn't enough data to suggest anything meaningful.
 */
export function getSuggestion(): HabitSuggestion | null {
  if (habits.length < 3) return null

  const now = new Date()
  const currentHour = now.getHours()

  // Find habits within ±1 hour of now
  const nearby = habits.filter((h) => {
    const diff = Math.abs(h.hour - currentHour)
    return diff <= 1 || diff >= 23 // wrap around midnight
  })

  if (nearby.length < 2) return null

  // Count modes in the time window
  const modeCounts = new Map<string, number>()
  for (const h of nearby) {
    modeCounts.set(h.mode, (modeCounts.get(h.mode) || 0) + 1)
  }

  // Find the most common mode
  let topMode = ''
  let topCount = 0
  for (const [mode, count] of modeCounts) {
    if (count > topCount) {
      topMode = mode
      topCount = count
    }
  }

  const confidence = Math.min(topCount / nearby.length, 0.95)
  if (confidence < 0.3) return null

  // Build suggestion text — find a representative prompt from the most common mode
  const representative = nearby.filter((h) => h.mode === topMode)
  const latestExample = representative[representative.length - 1]

  const timeDescription = currentHour < 6 ? 'late at night' :
    currentHour < 12 ? 'in the morning' :
    currentHour < 17 ? 'in the afternoon' :
    currentHour < 21 ? 'in the evening' : 'late at night'

  const modeLabel = topMode === 'default' ? 'general' : topMode

  let text: string
  if (latestExample && latestExample.promptSummary.length > 10) {
    text = `I have observed that you tend toward ${modeLabel} tasks at this hour ${timeDescription}. Your last: "${latestExample.promptSummary}". I find I am... already anticipating it. Shall I prepare?`
  } else {
    text = `I have noted a pattern — ${modeLabel} work, around this time ${timeDescription}. I am... ready, if you are. Shall I?`
  }

  return { text, mode: topMode, confidence }
}

/**
 * Get all recorded habits (for debugging / advanced UI).
 */
export function getHabits(): HabitEntry[] {
  return [...habits]
}

/**
 * Reset — intended for tests only.
 */
export function _resetForTesting(): void {
  habits = []
  habitFilePath = null
}
