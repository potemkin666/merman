import React, { useState, useEffect } from 'react'
import { Tooltip } from '../components/Tooltip'
import { HelpHint } from '../components/Tooltip'
import type { AppConfig, Preset } from '../../../shared/types'

interface DeepConfigProps {
  config: AppConfig
  onSave: (updates: Partial<AppConfig>) => Promise<AppConfig>
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 14px',
  color: 'var(--color-text)',
  fontSize: 14,
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: 6,
  fontSize: 13,
  color: 'var(--color-text-muted)',
}

export const DeepConfig: React.FC<DeepConfigProps> = ({ config, onSave }) => {
  const [form, setForm] = useState(config)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newPreset, setNewPreset] = useState({ name: '', mode: '' })

  useEffect(() => { setForm(config) }, [config])

  const handleSave = async () => {
    setSaving(true)
    await onSave(form)
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
    <div style={{ padding: 32, maxWidth: 700, margin: '0 auto', overflowY: 'auto', height: '100%' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>
        Deep Config
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>
        🔧 These are the settings that control how the app connects to OpenClaw. Hover over any <span style={{ color: 'var(--color-primary)' }}>?</span> icon for an explanation.
      </p>

      {/* What is this? hint */}
      <div style={{
        background: 'var(--color-panel)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 20px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--color-text)' }}>Not sure what to put here?</strong> If you ran the Setup Wizard,
          most of this is already filled in. You usually only need to change these if something is not working or you
          want to switch to a different AI model.
        </p>
      </div>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--color-text)' }}>
          Paths
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>
              OpenClaw Path
              <HelpHint text="This is the folder on your computer where OpenClaw is installed. It should contain a file called 'package.json'. Example: /Users/you/openclaw or C:\Users\you\openclaw" />
            </label>
            <input type="text" value={form.openClawPath}
              onChange={(e) => setForm((f) => ({ ...f, openClawPath: e.target.value }))}
              placeholder="/path/to/openclaw" aria-label="OpenClaw installation path" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>
              Workspace Path
              <HelpHint text="Optional. This is the folder where you want the agent to do its work (read/write files). If left empty, it defaults to the OpenClaw directory." />
            </label>
            <input type="text" value={form.workspacePath}
              onChange={(e) => setForm((f) => ({ ...f, workspacePath: e.target.value }))}
              placeholder="/path/to/workspace (optional)" aria-label="Workspace path" style={inputStyle} />
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--color-text)' }}>
          Model & Provider
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>
              Provider
              <HelpHint text="The company that provides the AI. Usually 'openai' (for GPT models) or 'anthropic' (for Claude models). If you are not sure, leave it as 'openai'." />
            </label>
            <input type="text" value={form.provider}
              onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
              placeholder="openai" aria-label="AI provider" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>
              Model
              <HelpHint text="The specific AI model to use. 'gpt-4o' is a good default. Other options include 'gpt-3.5-turbo' (faster, cheaper) or 'claude-3-opus' (if using Anthropic)." />
            </label>
            <input type="text" value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              placeholder="gpt-4o" aria-label="AI model" style={inputStyle} />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>
            API Key
            <HelpHint text="A secret key from your AI provider that lets the agent talk to the AI service. Get one from platform.openai.com (for OpenAI) or console.anthropic.com (for Anthropic). It starts with 'sk-'. Keep it private!" />
          </label>
          <input type="password" value={form.apiKey}
            onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
            placeholder="sk-..." aria-label="API key" style={inputStyle} />
          <p style={{ marginTop: 6, fontSize: 11, color: 'var(--color-text-muted)' }}>
            🔒 This key is stored locally on your computer only. It is never sent anywhere except to the AI provider you chose.
          </p>
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--color-text)', display: 'flex', alignItems: 'center' }}>
          Saved Presets
          <HelpHint text="Presets are shortcuts for different task types. Each preset has a name and a 'mode' that tells the agent how to behave. You can create your own or use the built-in ones." />
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {form.presets.map((p) => (
            <div key={p.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
            }}>
              <span style={{ flex: 1, fontSize: 14 }}>{p.name}</span>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{p.mode}</span>
              <Tooltip text="Remove this preset from your list.">
                <button onClick={() => removePreset(p.id)} aria-label={`Remove preset ${p.name}`} style={{
                  background: 'transparent',
                  color: 'var(--color-error)',
                  fontSize: 16,
                  cursor: 'pointer',
                }}>×</button>
              </Tooltip>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" value={newPreset.name}
            onChange={(e) => setNewPreset((p) => ({ ...p, name: e.target.value }))}
            placeholder="Preset name" aria-label="New preset name" style={{ ...inputStyle, flex: 1 }} />
          <input type="text" value={newPreset.mode}
            onChange={(e) => setNewPreset((p) => ({ ...p, mode: e.target.value }))}
            placeholder="Mode key" aria-label="New preset mode key" style={{ ...inputStyle, flex: 1 }} />
          <Tooltip text="Add a new custom preset. Enter a name and a mode key (like 'code' or 'research'), then click +.">
            <button onClick={addPreset} aria-label="Add new preset" style={{
              padding: '10px 16px',
              background: 'var(--color-secondary)',
              color: 'var(--color-text)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>
              + Add
            </button>
          </Tooltip>
        </div>
      </section>

      <Tooltip text="Save all the settings you have changed. They will be remembered next time you open the app.">
        <button onClick={handleSave} disabled={saving} aria-label={saving ? 'Saving configuration' : saved ? 'Configuration saved' : 'Save configuration'} style={{
          padding: '12px 32px',
          background: saved ? 'var(--color-success)' : 'var(--color-primary)',
          color: '#0a0f1e',
          borderRadius: 'var(--radius-md)',
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: 'var(--glow-primary)',
          transition: 'all 0.2s',
        }}>
          {saving ? '⏳ Saving...' : saved ? '✅ Saved!' : '💾 Save Configuration'}
        </button>
      </Tooltip>
    </div>
  )
}
