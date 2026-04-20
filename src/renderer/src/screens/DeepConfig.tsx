import React, { useState, useEffect } from 'react'
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
  display: 'block',
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
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 32, fontSize: 14 }}>
        🔧 Configure the harbor settings.
      </p>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--color-text)' }}>
          Paths
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>OpenClaw Path</label>
            <input type="text" value={form.openClawPath}
              onChange={(e) => setForm((f) => ({ ...f, openClawPath: e.target.value }))}
              placeholder="/path/to/openclaw" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Workspace Path</label>
            <input type="text" value={form.workspacePath}
              onChange={(e) => setForm((f) => ({ ...f, workspacePath: e.target.value }))}
              placeholder="/path/to/workspace" style={inputStyle} />
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--color-text)' }}>
          Model & Provider
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Provider</label>
            <input type="text" value={form.provider}
              onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
              placeholder="openai" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Model</label>
            <input type="text" value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              placeholder="gpt-4o" style={inputStyle} />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>API Key</label>
          <input type="password" value={form.apiKey}
            onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
            placeholder="sk-..." style={inputStyle} />
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--color-text)' }}>
          Saved Presets
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
              <button onClick={() => removePreset(p.id)} style={{
                background: 'transparent',
                color: 'var(--color-error)',
                fontSize: 16,
                cursor: 'pointer',
              }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" value={newPreset.name}
            onChange={(e) => setNewPreset((p) => ({ ...p, name: e.target.value }))}
            placeholder="Preset name" style={{ ...inputStyle, flex: 1 }} />
          <input type="text" value={newPreset.mode}
            onChange={(e) => setNewPreset((p) => ({ ...p, mode: e.target.value }))}
            placeholder="Mode key" style={{ ...inputStyle, flex: 1 }} />
          <button onClick={addPreset} style={{
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
        </div>
      </section>

      <button onClick={handleSave} disabled={saving} style={{
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
    </div>
  )
}
