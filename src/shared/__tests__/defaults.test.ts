import { describe, it, expect } from 'vitest'
import { defaultConfig } from '../defaults'

describe('shared/defaults', () => {
  it('provides all required AppConfig fields', () => {
    expect(defaultConfig.openClawPath).toBe('')
    expect(defaultConfig.workspacePath).toBe('')
    expect(defaultConfig.model).toBe('gpt-4o')
    expect(defaultConfig.provider).toBe('openai')
    expect(defaultConfig.apiKey).toBe('')
    expect(defaultConfig.welcomeSeen).toBe(false)
    expect(Array.isArray(defaultConfig.presets)).toBe(true)
    expect(defaultConfig.presets.length).toBeGreaterThan(0)
  })

  it('has presets with required fields', () => {
    for (const preset of defaultConfig.presets) {
      expect(preset.id).toBeTruthy()
      expect(preset.name).toBeTruthy()
      expect(preset.mode).toBeTruthy()
    }
  })
})
