import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock electron modules
const mockIsEncryptionAvailable = vi.fn()
const mockEncryptString = vi.fn()
const mockDecryptString = vi.fn()

vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: () => mockIsEncryptionAvailable(),
    encryptString: (s: string) => mockEncryptString(s),
    decryptString: (b: Buffer) => mockDecryptString(b),
  },
  app: {
    getPath: vi.fn().mockReturnValue('/mock/userData'),
  },
}))

// Mock fs module
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn(),
}))

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs'
import { getApiKey, setApiKey, isSecureStorageAvailable } from '../keychainService'

const mockReadFileSync = vi.mocked(readFileSync)
const mockWriteFileSync = vi.mocked(writeFileSync)
const mockExistsSync = vi.mocked(existsSync)
const mockUnlinkSync = vi.mocked(unlinkSync)

describe('keychainService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isSecureStorageAvailable', () => {
    it('returns true when safeStorage encryption is available', () => {
      mockIsEncryptionAvailable.mockReturnValue(true)
      expect(isSecureStorageAvailable()).toBe(true)
    })

    it('returns false when safeStorage encryption is not available', () => {
      mockIsEncryptionAvailable.mockReturnValue(false)
      expect(isSecureStorageAvailable()).toBe(false)
    })
  })

  describe('getApiKey', () => {
    it('returns empty string when key file does not exist', () => {
      mockExistsSync.mockReturnValue(false)

      const result = getApiKey()
      expect(result).toBe('')
    })

    it('decrypts and returns the stored key when safeStorage is available', () => {
      mockExistsSync.mockReturnValue(true)
      const encryptedBuffer = Buffer.from('encrypted-data')
      mockReadFileSync.mockReturnValue(encryptedBuffer)
      mockIsEncryptionAvailable.mockReturnValue(true)
      mockDecryptString.mockReturnValue('sk-test-key')

      const result = getApiKey()

      expect(result).toBe('sk-test-key')
      expect(mockDecryptString).toHaveBeenCalledWith(encryptedBuffer)
    })

    it('returns empty string when safeStorage is not available', () => {
      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue(Buffer.from('some-data'))
      mockIsEncryptionAvailable.mockReturnValue(false)

      const result = getApiKey()

      expect(result).toBe('')
      expect(mockDecryptString).not.toHaveBeenCalled()
    })

    it('returns empty string when file is empty', () => {
      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue(Buffer.alloc(0))

      const result = getApiKey()
      expect(result).toBe('')
    })

    it('returns empty string when decryption throws', () => {
      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue(Buffer.from('corrupted'))
      mockIsEncryptionAvailable.mockReturnValue(true)
      mockDecryptString.mockImplementation(() => { throw new Error('decrypt failed') })

      const result = getApiKey()
      expect(result).toBe('')
    })
  })

  describe('setApiKey', () => {
    it('deletes existing key file when key is empty', () => {
      mockExistsSync.mockReturnValue(true)

      const result = setApiKey('')

      expect(result).toEqual({ stored: true })
      expect(mockUnlinkSync).toHaveBeenCalled()
    })

    it('returns stored true when clearing a non-existent key file', () => {
      mockExistsSync.mockReturnValue(false)

      const result = setApiKey('')

      expect(result).toEqual({ stored: true })
      expect(mockUnlinkSync).not.toHaveBeenCalled()
    })

    it('encrypts and stores the key when safeStorage is available', () => {
      mockIsEncryptionAvailable.mockReturnValue(true)
      const encryptedBuffer = Buffer.from('encrypted')
      mockEncryptString.mockReturnValue(encryptedBuffer)

      const result = setApiKey('sk-new-key')

      expect(result).toEqual({ stored: true })
      expect(mockEncryptString).toHaveBeenCalledWith('sk-new-key')
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('api-key.enc'),
        encryptedBuffer
      )
    })

    it('refuses to store when safeStorage is not available', () => {
      mockIsEncryptionAvailable.mockReturnValue(false)

      const result = setApiKey('sk-new-key')

      expect(result).toEqual({ stored: false })
      expect(mockWriteFileSync).not.toHaveBeenCalled()
    })
  })
})
