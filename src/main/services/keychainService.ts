import { safeStorage } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

/**
 * Securely store and retrieve the API key using Electron's safeStorage API.
 *
 * When safeStorage is unavailable (e.g. some Linux desktop configurations without
 * a keyring), the service **refuses to persist the key** and returns an empty
 * string. The renderer is expected to check `isSecureStorageAvailable()` and warn
 * the user to set the key via an environment variable instead.
 *
 * Previous versions fell back to trivially-reversible XOR obfuscation — that has
 * been removed because it gave a false sense of security.
 */

function getKeyPath(): string {
  const dir = app.getPath('userData')
  mkdirSync(dir, { recursive: true })
  return join(dir, 'api-key.enc')
}

/** Whether the OS-level secure storage (keychain / credential manager) is usable. */
export function isSecureStorageAvailable(): boolean {
  return safeStorage.isEncryptionAvailable()
}

export function getApiKey(): string {
  const keyPath = getKeyPath()
  if (!existsSync(keyPath)) return ''

  try {
    const encryptedBuffer = readFileSync(keyPath)
    if (encryptedBuffer.length === 0) return ''

    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(encryptedBuffer)
    }
    // safeStorage is not available — we can no longer decrypt whatever is on disk.
    // Do NOT attempt any obfuscation fallback; just return empty.
    return ''
  } catch {
    return ''
  }
}

export function setApiKey(key: string): { stored: boolean } {
  const keyPath = getKeyPath()

  if (!key) {
    // Clear the stored key
    if (existsSync(keyPath)) {
      try { unlinkSync(keyPath) } catch { /* best-effort */ }
    }
    return { stored: true }
  }

  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(key)
    writeFileSync(keyPath, encrypted)
    return { stored: true }
  }

  // safeStorage not available — refuse to store the key insecurely.
  // The caller (renderer) should warn the user and suggest environment variables.
  return { stored: false }
}
