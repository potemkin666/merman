import React, { useState } from 'react'
import { useIpc } from '../hooks/useIpc'
import { IPC_CHANNELS } from '../../../shared/ipc'
import type { AppConfig, TaskResult, Preset } from '../../../shared/types'

interface DispatchProps {
  config: AppConfig
  onTaskAdded: (task: TaskResult) => void
}

const AGENT_MODES = [
  { value: 'default', label: 'Default' },
  { value: 'research', label: 'Research' },
  { value: 'code', label: 'Code Generation' },
  { value: 'debug', label: 'Debug' },
  { value: 'plan', label: 'Planning' },
]

export const Dispatch: React.FC<DispatchProps> = ({ config, onTaskAdded }) => {
  const { invoke } = useIpc()
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState('default')
  const [dispatching, setDispatching] = useState(false)
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const allModes = [
    ...AGENT_MODES,
    ...config.presets.map((p: Preset) => ({ value: p.mode, label: p.name })),
  ]

  const getStatusCopy = () => {
    if (dispatching) return '🌊 Dispatched into the depths...'
    if (error) return '⚠️ The current returned turbulent.'
    if (output) return '🦞 Surfacing with results.'
    return '🔱 The emissary awaits your command.'
  }

  const handleDispatch = async () => {
    if (!prompt.trim()) return
    setDispatching(true)
    setOutput(null)
    setError(null)

    const task: TaskResult = {
      id: Date.now().toString(),
      prompt: prompt.trim(),
      mode,
      status: 'running',
      startedAt: new Date().toISOString(),
    }

    const result = await invoke<{ ok: boolean; output?: string; error?: string }>(
      IPC_CHANNELS.DISPATCH_TASK,
      { prompt: prompt.trim(), mode, openClawPath: config.openClawPath }
    )

    const finalTask: TaskResult = {
      ...task,
      status: result.ok ? 'done' : 'error',
      output: result.ok ? result.output : undefined,
      finishedAt: new Date().toISOString(),
    }

    onTaskAdded(finalTask)
    setDispatching(false)

    if (result.ok) {
      setOutput(result.output || 'Task completed successfully.')
    } else {
      setError(result.error || 'Unknown error')
    }
  }

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>
        The Dispatch Chamber
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 32, fontSize: 14 }}>
        {getStatusCopy()}
      </p>

      <div style={{
        background: 'var(--color-panel)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        marginBottom: 20,
      }}>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--color-text-muted)' }}>
          Instruction / Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the task for the emissary..."
          rows={6}
          style={{
            width: '100%',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            color: 'var(--color-text)',
            fontSize: 14,
            resize: 'vertical',
            outline: 'none',
            lineHeight: 1.5,
          }}
        />

        <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--color-text-muted)' }}>
              Agent Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '9px 12px',
                color: 'var(--color-text)',
                fontSize: 14,
                outline: 'none',
              }}
            >
              {allModes.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDispatch}
            disabled={dispatching || !prompt.trim()}
            style={{
              marginTop: 20,
              padding: '10px 28px',
              background: dispatching || !prompt.trim() ? 'rgba(0,200,212,0.2)' : 'var(--color-primary)',
              color: dispatching || !prompt.trim() ? 'var(--color-text-muted)' : '#0a0f1e',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: 14,
              cursor: dispatching || !prompt.trim() ? 'not-allowed' : 'pointer',
              boxShadow: dispatching || !prompt.trim() ? 'none' : 'var(--glow-primary)',
              whiteSpace: 'nowrap',
            }}
          >
            {dispatching ? '⏳ Dispatching...' : '🔱 Dispatch Emissary'}
          </button>
        </div>
      </div>

      {(output || error) && (
        <div style={{
          background: 'var(--color-panel)',
          border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: 20,
        }}>
          <h3 style={{
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 12,
            color: error ? 'var(--color-error)' : 'var(--color-success)',
          }}>
            {error ? '❌ Error' : '✅ Result'}
          </h3>
          <pre style={{
            fontSize: 12,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            color: error ? 'var(--color-error)' : 'var(--color-text)',
            background: 'var(--color-surface)',
            padding: 12,
            borderRadius: 'var(--radius-md)',
            maxHeight: 300,
            overflowY: 'auto',
          }}>
            {error || output}
          </pre>
        </div>
      )}
    </div>
  )
}
