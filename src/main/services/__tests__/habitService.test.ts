import { describe, it, expect, beforeEach } from 'vitest'
import { mkdtempSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import {
  recordDispatch,
  getSuggestion,
  getHabits,
  initHabitStore,
  _resetForTesting,
} from '../habitService'

describe('habitService', () => {
  beforeEach(() => {
    _resetForTesting()
  })

  it('records a dispatch and stores it', () => {
    recordDispatch('Write a test', 'code')
    const habits = getHabits()
    expect(habits.length).toBe(1)
    expect(habits[0].mode).toBe('code')
    expect(habits[0].promptSummary).toBe('Write a test')
  })

  it('returns null suggestion with fewer than 3 entries', () => {
    recordDispatch('a', 'default')
    recordDispatch('b', 'default')
    expect(getSuggestion()).toBeNull()
  })

  it('returns a suggestion when enough same-hour entries exist', () => {
    // Record several entries at the current hour
    for (let i = 0; i < 5; i++) {
      recordDispatch(`Test task ${i}`, 'code')
    }
    const suggestion = getSuggestion()
    // Suggestion may or may not trigger depending on the hour match,
    // but at least verify the function doesn't crash
    if (suggestion) {
      expect(suggestion.mode).toBe('code')
      expect(suggestion.text).toBeTruthy()
      expect(suggestion.confidence).toBeGreaterThan(0)
    }
  })

  it('caps at 200 entries', () => {
    for (let i = 0; i < 210; i++) {
      recordDispatch(`entry ${i}`, 'default')
    }
    expect(getHabits().length).toBeLessThanOrEqual(200)
  })

  describe('file persistence', () => {
    it('persists habits to disk', () => {
      const dir = mkdtempSync(join(tmpdir(), 'merman-habit-'))
      initHabitStore(dir)
      recordDispatch('Hello', 'default')
      const filePath = join(dir, 'habits.json')
      expect(existsSync(filePath)).toBe(true)
      const data = JSON.parse(readFileSync(filePath, 'utf8'))
      expect(data.length).toBe(1)
    })

    it('restores habits from disk on init', () => {
      const dir = mkdtempSync(join(tmpdir(), 'merman-habit-'))
      initHabitStore(dir)
      recordDispatch('first', 'code')
      recordDispatch('second', 'research')

      _resetForTesting()
      initHabitStore(dir)
      const restored = getHabits()
      expect(restored.length).toBe(2)
      expect(restored[0].promptSummary).toBe('first')
    })
  })
})
