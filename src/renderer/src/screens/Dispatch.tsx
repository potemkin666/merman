import React, { useState } from 'react'
import { useIpc } from '../hooks/useIpc'
import { Tooltip } from '../components/Tooltip'
import { HelpHint } from '../components/Tooltip'
import { IPC_CHANNELS } from '../../../shared/ipc'
import type { AppConfig, TaskResult, Preset, CommandResult } from '../../../shared/types'

interface DispatchProps {
  config: AppConfig
  onTaskAdded: (task: TaskResult) => void
}

const AGENT_MODES = [
  { value: 'default', label: 'Default', hint: 'General purpose — good for most tasks' },
  { value: 'research', label: 'Research', hint: 'Best for investigating topics and summarizing findings' },
  { value: 'code', label: 'Code Generation', hint: 'Writes, reviews, or explains code' },
  { value: 'debug', label: 'Debug', hint: 'Finds and fixes problems in code or configuration' },
  { value: 'plan', label: 'Planning', hint: 'Creates plans, outlines, or step-by-step guides' },
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
      .map((p: Preset) => ({ value: p.mode, label: p.name, hint: p.description || '' })),
  ]

  const getStatusCopy = () => {
    if (dispatching) return '🌊 The emissary has been dispatched! He is working on it...'
    if (result && !result.ok) return '⚠️ Something went wrong. Read the explanation below — it will tell you what to do.'
    if (result?.ok) return '🔱 The emissary has returned with results! Scroll down to see them.'
    return '🔱 Tell the emissary what you need. Type it in plain English below — no special format needed.'
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
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>
        {getStatusCopy()}
      </p>

      {/* How-to hint */}
      {!result && !dispatching && (
        <div style={{
          background: 'var(--color-panel)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--color-text)' }}>How to write a good task:</strong> Just describe what you want
            in plain English. Be specific. For example: <em style={{ color: 'var(--color-primary)' }}>&quot;Summarize the main
            points of this article&quot;</em> or <em style={{ color: 'var(--color-primary)' }}>&quot;Write a Python script
            that renames all .txt files in a folder&quot;</em>. The more detail you give, the better the result.
          </div>
        </div>
      )}

      <div style={{
        background: 'var(--color-panel)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        marginBottom: 20,
      }}>
        <label style={{ display: 'flex', alignItems: 'center', marginBottom: 8, fontSize: 13, color: 'var(--color-text-muted)' }}>
          Instruction
          <HelpHint text="Type what you want the AI agent to do. Use plain English — no coding or special commands needed. Be as specific as you can." />
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the task for the emissary... For example: &quot;Write me a short email thanking my team for their hard work this week&quot;"
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
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: 6, fontSize: 12, color: 'var(--color-text-muted)' }}>
              Mode
              <HelpHint text="Modes change how the agent approaches your task. 'Default' works for most things. Pick 'Code' for programming tasks, 'Research' for investigation, etc. Not sure? Just leave it on Default." />
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

          <Tooltip text={dispatching ? 'The emissary is already working on something. Please wait.' : !prompt.trim() ? 'Type an instruction first, then click here to send it.' : 'Click to send this task to the emissary. He will dive into the depths and return with results.'}>
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
          </Tooltip>
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
            <Tooltip text="Try the same task again. Sometimes things work on the second try if it was a temporary issue.">
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
            </Tooltip>
          )}
        </div>
      )}
    </div>
  )
}
