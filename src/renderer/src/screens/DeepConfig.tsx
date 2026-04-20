import React, { useState, useEffect } from 'react'
import { Tooltip } from '../components/Tooltip'
import { HelpHint } from '../components/Tooltip'
import { useIpc } from '../hooks/useIpc'
import { IPC_CHANNELS } from '../../../shared/ipc'
import type { AppConfig, Preset } from '../../../shared/types'

interface DeepConfigProps {
  config: AppConfig
  onSave: (updates: Partial<AppConfig>) => Promise<AppConfig>
}

export const DeepConfig: React.FC<DeepConfigProps> = ({ config, onSave }) => {
  const { invoke } = useIpc()
  const [form, setForm] = useState(config)
  const [apiKey, setApiKeyState] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newPreset, setNewPreset] = useState({ name: '', mode: '' })
  const [detecting, setDetecting] = useState(false)
  const [secureStorageAvailable, setSecureStorageAvailable] = useState(true)

  useEffect(() => { setForm(config) }, [config])

  // Check if OS-level secure storage is available
  useEffect(() => {
    invoke<boolean>(IPC_CHANNELS.CHECK_SECURE_STORAGE).then((available) => {
      setSecureStorageAvailable(available)
    }).catch(() => {
      // Assume available if check fails — err on the side of not alarming the user
    })
  }, [invoke])

  // Load API key from secure storage on mount
  useEffect(() => {
    invoke<string>(IPC_CHANNELS.GET_API_KEY).then((key) => {
      if (key) setApiKeyState(key)
    }).catch(() => {
      // Secure storage may not be available; key field starts empty
    })
  }, [invoke])

  const handleAutoDetect = async () => {
    setDetecting(true)
    try {
      const detected = await invoke<string>(IPC_CHANNELS.DETECT_PATH)
      if (detected) {
        setForm((f) => ({ ...f, openClawPath: detected }))
      }
    } catch {
      // Detection failed silently
    } finally {
      setDetecting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    // Save config (without apiKey) and save apiKey separately via secure storage
    await onSave(form)
    try {
      const result = await invoke<{ stored: boolean }>(IPC_CHANNELS.SET_API_KEY, apiKey)
      if (result && !result.stored) {
        // Key was not persisted — safeStorage is unavailable
        setSecureStorageAvailable(false)
      }
    } catch {
      // safeStorage might not be available; key will not persist
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addPreset = () => {
    if (!newPreset.name || !newPreset.mode) return
    const preset: Preset = {
      id: Date.now().toString(),
      name: newPreset.name,
      mode: newPreset.mode,
    }
    setForm((f) => ({ ...f, presets: [...f.presets, preset] }))
    setNewPreset({ name: '', mode: '' })
  }

  const removePreset = (id: string) => {
    setForm((f) => ({ ...f, presets: f.presets.filter((p) => p.id !== id) }))
  }

  return (
    <div className="deep-config">
      <h1 className="screen-title">
        Deep Config
      </h1>
      <p className="screen-subtitle" style={{ lineHeight: 1.6 }}>
        🔧 These are the settings that control how the app connects to OpenClaw. Hover over any <span style={{ color: 'var(--color-primary)' }}>?</span> icon for an explanation.
      </p>

      {/* What is this? hint */}
      <div className="hint-box" style={{ marginBottom: 24 }}>
        <span className="hint-box__icon">💡</span>
        <p className="hint-box__text">
          <strong style={{ color: 'var(--color-text)' }}>Not sure what to put here?</strong> If you ran the Setup Wizard,
          most of this is already filled in. You usually only need to change these if something is not working or you
          want to switch to a different AI model.
        </p>
      </div>

      <section className="deep-config__section">
        <h2 className="deep-config__section-title">
          Emissary
        </h2>
        <div>
          <label className="label">
            Emissary Name
            <HelpHint text="Give your emissary a name! This name appears throughout the app — in status messages, tooltips, the Fishtank, and more. Default is 'Azurel'." />
          </label>
          <input type="text" value={form.emissaryName}
            onChange={(e) => setForm((f) => ({ ...f, emissaryName: e.target.value }))}
            placeholder="Azurel" aria-label="Emissary name" className="input" />
          <p className="deep-config__field-hint">
            🧜‍♂️ Your emissary will introduce himself as <strong style={{ color: 'var(--color-primary)' }}>{form.emissaryName || 'Azurel'}</strong> throughout the app.
          </p>
        </div>
      </section>

      <section className="deep-config__section">
        <h2 className="deep-config__section-title">
          Paths
        </h2>
        <div className="deep-config__field-group">
          <div>
            <label className="label">
              OpenClaw Path
              <HelpHint text="This is the folder on your computer where OpenClaw is installed. It should contain a file called 'package.json'. Example: /Users/you/openclaw or C:\Users\you\openclaw" />
            </label>
            <input type="text" value={form.openClawPath}
              onChange={(e) => setForm((f) => ({ ...f, openClawPath: e.target.value }))}
              placeholder="/path/to/openclaw" aria-label="OpenClaw installation path" className="input" />
            <div className="deep-config__inline-actions">
              <Tooltip text="Open a folder picker to select the OpenClaw directory. Easier than typing!">
                <button
                  onClick={async () => {
                    const selected = await invoke<string>(IPC_CHANNELS.BROWSE_FOLDER)
                    if (selected) setForm((f) => ({ ...f, openClawPath: selected }))
                  }}
                  aria-label="Browse for OpenClaw directory"
                  className="deep-config__btn-sm"
                >
                  📁 Browse…
                </button>
              </Tooltip>
              <Tooltip text="Scan common folders on your computer to find an OpenClaw installation automatically.">
                <button
                  onClick={handleAutoDetect}
                  disabled={detecting}
                  aria-label={detecting ? 'Scanning for OpenClaw' : 'Auto-detect OpenClaw path'}
                  className="deep-config__btn-sm"
                  style={{ cursor: detecting ? 'wait' : 'pointer' }}
                >
                  {detecting ? '⏳ Scanning...' : '🔍 Auto-detect'}
                </button>
              </Tooltip>
            </div>
          </div>
          <div>
            <label className="label">
              Workspace Path
              <HelpHint text="Optional. This is the folder where you want the agent to do its work (read/write files). If left empty, it defaults to the OpenClaw directory." />
            </label>
            <input type="text" value={form.workspacePath}
              onChange={(e) => setForm((f) => ({ ...f, workspacePath: e.target.value }))}
              placeholder="/path/to/workspace (optional)" aria-label="Workspace path" className="input" />
            <div style={{ marginTop: 6 }}>
              <Tooltip text="Open a folder picker to select a workspace directory.">
                <button
                  onClick={async () => {
                    const selected = await invoke<string>(IPC_CHANNELS.BROWSE_FOLDER)
                    if (selected) setForm((f) => ({ ...f, workspacePath: selected }))
                  }}
                  aria-label="Browse for workspace directory"
                  className="deep-config__btn-sm"
                >
                  📁 Browse…
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </section>

      <section className="deep-config__section">
        <h2 className="deep-config__section-title">
          Model & Provider
        </h2>
        <div className="deep-config__grid">
          <div>
            <label className="label">
              Provider
              <HelpHint text="The company that provides the AI. Usually 'openai' (for GPT models) or 'anthropic' (for Claude models). If you are not sure, leave it as 'openai'." />
            </label>
            <input type="text" value={form.provider}
              onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
              placeholder="openai" aria-label="AI provider" className="input" />
          </div>
          <div>
            <label className="label">
              Model
              <HelpHint text="The specific AI model to use. 'gpt-4o' is a good default. Other options include 'gpt-3.5-turbo' (faster, cheaper) or 'claude-3-opus' (if using Anthropic)." />
            </label>
            <input type="text" value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              placeholder="gpt-4o" aria-label="AI model" className="input" />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <label className="label">
            API Key
            <HelpHint text="A secret key from your AI provider that lets the agent talk to the AI service. Get one from platform.openai.com (for OpenAI) or console.anthropic.com (for Anthropic). It starts with 'sk-'. Keep it private!" />
          </label>
          <input type="password" value={apiKey}
            onChange={(e) => setApiKeyState(e.target.value)}
            placeholder="sk-..." aria-label="API key" className="input" />
          {secureStorageAvailable ? (
            <p className="deep-config__field-hint">
              🔒 This key is stored securely using your operating system&apos;s keychain. It is never saved as plain text.
            </p>
          ) : (
            <div className="deep-config__secure-warning">
              <p style={{ fontSize: 12, color: 'var(--color-error)', fontWeight: 600, marginBottom: 4 }}>
                ⚠️ Secure storage is not available on this system
              </p>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Your operating system does not provide a keychain or credential manager that
                this app can use. <strong style={{ color: 'var(--color-text)' }}>The API key will not be saved between sessions.</strong> To
                keep your key available, set it as an environment variable instead:
              </p>
              <code className="deep-config__code-block">
                export OPENAI_API_KEY=sk-...
              </code>
            </div>
          )}
        </div>
      </section>

      <section className="deep-config__section">
        <h2 className="deep-config__section-title deep-config__section-title--flex">
          Saved Presets
          <HelpHint text="Presets are shortcuts for different task types. Each preset has a name and a 'mode' that tells the agent how to behave. You can create your own or use the built-in ones." />
        </h2>
        <div className="deep-config__preset-list">
          {form.presets.map((p) => (
            <div key={p.id} className="deep-config__preset-item">
              <span className="deep-config__preset-name">{p.name}</span>
              <span className="deep-config__preset-mode">{p.mode}</span>
              <Tooltip text="Remove this preset from your list.">
                <button onClick={() => removePreset(p.id)} aria-label={`Remove preset ${p.name}`} className="deep-config__preset-remove">×</button>
              </Tooltip>
            </div>
          ))}
        </div>
        <div className="deep-config__preset-inputs">
          <input type="text" value={newPreset.name}
            onChange={(e) => setNewPreset((p) => ({ ...p, name: e.target.value }))}
            placeholder="Preset name" aria-label="New preset name" className="input" style={{ flex: 1 }} />
          <input type="text" value={newPreset.mode}
            onChange={(e) => setNewPreset((p) => ({ ...p, mode: e.target.value }))}
            placeholder="Mode key" aria-label="New preset mode key" className="input" style={{ flex: 1 }} />
          <Tooltip text="Add a new custom preset. Enter a name and a mode key (like 'code' or 'research'), then click +.">
            <button onClick={addPreset} aria-label="Add new preset" className="deep-config__add-btn">
              + Add
            </button>
          </Tooltip>
        </div>
      </section>

      <Tooltip text="Save all the settings you have changed. They will be remembered next time you open the app.">
        <button onClick={handleSave} disabled={saving} aria-label={saving ? 'Saving configuration' : saved ? 'Configuration saved' : 'Save configuration'} className="deep-config__save-btn" style={{
          background: saved ? 'var(--color-success)' : 'var(--color-primary)',
        }}>
          {saving ? '⏳ Saving...' : saved ? '✅ Saved!' : '💾 Save Configuration'}
        </button>
      </Tooltip>
    </div>
  )
}
