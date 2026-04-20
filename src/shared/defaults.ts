import type { AppConfig } from './types'

export const defaultConfig: AppConfig = {
  openClawPath: '',
  workspacePath: '',
  model: 'gpt-4o',
  provider: 'openai',
  apiKey: '',
  emissaryName: 'Azurel',
  welcomeSeen: false,
  presets: [
    { id: '1', name: 'Quick Chat', mode: 'default', description: 'Simple conversational task' },
    { id: '2', name: 'Starter Mode', mode: 'starter', description: 'Guided, safe defaults for beginners' },
    { id: '3', name: 'Coding Helper', mode: 'code', description: 'Code generation and review' },
    { id: '4', name: 'Local Researcher', mode: 'research', description: 'Investigate, summarize, and report' },
    { id: '5', name: 'Advanced Custom', mode: 'advanced', description: 'Full control, no guardrails' },
  ],
}
