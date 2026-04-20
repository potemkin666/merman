import { describe, it, expect, beforeEach } from 'vitest'
import { mkdtempSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { addLog, getLogs, initLogStore, flushLogs, _resetForTesting } from '../logService'

describe('logService', () => {
  beforeEach(() => {
    _resetForTesting()
  })

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
    addLog('info', 'one')
    addLog('error', 'two')
    const after = getLogs()
    expect(after.length).toBe(2)
  })

  it('getLogs returns a copy (not the internal array)', () => {
    addLog('info', 'test')
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
    for (let i = 0; i < 1010; i++) {
      addLog('info', `entry-${i}`)
    }
    expect(getLogs().length).toBeLessThanOrEqual(1000)
  })

  describe('file persistence', () => {
    it('persists logs to disk when initLogStore is called', () => {
      const dir = mkdtempSync(join(tmpdir(), 'merman-log-'))
      initLogStore(dir)
      addLog('info', 'persisted entry')
      flushLogs()
      const filePath = join(dir, 'logs.json')
      expect(existsSync(filePath)).toBe(true)
      const data = JSON.parse(readFileSync(filePath, 'utf8'))
      expect(data.length).toBe(1)
      expect(data[0].message).toBe('persisted entry')
    })

    it('restores logs from disk on init', () => {
      const dir = mkdtempSync(join(tmpdir(), 'merman-log-'))
      initLogStore(dir)
      addLog('info', 'first')
      addLog('warning', 'second')
      flushLogs()

      // Simulate a restart
      _resetForTesting()
      initLogStore(dir)
      const restored = getLogs()
      expect(restored.length).toBe(2)
      expect(restored[0].message).toBe('first')
      expect(restored[1].message).toBe('second')
    })

    it('resumes id counter from persisted logs', () => {
      const dir = mkdtempSync(join(tmpdir(), 'merman-log-'))
      initLogStore(dir)
      addLog('info', 'a')
      addLog('info', 'b')
      flushLogs()
      const lastId = parseInt(getLogs()[1].id, 10)

      _resetForTesting()
      initLogStore(dir)
      const newEntry = addLog('info', 'c')
      expect(parseInt(newEntry.id, 10)).toBeGreaterThan(lastId)
    })
  })
})
