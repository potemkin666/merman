import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock electron app module
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/mock/userData'),
  },
}))

// Mock fs/promises module
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}))

// Mock fs module (for existsSync)
vi.mock('fs', () => ({
  existsSync: vi.fn(),
}))

import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { getConfig, setConfig } from '../configService'
import { defaultConfig } from '../../../shared/defaults'

const mockReadFile = vi.mocked(readFile)
const mockWriteFile = vi.mocked(writeFile)
const mockExistsSync = vi.mocked(existsSync)

describe('configService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getConfig', () => {
    it('returns defaults and writes file when config does not exist', async () => {
      mockExistsSync.mockReturnValue(false)

      const result = await getConfig()

      expect(result).toEqual(defaultConfig)
      expect(mockWriteFile).toHaveBeenCalledTimes(1)
      // The written JSON should be the defaults
      const writtenJson = JSON.parse(mockWriteFile.mock.calls[0][1] as string)
      expect(writtenJson).toEqual(defaultConfig)
    })

    it('merges saved config with defaults when config file exists', async () => {
      mockExistsSync.mockReturnValue(true)
      const savedConfig = { openClawPath: '/my/path', model: 'gpt-4-turbo' }
      mockReadFile.mockResolvedValue(JSON.stringify(savedConfig))

      const result = await getConfig()

      expect(result.openClawPath).toBe('/my/path')
      expect(result.model).toBe('gpt-4-turbo')
      // Defaults fill in missing fields
      expect(result.provider).toBe(defaultConfig.provider)
      expect(result.emissaryName).toBe(defaultConfig.emissaryName)
      expect(result.presets).toEqual(defaultConfig.presets)
    })

    it('returns defaults when config file has invalid JSON', async () => {
      mockExistsSync.mockReturnValue(true)
      mockReadFile.mockResolvedValue('not valid json {{{')

      const result = await getConfig()

      expect(result).toEqual(defaultConfig)
    })

    it('ensures userData directory exists via mkdir', async () => {
      const { mkdir } = await import('fs/promises')
      mockExistsSync.mockReturnValue(false)

      await getConfig()

      expect(mkdir).toHaveBeenCalledWith('/mock/userData', { recursive: true })
    })
  })

  describe('setConfig', () => {
    it('merges updates with current config and writes to disk', async () => {
      mockExistsSync.mockReturnValue(true)
      mockReadFile.mockResolvedValue(JSON.stringify(defaultConfig))

      const result = await setConfig({ openClawPath: '/new/path' })

      expect(result.openClawPath).toBe('/new/path')
      // Other fields preserved
      expect(result.model).toBe(defaultConfig.model)
      expect(mockWriteFile).toHaveBeenCalledTimes(1)
    })

    it('strips apiKey from updates to avoid storing it in plain text', async () => {
      mockExistsSync.mockReturnValue(true)
      mockReadFile.mockResolvedValue(JSON.stringify(defaultConfig))

      const result = await setConfig({ apiKey: 'sk-secret-key', model: 'gpt-4o' })

      // The apiKey should be empty in the returned config
      expect(result.apiKey).toBe('')
      // The model update should be applied
      expect(result.model).toBe('gpt-4o')
      // Written JSON should not contain the api key
      const writtenJson = JSON.parse(mockWriteFile.mock.calls[0][1] as string)
      expect(writtenJson.apiKey).toBe('')
    })

    it('preserves presets when updating other fields', async () => {
      const customPresets = [
        { id: '99', name: 'Test', mode: 'test', description: 'Test preset' },
      ]
      mockExistsSync.mockReturnValue(true)
      mockReadFile.mockResolvedValue(
        JSON.stringify({ ...defaultConfig, presets: customPresets })
      )

      const result = await setConfig({ emissaryName: 'Coral' })

      expect(result.emissaryName).toBe('Coral')
      expect(result.presets).toEqual(customPresets)
    })
  })
})
