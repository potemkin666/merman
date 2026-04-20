import React, { useState, useEffect } from 'react'
import { StatusCard } from '../components/StatusCard'
import { TideBar } from '../components/TideBar'
import { BottleGrid } from '../components/BottleGrid'
import { Tooltip } from '../components/Tooltip'
import { HelpHint } from '../components/Tooltip'
import type { AppConfig, ServiceStatus, TaskResult, EnvCheckResult } from '../../../shared/types'
import { useIpc } from '../hooks/useIpc'
import { IPC_CHANNELS } from '../../../shared/ipc'

interface HarborProps {
  config: AppConfig
  status: ServiceStatus
  recentTasks: TaskResult[]
  onStatusChange: (s: ServiceStatus) => void
  onNavigate: (page: string) => void
}

export const Harbor: React.FC<HarborProps> = ({ config, status, recentTasks, onStatusChange, onNavigate }) => {
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
    ? '🌊 The waters are unstable. Check Deep Config for your settings.'
    : '🔱 The emissary is awaiting your command.'

  const allOk = envResults.length > 0 && envResults.every((r) => r.ok)
  const failCount = envResults.filter((r) => !r.ok).length
  const needsSetup = !config.openClawPath

  return (
    <div className="screen-page">
      <header>
        <h1 className="screen-title">The Harbour</h1>
        <p className="screen-subtitle">{statusCopy}</p>
      </header>

      {/* Tide status bar — replaces plain status text with animated tide line */}
      <TideBar status={status} />

      {/* First-time nudge */}
      {needsSetup && (
        <div className="nudge-banner">
          <div style={{ fontSize: 32 }}>👋</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 4 }}>
              Looks like you have not set up yet!
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              No worries — click the button below and the Setup Wizard will walk you through
              everything step by step. It only takes a minute.
            </p>
          </div>
          <Tooltip text="Opens the Setup Wizard — a friendly step-by-step guide to get everything ready.">
            <button
              onClick={() => onNavigate('setup')}
              aria-label="Start setup wizard"
              className="btn btn--primary"
              style={{ whiteSpace: 'nowrap' }}
            >
              ⚙️ Start Setup
            </button>
          </Tooltip>
        </div>
      )}

      {/* What is an agent? hint */}
      <div className="hint-box" style={{ alignItems: 'center' }}>
        <span className="hint-box__icon">💡</span>
        <p className="hint-box__text" style={{ flex: 1 }}>
          <strong style={{ color: 'var(--color-text)' }}>What is an agent?</strong> An AI agent is a program that can
          understand instructions in plain English, then figure out how to carry them out — like having a very smart
          assistant that can read, write, search, and create things for you.
        </p>
      </div>

      <StatusCard status={status} model={config.model} provider={config.provider} />

      {/* Environment Readiness */}
      {envChecked && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center' }}>
            Environment Health
            <HelpHint text="These checks tell you if your computer has everything it needs to run OpenClaw. Green = good. Red = needs attention. Click Setup in the sidebar to fix issues." />
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} role="list" aria-label="Environment check results">
            {envResults.map((r) => (
              <Tooltip key={r.name} text={r.ok ? `${r.name} is installed and working${r.version ? ` (v${r.version})` : ''}.` : (r.message || `${r.name} needs attention.`)} position="bottom">
                <span role="listitem" className={r.ok ? 'env-pill env-pill--ok' : 'env-pill env-pill--fail'}>
                  {r.ok ? '●' : '○'} {r.name}
                </span>
              </Tooltip>
            ))}
          </div>
          {!allOk && (
            <p style={{ marginTop: 10, fontSize: 12, color: 'var(--color-warning)' }}>
              {failCount} {failCount === 1 ? 'check' : 'checks'} not passing. Open <button onClick={() => onNavigate('setup')} aria-label="Open setup wizard to resolve issues" className="btn--link">Setup</button> to resolve.
            </p>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="action-group" role="group" aria-label="Service controls">
        <Tooltip text="Start the OpenClaw service. This boots up the AI agent so it can receive tasks. Think of it like turning on the engine.">
          <button
            onClick={handleSummon}
            disabled={isRunning}
            aria-label="Summon — start the OpenClaw service"
            className={`btn ${isRunning ? 'btn--primary' : 'btn--primary'}`}
            style={isRunning ? { background: 'rgba(0,200,212,0.2)', color: 'var(--color-text-muted)', boxShadow: 'none', cursor: 'not-allowed' } : {}}
          >
            🔱 Summon
          </button>
        </Tooltip>
        <Tooltip text="Stop the OpenClaw service. The agent will shut down and stop accepting tasks.">
          <button
            onClick={handleStop}
            disabled={!isRunning}
            aria-label="Stop the OpenClaw service"
            className={`btn ${isRunning ? 'btn--danger' : 'btn--outline'}`}
          >
            ✋ Stop
          </button>
        </Tooltip>
        <Tooltip text="Restart the service — stop and start again. Useful if something seems stuck.">
          <button
            onClick={handleRestart}
            disabled={!isRunning}
            aria-label="Restart the OpenClaw service"
            className="btn"
            style={isRunning
              ? { background: 'rgba(0,200,212,0.1)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }
              : { background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }
            }
          >
            🔄 Restart
          </button>
        </Tooltip>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 16, display: 'flex', alignItems: 'center' }}>
        Messages in Bottles
        <HelpHint text="These are tasks you have sent to the emissary. Each bottle holds a past dispatch. Click one to uncork it and read the results. Cracked bottles mean something went wrong." />
      </h2>
      {recentTasks.length === 0 ? (
        <div className="empty-state">
          No bottles yet. Head to <button onClick={() => onNavigate('dispatch')} aria-label="Navigate to Dispatch screen" className="btn--link" style={{ fontSize: 14 }}>Dispatch</button> to send your first message into the deep!
        </div>
      ) : (
        <BottleGrid tasks={recentTasks} />
      )}
    </div>
  )
}
