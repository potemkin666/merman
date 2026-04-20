import React, { useState } from 'react'
import { useIpc } from '../hooks/useIpc'
import { IPC_CHANNELS } from '../../../shared/ipc'
import type { AppConfig, TaskResult, Preset, CommandResult } from '../../../shared/types'

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
  const [result, setResult] = useState<CommandResult | null>(null)

  const allModes = [
    ...AGENT_MODES,
    ...config.presets
      .filter((p: Preset) => !AGENT_MODES.some((m) => m.value === p.mode))
      .map((p: Preset) => ({ value: p.mode, label: p.name })),
  ]

  const getStatusCopy = () => {
    if (dispatching) return '🌊 Dispatched into the depths...'
    if (result && !result.ok) return '⚠️ The waters are unstable. Review configuration.'
    if (result?.ok) return '🔱 Surfacing with results.'
    return '🔱 The emissary is awaiting your command.'
  }

  const handleDispatch = async () => {
    if (!prompt.trim()) return
    setDispatching(true)
    setResult(null)

    const task: TaskResult = {
      id: Date.now().toString(),
      prompt: prompt.trim(),
      mode,
      status: 'running',
      startedAt: new Date().toISOString(),
    }

    const res = await invoke<CommandResult>(
      IPC_CHANNELS.DISPATCH_TASK,
      { prompt: prompt.trim(), mode, openClawPath: config.openClawPath }
    )

    const finalTask: TaskResult = {
      ...task,
      status: res.ok ? 'done' : 'error',
      output: res.ok ? res.output : undefined,
      finishedAt: new Date().toISOString(),
    }

    onTaskAdded(finalTask)
    setDispatching(false)
    setResult(res)
  }

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>
        Dispatch
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
          Instruction
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
              Mode
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

      {/* Result or error */}
      {result && result.ok && (
        <div style={{
          background: 'var(--color-panel)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 20,
        }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--color-success)' }}>
            ✅ Returned to shore
          </h3>
          <pre style={{
            fontSize: 12,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            color: 'var(--color-text)',
            background: 'var(--color-surface)',
            padding: 12,
            borderRadius: 'var(--radius-md)',
            maxHeight: 300,
            overflowY: 'auto',
          }}>
            {result.output || 'Task completed successfully.'}
          </pre>
        </div>
      )}

      {result && !result.ok && (
        <div style={{
          background: 'var(--color-panel)',
          border: '1px solid rgba(232,93,93,0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: 20,
        }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--color-error)' }}>
            ❌ The emissary returned empty-handed
          </h3>
          {result.explanation ? (
            <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
              <p style={{ color: 'var(--color-text)', marginBottom: 4 }}>
                <strong>What happened:</strong> {result.explanation.what}
              </p>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 4 }}>
                <strong>Likely cause:</strong> {result.explanation.cause}
              </p>
              <p style={{ color: 'var(--color-text-muted)' }}>
                <strong>What to do:</strong> {result.explanation.action}
              </p>
            </div>
          ) : (
            <pre style={{
              fontSize: 12,
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              color: 'var(--color-error)',
              background: 'var(--color-surface)',
              padding: 12,
              borderRadius: 'var(--radius-md)',
              maxHeight: 200,
              overflowY: 'auto',
            }}>
              {result.error}
            </pre>
          )}
          {result.explanation?.retryable !== false && (
            <button
              onClick={handleDispatch}
              disabled={dispatching}
              style={{
                marginTop: 12,
                padding: '8px 18px',
                background: 'var(--color-warning)',
                color: '#0a0f1e',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              🔄 Retry
            </button>
          )}
        </div>
      )}
    </div>
  )
}
