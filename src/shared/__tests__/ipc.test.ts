import { describe, it, expect } from 'vitest'
import { IPC_CHANNELS } from '../ipc'

describe('IPC_CHANNELS', () => {
  it('has unique channel values', () => {
    const values = Object.values(IPC_CHANNELS)
    const uniqueValues = new Set(values)
    expect(values.length).toBe(uniqueValues.size)
  })

  it('contains expected channels', () => {
    expect(IPC_CHANNELS.CHECK_ENV).toBe('check-env')
    expect(IPC_CHANNELS.GET_CONFIG).toBe('get-config')
    expect(IPC_CHANNELS.SET_CONFIG).toBe('set-config')
    expect(IPC_CHANNELS.DISPATCH_TASK).toBe('dispatch-task')
    expect(IPC_CHANNELS.CANCEL_TASK).toBe('cancel-task')
    expect(IPC_CHANNELS.BROWSE_FOLDER).toBe('browse-folder')
  })

  it('all values are non-empty strings', () => {
    for (const [key, value] of Object.entries(IPC_CHANNELS)) {
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    }
  })
})
