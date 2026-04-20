import React, { useState, useEffect } from 'react'
import { StatusCard } from '../components/StatusCard'
import type { AppConfig, ServiceStatus, TaskResult, EnvCheckResult } from '../../../shared/types'
import { useIpc } from '../hooks/useIpc'
import { IPC_CHANNELS } from '../../../shared/ipc'

interface HarborProps {
  config: AppConfig
  status: ServiceStatus
  recentTasks: TaskResult[]
  onStatusChange: (s: ServiceStatus) => void
}

const btnBase: React.CSSProperties = {
  padding: '10px 24px',
  borderRadius: 'var(--radius-md)',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
}

export const Harbor: React.FC<HarborProps> = ({ config, status, recentTasks, onStatusChange }) => {
  const { invoke } = useIpc()
  const [envResults, setEnvResults] = useState<EnvCheckResult[]>([])
  const [envChecked, setEnvChecked] = useState(false)

  useEffect(() => {
    invoke<EnvCheckResult[]>(IPC_CHANNELS.CHECK_ENV).then((results) => {
      setEnvResults(results)
      setEnvChecked(true)
    })
  }, [invoke])

  const handleSummon = async () => {
    onStatusChange('running')
    await invoke(IPC_CHANNELS.START_SERVICE, config.openClawPath)
  }

  const handleStop = async () => {
    await invoke(IPC_CHANNELS.STOP_SERVICE)
    onStatusChange('stopped')
  }

  const handleRestart = async () => {
    onStatusChange('running')
    await invoke(IPC_CHANNELS.RESTART_SERVICE, config.openClawPath)
  }

  const isRunning = status === 'running'
  const statusCopy = isRunning
    ? '⚡ The emissary stirs in the depths.'
    : status === 'stopped'
    ? '💤 The emissary has returned to the deep.'
    : status === 'error'
    ? '🌊 The waters are unstable. Review configuration.'
    : '🔱 The emissary is awaiting your command.'

  const allOk = envResults.length > 0 && envResults.every((r) => r.ok)
  const failCount = envResults.filter((r) => !r.ok).length

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>
        The Harbor
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 32, fontSize: 14 }}>
        {statusCopy}
      </p>

      <StatusCard status={status} model={config.model} provider={config.provider} />

      {/* Environment Readiness */}
      {envChecked && (
        <div style={{
          marginTop: 20,
          background: 'var(--color-panel)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
        }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 12 }}>
            Environment Health
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {envResults.map((r) => (
              <span key={r.name} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 'var(--radius-sm)',
                background: r.ok ? 'rgba(45,212,160,0.1)' : 'rgba(232,93,93,0.1)',
                color: r.ok ? 'var(--color-success)' : 'var(--color-error)',
                fontSize: 12,
                fontWeight: 500,
              }}>
                {r.ok ? '●' : '○'} {r.name}
              </span>
            ))}
          </div>
          {!allOk && (
            <p style={{ marginTop: 10, fontSize: 12, color: 'var(--color-warning)' }}>
              {failCount} {failCount === 1 ? 'check' : 'checks'} not passing. Open Setup to resolve.
            </p>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24, marginBottom: 32 }}>
        <button
          onClick={handleSummon}
          disabled={isRunning}
          style={{
            ...btnBase,
            background: isRunning ? 'rgba(0,200,212,0.2)' : 'var(--color-primary)',
            color: isRunning ? 'var(--color-text-muted)' : '#0a0f1e',
            boxShadow: isRunning ? 'none' : 'var(--glow-primary)',
          }}
        >
          🔱 Summon
        </button>
        <button
          onClick={handleStop}
          disabled={!isRunning}
          style={{
            ...btnBase,
            background: !isRunning ? 'transparent' : 'rgba(232, 93, 93, 0.15)',
            color: !isRunning ? 'var(--color-text-muted)' : 'var(--color-error)',
            border: `1px solid ${!isRunning ? 'var(--color-border)' : 'var(--color-error)'}`,
          }}
        >
          ✋ Stop
        </button>
        <button
          onClick={handleRestart}
          disabled={!isRunning}
          style={{
            ...btnBase,
            background: !isRunning ? 'transparent' : 'rgba(0,200,212,0.1)',
            color: !isRunning ? 'var(--color-text-muted)' : 'var(--color-primary)',
            border: `1px solid ${!isRunning ? 'var(--color-border)' : 'var(--color-primary)'}`,
          }}
        >
          🔄 Restart
        </button>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 16 }}>
        Recent Dispatches
      </h2>
      {recentTasks.length === 0 ? (
        <div style={{
          background: 'var(--color-panel)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 24,
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          fontSize: 14,
        }}>
          No dispatches yet. Navigate to Dispatch to send your first task.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recentTasks.slice(0, 8).map((task) => (
            <div key={task.id} style={{
              background: 'var(--color-panel)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <span style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                background: task.status === 'done' ? 'rgba(45,212,160,0.15)' :
                  task.status === 'error' ? 'rgba(232,93,93,0.15)' : 'rgba(0,200,212,0.15)',
                color: task.status === 'done' ? 'var(--color-success)' :
                  task.status === 'error' ? 'var(--color-error)' : 'var(--color-primary)',
                fontWeight: 600,
              }}>
                {task.status === 'done' ? 'returned' : task.status === 'error' ? 'lost' : task.status}
              </span>
              <span style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.prompt}
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                {new Date(task.startedAt).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
