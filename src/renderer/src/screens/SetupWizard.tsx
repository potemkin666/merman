import React, { useState } from 'react'
import { useIpc } from '../hooks/useIpc'
import { IPC_CHANNELS } from '../../../shared/ipc'
import type { EnvCheckResult, AppConfig, CommandResult } from '../../../shared/types'

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
  const [installResult, setInstallResult] = useState<CommandResult | null>(null)

  const checkPrereqs = async () => {
    setChecking(true)
    const results = await invoke<EnvCheckResult[]>(IPC_CHANNELS.CHECK_ENV)
    setEnvResults(results)
    setChecking(false)
  }

  const allPrereqsOk = envResults.length > 0 && envResults.every((r) => r.ok)

  const runInstall = async () => {
    setInstalling(true)
    setInstallResult(null)
    await onSave({ openClawPath: path })
    const result = await invoke<CommandResult>(IPC_CHANNELS.RUN_SETUP, path)
    setInstallResult(result)
    setInstalling(false)
    if (result.ok) setTimeout(() => setStep(4), 1000)
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div style={{ padding: 32, maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>
        Setup Wizard
      </h1>

      {/* Progress bar */}
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

      {/* Step Content */}
      <div style={{
        background: 'var(--color-panel)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 32,
        minHeight: 240,
      }}>
        {step === 0 && (
          <div>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔱</div>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Welcome to OpenClaw Harbor</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.6 }}>
              This wizard will prepare your environment for OpenClaw. We will check your
              system prerequisites, configure your local paths, and install dependencies
              — no terminal needed.
            </p>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 20, marginBottom: 16 }}>Checking Prerequisites</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
              We need Node.js, npm, and git installed on your system. We will also verify your
              OpenClaw folder if one is already configured.
            </p>
            <button onClick={checkPrereqs} disabled={checking} style={btnPrimary}>
              {checking ? '⏳ Checking...' : '🔍 Run Checks'}
            </button>
            {envResults.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {envResults.map((r) => (
                  <div key={r.name} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '10px 12px',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: r.ok ? '1px solid transparent' : '1px solid rgba(232,93,93,0.2)',
                  }}>
                    <span style={{ flexShrink: 0 }}>{r.ok ? '✅' : '❌'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</span>
                        {r.version && <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>v{r.version}</span>}
                      </div>
                      {r.message && (
                        <p style={{
                          color: r.ok ? 'var(--color-text-muted)' : 'var(--color-error)',
                          fontSize: 12,
                          marginTop: 4,
                          lineHeight: 1.4,
                        }}>
                          {r.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {!allPrereqsOk && (
                  <div style={{
                    marginTop: 8,
                    padding: '10px 14px',
                    background: 'rgba(240,165,0,0.08)',
                    border: '1px solid rgba(240,165,0,0.2)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 12,
                    color: 'var(--color-warning)',
                    lineHeight: 1.5,
                  }}>
                    <strong>Some checks did not pass.</strong> Resolve the issues above, then click
                    "Run Checks" again. You can continue to the next step, but setup may fail.
                  </div>
                )}
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
            <p style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              Enter the absolute path to your local OpenClaw installation folder. This is the
              directory that contains a <code style={{ color: 'var(--color-primary)' }}>package.json</code>.
            </p>
            {!path && (
              <p style={{ marginTop: 12, fontSize: 12, color: 'var(--color-warning)' }}>
                A path is required before we can install dependencies.
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 20, marginBottom: 16 }}>Install Dependencies</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>
              We will run <code style={{ color: 'var(--color-primary)' }}>npm install</code> inside
              your OpenClaw directory to install required packages.
            </p>
            {!installResult && (
              <button onClick={runInstall} disabled={installing || !path} style={{
                ...btnPrimary,
                opacity: installing || !path ? 0.5 : 1,
                cursor: installing || !path ? 'not-allowed' : 'pointer',
              }}>
                {installing ? '⏳ Installing...' : '📦 Install Now'}
              </button>
            )}
            {installResult?.ok && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(45,212,160,0.08)',
                border: '1px solid rgba(45,212,160,0.2)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-success)',
                fontSize: 14,
              }}>
                ✅ Installation complete! Moving to the final step...
              </div>
            )}
            {installResult && !installResult.ok && (
              <div style={{
                padding: '16px',
                background: 'rgba(232,93,93,0.06)',
                border: '1px solid rgba(232,93,93,0.2)',
                borderRadius: 'var(--radius-md)',
              }}>
                <p style={{ color: 'var(--color-error)', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                  ❌ Installation failed
                </p>
                {installResult.explanation ? (
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                    <p style={{ color: 'var(--color-text)', marginBottom: 4 }}>
                      <strong>What happened:</strong> {installResult.explanation.what}
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: 4 }}>
                      <strong>Likely cause:</strong> {installResult.explanation.cause}
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: 12 }}>
                      <strong>What to do:</strong> {installResult.explanation.action}
                    </p>
                  </div>
                ) : (
                  <p style={{ color: 'var(--color-error)', fontSize: 13 }}>{installResult.error}</p>
                )}
                {installResult.explanation?.retryable !== false && (
                  <button onClick={() => { setInstallResult(null); runInstall() }} style={{
                    ...btnPrimary,
                    background: 'var(--color-warning)',
                    fontSize: 13,
                    padding: '8px 18px',
                  }}>
                    🔄 Retry
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Setup Complete</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.6 }}>
              OpenClaw Harbor is configured and ready. Navigate to <strong>The Harbor</strong> to
              summon the emissary, or head to <strong>Dispatch</strong> to send your first task.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
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
