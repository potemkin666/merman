import { describe, it, expect, beforeEach } from 'vitest'
import { mkdtempSync, readFileSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { addTask, getTasks, initTaskStore, flushTasks, _resetForTesting } from '../taskService'
import type { TaskResult } from '../../../shared/types'

function makeTask(id: string, overrides: Partial<TaskResult> = {}): TaskResult {
  return {
    id,
    prompt: `Test prompt ${id}`,
    mode: 'default',
    status: 'done',
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('taskService', () => {
  beforeEach(() => {
    _resetForTesting()
  })

  it('adds a task and returns it', () => {
    const task = makeTask('1')
    const returned = addTask(task)
    expect(returned).toEqual(task)
  })

  it('getTasks returns all added tasks', () => {
    addTask(makeTask('1'))
    addTask(makeTask('2'))
    expect(getTasks().length).toBe(2)
  })

  it('getTasks returns most recent task first', () => {
    addTask(makeTask('first'))
    addTask(makeTask('second'))
    const tasks = getTasks()
    expect(tasks[0].id).toBe('second')
    expect(tasks[1].id).toBe('first')
  })

  it('getTasks returns a copy (not the internal array)', () => {
    addTask(makeTask('1'))
    const a = getTasks()
    const b = getTasks()
    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })

  it('caps at 200 entries', () => {
    for (let i = 0; i < 210; i++) {
      addTask(makeTask(String(i)))
    }
    expect(getTasks().length).toBeLessThanOrEqual(200)
  })

  describe('file persistence', () => {
    it('flushTasks writes immediately, bypassing the debounce window', () => {
      const dir = mkdtempSync(join(tmpdir(), 'merman-tasks-'))
      initTaskStore(dir)
      addTask(makeTask('flush-test'))
      // Flush without waiting for the debounce timeout
      flushTasks()
      const filePath = join(dir, 'tasks.json')
      expect(existsSync(filePath)).toBe(true)
      const data: TaskResult[] = JSON.parse(readFileSync(filePath, 'utf8'))
      expect(data.length).toBe(1)
      expect(data[0].id).toBe('flush-test')
    })

    it('persists tasks to disk when initTaskStore is called', () => {
      const dir = mkdtempSync(join(tmpdir(), 'merman-tasks-'))
      initTaskStore(dir)
      addTask(makeTask('persisted'))
      flushTasks()
      const filePath = join(dir, 'tasks.json')
      expect(existsSync(filePath)).toBe(true)
      const data: TaskResult[] = JSON.parse(readFileSync(filePath, 'utf8'))
      expect(data.length).toBe(1)
      expect(data[0].id).toBe('persisted')
    })

    it('restores tasks from disk on init', () => {
      const dir = mkdtempSync(join(tmpdir(), 'merman-tasks-'))
      initTaskStore(dir)
      addTask(makeTask('a'))
      addTask(makeTask('b'))
      flushTasks()

      // Simulate a restart
      _resetForTesting()
      initTaskStore(dir)
      const restored = getTasks()
      expect(restored.length).toBe(2)
      // Most recent first
      expect(restored[0].id).toBe('b')
      expect(restored[1].id).toBe('a')
    })

    it('handles corrupt task file gracefully', () => {
      const dir = mkdtempSync(join(tmpdir(), 'merman-tasks-'))
      writeFileSync(join(dir, 'tasks.json'), 'not valid json')
      initTaskStore(dir)
      expect(getTasks().length).toBe(0)
    })

    it('does not persist when no initTaskStore has been called', () => {
      // Should not throw even without a file path
      addTask(makeTask('mem-only'))
      expect(() => flushTasks()).not.toThrow()
      expect(getTasks().length).toBe(1)
    })
  })
})
