import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock electron app module
vi.mock('electron', () => ({
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
}))

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { getConfig, setConfig } from '../configService'
import { defaultConfig } from '../../../shared/defaults'

const mockReadFileSync = vi.mocked(readFileSync)
const mockWriteFileSync = vi.mocked(writeFileSync)
const mockExistsSync = vi.mocked(existsSync)
const mockMkdirSync = vi.mocked(mkdirSync)

describe('configService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getConfig', () => {
    it('returns defaults and writes file when config does not exist', () => {
      mockExistsSync.mockReturnValue(false)

      const result = getConfig()

      expect(result).toEqual(defaultConfig)
      expect(mockWriteFileSync).toHaveBeenCalledTimes(1)
      // The written JSON should be the defaults
      const writtenJson = JSON.parse(mockWriteFileSync.mock.calls[0][1] as string)
      expect(writtenJson).toEqual(defaultConfig)
    })

    it('merges saved config with defaults when config file exists', () => {
      mockExistsSync.mockReturnValue(true)
      const savedConfig = { openClawPath: '/my/path', model: 'gpt-4-turbo' }
      mockReadFileSync.mockReturnValue(JSON.stringify(savedConfig))

      const result = getConfig()

      expect(result.openClawPath).toBe('/my/path')
      expect(result.model).toBe('gpt-4-turbo')
      // Defaults fill in missing fields
      expect(result.provider).toBe(defaultConfig.provider)
      expect(result.emissaryName).toBe(defaultConfig.emissaryName)
      expect(result.presets).toEqual(defaultConfig.presets)
    })

    it('returns defaults when config file has invalid JSON', () => {
      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue('not valid json {{{')

      const result = getConfig()

      expect(result).toEqual(defaultConfig)
    })

    it('ensures userData directory exists via mkdirSync', () => {
      mockExistsSync.mockReturnValue(false)

      getConfig()

      expect(mockMkdirSync).toHaveBeenCalledWith('/mock/userData', { recursive: true })
    })
  })

  describe('setConfig', () => {
    it('merges updates with current config and writes to disk', () => {
      // First call to getConfig inside setConfig
      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue(JSON.stringify(defaultConfig))

      const result = setConfig({ openClawPath: '/new/path' })

      expect(result.openClawPath).toBe('/new/path')
      // Other fields preserved
      expect(result.model).toBe(defaultConfig.model)
      expect(mockWriteFileSync).toHaveBeenCalledTimes(1)
    })

    it('strips apiKey from updates to avoid storing it in plain text', () => {
      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue(JSON.stringify(defaultConfig))

      const result = setConfig({ apiKey: 'sk-secret-key', model: 'gpt-4o' })

      // The apiKey should be empty in the returned config
      expect(result.apiKey).toBe('')
      // The model update should be applied
      expect(result.model).toBe('gpt-4o')
      // Written JSON should not contain the api key
      const writtenJson = JSON.parse(mockWriteFileSync.mock.calls[0][1] as string)
      expect(writtenJson.apiKey).toBe('')
    })

    it('preserves presets when updating other fields', () => {
      const customPresets = [
        { id: '99', name: 'Test', mode: 'test', description: 'Test preset' },
      ]
      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue(
        JSON.stringify({ ...defaultConfig, presets: customPresets })
      )

      const result = setConfig({ emissaryName: 'Coral' })

      expect(result.emissaryName).toBe('Coral')
      expect(result.presets).toEqual(customPresets)
    })
  })
})
