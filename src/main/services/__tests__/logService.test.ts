import { describe, it, expect, beforeEach } from 'vitest'
import { addLog, getLogs } from '../logService'

// logService uses module-level state, so we test that behavior directly.
// Note: logs accumulate across tests within a single run since the module
// is only loaded once. Each describe starts from the current state.

describe('logService', () => {
  it('adds a log entry and returns it', () => {
    const entry = addLog('info', 'Hello from the deep')
    expect(entry.level).toBe('info')
    expect(entry.message).toBe('Hello from the deep')
    expect(entry.timestamp).toBeTruthy()
    expect(entry.id).toBeTruthy()
  })

  it('includes raw field matching message', () => {
    const entry = addLog('warning', 'tide rising')
    expect(entry.raw).toBe('tide rising')
  })

  it('getLogs returns all accumulated entries', () => {
    const before = getLogs().length
    addLog('info', 'one')
    addLog('error', 'two')
    const after = getLogs()
    expect(after.length).toBe(before + 2)
  })

  it('getLogs returns a copy (not the internal array)', () => {
    const a = getLogs()
    const b = getLogs()
    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })

  it('supports all log levels', () => {
    const info = addLog('info', 'i')
    const warn = addLog('warning', 'w')
    const err = addLog('error', 'e')
    expect(info.level).toBe('info')
    expect(warn.level).toBe('warning')
    expect(err.level).toBe('error')
  })

  it('generates unique ids for each entry', () => {
    const a = addLog('info', 'a')
    const b = addLog('info', 'b')
    expect(a.id).not.toBe(b.id)
  })

  it('caps at 1000 entries', () => {
    // Add enough to exceed 1000 (there are already some from previous tests)
    const current = getLogs().length
    const needed = 1001 - current
    for (let i = 0; i < needed + 10; i++) {
      addLog('info', `entry-${i}`)
    }
    expect(getLogs().length).toBeLessThanOrEqual(1000)
  })
})
