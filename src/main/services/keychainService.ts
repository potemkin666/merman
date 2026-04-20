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
    // Fallback: try to reverse XOR obfuscation (non-safeStorage path)
    try {
      const deobfuscated = Buffer.from(
        Array.from(encryptedBuffer).map((b, i) => b ^ (0xa5 + (i % 37)))
      )
      return deobfuscated.toString('utf8')
    } catch {
      return ''
    }
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
    // safeStorage not available (some Linux desktop configurations).
    // We apply simple XOR obfuscation so the key is not stored as plain UTF-8.
    // WARNING: This is NOT a cryptographic guarantee — it only prevents
    // casual reading of the file. On affected systems, recommend the user
    // set the key as an environment variable instead.
    const obfuscated = Buffer.from(
      Array.from(Buffer.from(key, 'utf8')).map((b, i) => b ^ (0xa5 + (i % 37)))
    )
    writeFileSync(keyPath, obfuscated)
  }
}
