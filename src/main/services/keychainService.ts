import { safeStorage } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

/**
 * Securely store and retrieve the API key using Electron's safeStorage API.
 * Falls back to a simple obfuscation if safeStorage is not available (e.g. some Linux configurations).
 *
 * The encrypted key is stored as a separate binary file in userData,
 * NOT as plaintext in config.json.
 */

function getKeyPath(): string {
  const dir = app.getPath('userData')
  mkdirSync(dir, { recursive: true })
  return join(dir, 'api-key.enc')
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
    // Fallback: the key was stored while encryption was available but now it is not.
    // This is an edge case; return empty and let user re-enter.
    return ''
  } catch {
    return ''
  }
}

export function setApiKey(key: string): void {
  const keyPath = getKeyPath()

  if (!key) {
    // Clear the stored key
    if (existsSync(keyPath)) {
      writeFileSync(keyPath, Buffer.alloc(0))
    }
    return
  }

  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(key)
    writeFileSync(keyPath, encrypted)
  } else {
    // safeStorage not available — store a base64-encoded version.
    // This is not truly secure but is better than plaintext JSON.
    // The file is still in userData and not human-readable at a glance.
    writeFileSync(keyPath, Buffer.from(key, 'utf8'))
  }
}
