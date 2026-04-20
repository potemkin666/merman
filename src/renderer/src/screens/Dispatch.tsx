import React, { useState, useEffect, useRef } from 'react'
import { useIpc } from '../hooks/useIpc'
import { Tooltip } from '../components/Tooltip'
import { HelpHint } from '../components/Tooltip'
import { AdvancedConfirmDialog } from '../components/AdvancedConfirmDialog'
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
  const [elapsed, setElapsed] = useState(0)
  const [cancelling, setCancelling] = useState(false)
  const [showAdvancedConfirm, setShowAdvancedConfirm] = useState(false)
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Elapsed time counter during dispatch
  useEffect(() => {
    if (dispatching) {
      setElapsed(0)
      elapsedRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    } else {
      if (elapsedRef.current) {
        clearInterval(elapsedRef.current)
        elapsedRef.current = null
      }
    }
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current)
    }
  }, [dispatching])

  const allModes = [
    ...AGENT_MODES,
    ...config.presets
      .filter((p: Preset) => !AGENT_MODES.some((m) => m.value === p.mode))
      .map((p: Preset) => ({ value: p.mode, label: p.name, hint: p.description || '' })),
  ]

  const name = config.emissaryName || 'Azurel'

  const getStatusCopy = () => {
    if (cancelling) return '🛑 Cancelling the task...'
    if (dispatching) return `🌊 ${name} has been dispatched! He is working on it... (${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')} elapsed)`
    if (result && !result.ok) return '⚠️ Something went wrong. Read the explanation below — it will tell you what to do.'
    if (result?.ok) return `🔱 ${name} has returned with results! Scroll down to see them.`
    return `🔱 Tell ${name} what you need. Type it in plain English below — no special format needed.`
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await invoke(IPC_CHANNELS.CANCEL_TASK)
    } catch {
      // Best-effort cancel
    }
    setCancelling(false)
  }

  const handleDispatch = async () => {
    if (!prompt.trim()) return

    // If the selected mode is "advanced" (Advanced Custom preset), require confirmation first
    const isAdvancedMode = mode === 'advanced'
    if (isAdvancedMode && !showAdvancedConfirm) {
      setShowAdvancedConfirm(true)
      return
    }

    setShowAdvancedConfirm(false)
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
    <div className="screen-page">
      {/* Advanced Custom confirmation dialog */}
      <AdvancedConfirmDialog
        open={showAdvancedConfirm}
        prompt={prompt.trim()}
        openClawPath={config.openClawPath}
        onConfirm={handleDispatch}
        onCancel={() => setShowAdvancedConfirm(false)}
      />

      <h1 className="screen-title">
        Dispatch
      </h1>
      <p className="screen-subtitle" style={{ lineHeight: 1.6 }}>
        {getStatusCopy()}
      </p>

      {/* How-to hint */}
      {!result && !dispatching && (
        <div className="hint-box">
          <span className="hint-box__icon">💡</span>
          <div className="hint-box__text">
            <strong style={{ color: 'var(--color-text)' }}>How to write a good task:</strong> Just describe what you want
            in plain English. Be specific. For example: <em style={{ color: 'var(--color-primary)' }}>&quot;Summarize the main
            points of this article&quot;</em> or <em style={{ color: 'var(--color-primary)' }}>&quot;Write a Python script
            that renames all .txt files in a folder&quot;</em>. The more detail you give, the better the result.
          </div>
        </div>
      )}

      <div className="card card--padded card--mb">
        <label className="label" style={{ marginBottom: 8 }}>
          Instruction
          <HelpHint text="Type what you want the AI agent to do. Use plain English — no coding or special commands needed. Be as specific as you can." />
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`Describe the task for ${name}... For example: "Write me a short email thanking my team for their hard work this week"`}
          rows={6}
          aria-label={`Task instruction for ${name}`}
          className="input input--textarea"
        />

        <div className="dispatch__controls">
          <div className="dispatch__mode-wrapper">
            <label className="label label--sm" style={{ marginBottom: 6 }}>
              Mode
              <HelpHint text="Modes change how the agent approaches your task. 'Default' works for most things. Pick 'Code' for programming tasks, 'Research' for investigation, etc. Not sure? Just leave it on Default." />
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              aria-label="Agent mode"
              className="input"
              style={{ padding: '9px 12px' }}
            >
              {allModes.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <Tooltip text={dispatching ? `${name} is already working on something. Please wait.` : !prompt.trim() ? 'Type an instruction first, then click here to send it.' : `Click to send this task to ${name}. He will dive into the depths and return with results.`}>
            <button
              onClick={handleDispatch}
              disabled={dispatching || !prompt.trim()}
              aria-label={dispatching ? 'Dispatching task' : `Dispatch task to ${name}`}
              className="dispatch__btn"
              style={{
                background: dispatching || !prompt.trim() ? 'rgba(0,200,212,0.2)' : 'var(--color-primary)',
                color: dispatching || !prompt.trim() ? 'var(--color-text-muted)' : '#0a0f1e',
                cursor: dispatching || !prompt.trim() ? 'not-allowed' : 'pointer',
                boxShadow: dispatching || !prompt.trim() ? 'none' : 'var(--glow-primary)',
              }}
            >
              {dispatching ? `⏳ Dispatching... (${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')})` : `🔱 Dispatch ${name}`}
            </button>
          </Tooltip>
          {dispatching && (
            <Tooltip text={`Cancel the current task. ${name} will return immediately.`}>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                aria-label="Cancel the running task"
                className="dispatch__cancel-btn"
                style={{
                  cursor: cancelling ? 'wait' : 'pointer',
                  opacity: cancelling ? 0.6 : 1,
                }}
              >
                {cancelling ? '🛑 Cancelling...' : '🛑 Cancel'}
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Result or error */}
      {result && result.ok && (
        <div className="dispatch__result">
          <h3 className="dispatch__result-title" style={{ color: 'var(--color-success)' }}>
            ✅ Returned to shore
          </h3>
          <pre className="output-pre">
            {result.output || 'Task completed successfully.'}
          </pre>
        </div>
      )}

      {result && !result.ok && (
        <div className="card" style={{ borderColor: 'rgba(232,93,93,0.3)', padding: 20 }}>
          <h3 className="dispatch__result-title" style={{ color: 'var(--color-error)' }}>
            ❌ {name} returned empty-handed
          </h3>
          {result.explanation ? (
            <div className="dispatch__error-detail">
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
            <pre className="output-pre" style={{ color: 'var(--color-error)', maxHeight: 200 }}>
              {result.error}
            </pre>
          )}
          {result.explanation?.retryable !== false && (
            <Tooltip text="Try the same task again. Sometimes things work on the second try if it was a temporary issue.">
              <button
                onClick={handleDispatch}
                disabled={dispatching}
                aria-label="Retry the failed task"
                className="btn btn--warning"
                style={{ marginTop: 12, fontSize: 13 }}
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
