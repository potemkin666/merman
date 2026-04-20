import { describe, it, expect } from 'vitest'
import { translateError } from '../translateError'

describe('translateError', () => {
  it('identifies ENOENT / not found errors', () => {
    const result = translateError('spawn ENOENT', 'setup')
    expect(result.what).toContain('not found')
    expect(result.retryable).toBe(true)
  })

  it('identifies "no such file" errors', () => {
    const result = translateError('Error: no such file or directory', 'start')
    expect(result.what).toContain('not found')
  })

  it('identifies permission denied errors', () => {
    const result = translateError('EACCES: permission denied', 'dispatch')
    expect(result.what).toContain('Permission')
    expect(result.retryable).toBe(true)
  })

  it('identifies address-in-use errors', () => {
    const result = translateError('listen EADDRINUSE :::3000', 'start')
    expect(result.what).toContain('port')
    expect(result.retryable).toBe(true)
  })

  it('identifies npm errors during setup', () => {
    const result = translateError('npm ERR! code E404', 'setup')
    expect(result.what).toBe('Dependency installation failed.')
    expect(result.retryable).toBe(true)
  })

  it('identifies npm errors during dispatch', () => {
    const result = translateError('npm ERR! code E500', 'dispatch')
    expect(result.what).toBe('The process exited with an error.')
  })

  it('identifies exit code 1 errors', () => {
    const result = translateError('Process exit code 1', 'start')
    expect(result.what).toBe('The process exited with an error.')
  })

  it('identifies timeout errors', () => {
    const result = translateError('Request timed out after 30s', 'dispatch')
    expect(result.what).toContain('timed out')
    expect(result.retryable).toBe(true)
  })

  it('returns a generic explanation for unknown errors', () => {
    const result = translateError('Something completely unexpected', 'setup')
    expect(result.what).toContain('unexpected')
    expect(result.cause).toBe('Something completely unexpected')
    expect(result.retryable).toBe(true)
  })

  it('is case-insensitive for error matching', () => {
    const result = translateError('PERMISSION DENIED on /etc/shadow', 'start')
    expect(result.what).toContain('Permission')
  })
})
