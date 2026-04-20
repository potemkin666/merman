import React, { useState } from 'react'
import { useIpc } from '../hooks/useIpc'
import { IPC_CHANNELS } from '../../../shared/ipc'
import type { EnvCheckResult, AppConfig } from '../../../shared/types'

interface SetupWizardProps {
  config: AppConfig
  onSave: (updates: Partial<AppConfig>) => Promise<AppConfig>
}

const STEPS = ['Welcome', 'Prerequisites', 'Configuration', 'Install', 'Done']

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

const btnPrimary: React.CSSProperties = {
  padding: '10px 24px',
  background: 'var(--color-primary)',
  color: '#0a0f1e',
  borderRadius: 'var(--radius-md)',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  boxShadow: 'var(--glow-primary)',
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ config, onSave }) => {
  const { invoke } = useIpc()
  const [step, setStep] = useState(0)
  const [envResults, setEnvResults] = useState<EnvCheckResult[]>([])
  const [checking, setChecking] = useState(false)
  const [path, setPath] = useState(config.openClawPath)
  const [installing, setInstalling] = useState(false)
  const [installResult, setInstallResult] = useState<string | null>(null)

  const checkPrereqs = async () => {
    setChecking(true)
    const results = await invoke<EnvCheckResult[]>(IPC_CHANNELS.CHECK_ENV)
    setEnvResults(results)
    setChecking(false)
  }

  const runInstall = async () => {
    setInstalling(true)
    await onSave({ openClawPath: path })
    const result = await invoke<{ ok: boolean; error?: string }>(IPC_CHANNELS.RUN_SETUP, path)
    setInstallResult(result.ok ? 'success' : result.error || 'Unknown error')
    setInstalling(false)
    if (result.ok) setTimeout(() => setStep(4), 1000)
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div style={{ padding: 32, maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>
        Setup Wizard
      </h1>

      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          {STEPS.map((s, i) => (
            <span key={s} style={{
              fontSize: 11,
              fontWeight: i === step ? 600 : 400,
              color: i <= step ? 'var(--color-primary)' : 'var(--color-text-muted)',
            }}>
              {s}
            </span>
          ))}
        </div>
        <div style={{ height: 4, background: 'var(--color-surface)', borderRadius: 2 }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'var(--color-primary)',
            borderRadius: 2,
            transition: 'width 0.4s',
            boxShadow: 'var(--glow-primary)',
          }} />
        </div>
      </div>

      <div style={{
        background: 'var(--color-panel)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 32,
        minHeight: 240,
      }}>
        {step === 0 && (
          <div>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🦞</div>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Welcome to OpenClaw Harbor</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.6 }}>
              This wizard will help you set up your OpenClaw environment. We'll check
              your system prerequisites, configure paths, and install dependencies.
            </p>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 20, marginBottom: 16 }}>Checking Prerequisites</h2>
            <button onClick={checkPrereqs} disabled={checking} style={btnPrimary}>
              {checking ? '⏳ Checking...' : '🔍 Run Checks'}
            </button>
            {envResults.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {envResults.map((r) => (
                  <div key={r.name} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <span>{r.ok ? '✅' : '❌'}</span>
                    <span style={{ fontWeight: 600, minWidth: 80 }}>{r.name}</span>
                    {r.version && <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>v{r.version}</span>}
                    {!r.ok && <span style={{ color: 'var(--color-error)', fontSize: 12 }}>{r.message}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 20, marginBottom: 16 }}>Configure Paths</h2>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--color-text-muted)' }}>
              OpenClaw Directory Path
            </label>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/path/to/openclaw"
              style={inputStyle}
            />
            <p style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
              Enter the absolute path to your OpenClaw installation directory.
            </p>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 20, marginBottom: 16 }}>Install Dependencies</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 16 }}>
              We'll run <code style={{ color: 'var(--color-primary)' }}>npm install</code> in your OpenClaw directory.
            </p>
            {!installResult && (
              <button onClick={runInstall} disabled={installing || !path} style={btnPrimary}>
                {installing ? '⏳ Installing...' : '📦 Install Now'}
              </button>
            )}
            {installResult === 'success' && (
              <p style={{ color: 'var(--color-success)' }}>✅ Installation complete!</p>
            )}
            {installResult && installResult !== 'success' && (
              <p style={{ color: 'var(--color-error)' }}>❌ {installResult}</p>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Setup Complete!</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              OpenClaw Harbor is configured. Navigate to The Harbor to summon the emissary.
            </p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          style={{
            padding: '10px 24px',
            background: 'transparent',
            color: step === 0 ? 'var(--color-text-muted)' : 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 500,
            fontSize: 14,
            cursor: step === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          ← Back
        </button>
        {step < STEPS.length - 1 && (
          <button onClick={() => setStep((s) => s + 1)} style={btnPrimary}>
            Next →
          </button>
        )}
      </div>
    </div>
  )
}
