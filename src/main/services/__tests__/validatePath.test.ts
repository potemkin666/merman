import { describe, it, expect } from 'vitest'
import { validatePath } from '../processRunner'

describe('validatePath', () => {
  it('rejects empty paths', () => {
    expect(validatePath('').ok).toBe(false)
    expect(validatePath('   ').ok).toBe(false)
  })

  it('rejects paths with shell metacharacters', () => {
    const dangerous = [
      '/tmp; rm -rf /',
      '/tmp | cat /etc/passwd',
      '/tmp & echo hacked',
      '/tmp`whoami`',
      '/tmp$(id)',
      '/tmp\ncd /',
    ]
    for (const p of dangerous) {
      const result = validatePath(p)
      expect(result.ok).toBe(false)
      expect(result.error).toContain('invalid characters')
    }
  })

  it('rejects paths that do not exist', () => {
    const result = validatePath('/absolutely/nonexistent/path/12345')
    expect(result.ok).toBe(false)
    expect(result.error).toContain('not found')
  })

  it('accepts a valid existing directory', () => {
    // /tmp should exist on any unix-like CI
    const result = validatePath('/tmp')
    expect(result.ok).toBe(true)
  })
})
