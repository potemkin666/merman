import React, { useState, useEffect } from 'react'
import { useIpc } from '../hooks/useIpc'
import { Tooltip } from '../components/Tooltip'
import { HelpHint } from '../components/Tooltip'
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

  // Auto-run prereq checks when entering step 1
  useEffect(() => {
    if (step === 1 && envResults.length === 0 && !checking) {
      checkPrereqs()
    }
  }, [step])

  // Auto-detect OpenClaw path when entering step 2
  useEffect(() => {
    if (step === 2 && !path) {
      invoke<string>(IPC_CHANNELS.DETECT_PATH).then((detected) => {
        if (detected) setPath(detected)
      })
    }
  }, [step])

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
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 8, fontSize: 14 }}>
        Follow these steps and you will be up and running in no time. No terminal needed!
      </p>

      {/* Progress bar */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          {STEPS.map((s, i) => (
            <Tooltip key={s} text={
              i === 0 ? 'A quick introduction to what this wizard does.' :
              i === 1 ? 'We check that your computer has the tools needed to run OpenClaw.' :
              i === 2 ? 'Tell us where OpenClaw is on your computer.' :
              i === 3 ? 'We install the packages OpenClaw needs. You just click one button.' :
              'All done! You are ready to use the app.'
            }>
              <span style={{
                fontSize: 11,
                fontWeight: i === step ? 600 : 400,
                color: i <= step ? 'var(--color-primary)' : 'var(--color-text-muted)',
                cursor: 'help',
              }}>
                {s}
              </span>
            </Tooltip>
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
        minHeight: 260,
      }}>
        {step === 0 && (
          <div>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔱</div>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Welcome to OpenClaw Harbour</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.8 }}>
              This wizard will prepare your computer for OpenClaw in just a few steps.
            </p>
            <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(0,200,212,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,200,212,0.1)' }}>
              <p style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.7, marginBottom: 8 }}>
                <strong>Here is what we will do:</strong>
              </p>
              <ol style={{ paddingLeft: 20, fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 2 }}>
                <li>Check your system has the required tools (Node.js, npm, git)</li>
                <li>Point this app at your OpenClaw installation folder</li>
                <li>Install OpenClaw&apos;s dependencies (one button click!)</li>
              </ol>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
                💡 <em>No command line or terminal knowledge required. We handle everything.</em>
              </p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 20, marginBottom: 16, display: 'flex', alignItems: 'center' }}>
              Checking Prerequisites
              <HelpHint text="Prerequisites are tools your computer needs to have installed before OpenClaw can work. Think of them like ingredients for a recipe — you need them before you can cook." />
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
              We need a few things installed on your computer. Click the button below and we will check automatically.
              If anything is missing, we will tell you exactly how to fix it.
            </p>
            <Tooltip text="Click this to scan your system. It checks for Node.js (runs JavaScript), npm (installs packages), and git (version control). Takes about 2 seconds.">
              <button onClick={checkPrereqs} disabled={checking} style={btnPrimary}>
                {checking ? '⏳ Checking...' : '🔍 Run Checks'}
              </button>
            </Tooltip>
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
                          lineHeight: 1.5,
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
                    lineHeight: 1.6,
                  }}>
                    <strong>Some checks did not pass.</strong> Install the missing tools using the instructions above,
                    then click &quot;Run Checks&quot; again. You can still continue, but the install step might fail.
                  </div>
                )}
                {allPrereqsOk && (
                  <div style={{
                    marginTop: 8,
                    padding: '10px 14px',
                    background: 'rgba(45,212,160,0.08)',
                    border: '1px solid rgba(45,212,160,0.2)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 12,
                    color: 'var(--color-success)',
                  }}>
                    🎉 Everything looks good! Click &quot;Next&quot; to continue.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 20, marginBottom: 16, display: 'flex', alignItems: 'center' }}>
              Configure Paths
              <HelpHint text="We need to know where on your computer you downloaded or cloned OpenClaw. This is just a folder path, like the address of a house." />
            </h2>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: 6, fontSize: 13, color: 'var(--color-text-muted)' }}>
              OpenClaw Directory Path
              <HelpHint text="This is the folder where OpenClaw lives. If you cloned it from GitHub, it is wherever you ran 'git clone'. It should have a file called package.json inside." />
            </label>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/path/to/openclaw"
              style={inputStyle}
            />
            <div style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(0,200,212,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,200,212,0.1)' }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--color-text)' }}>💡 How to find this path:</strong><br />
                <strong>Windows:</strong> Open File Explorer, navigate to the OpenClaw folder, click the address bar — copy that text.<br />
                <strong>macOS:</strong> Open Finder, navigate to the folder, press <code style={{ color: 'var(--color-primary)' }}>Cmd+Option+C</code> to copy the path.<br />
                <strong>Linux:</strong> Open your file manager or terminal, <code style={{ color: 'var(--color-primary)' }}>pwd</code> in the folder.
              </p>
            </div>
            {!path && (
              <p style={{ marginTop: 12, fontSize: 12, color: 'var(--color-warning)' }}>
                ⚠️ A path is required before we can install dependencies.
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 20, marginBottom: 16, display: 'flex', alignItems: 'center' }}>
              Install Dependencies
              <HelpHint text="OpenClaw needs some extra packages to work. This step downloads and installs them automatically. It is like installing an app — you just click a button and wait." />
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
              Almost there! We will install the packages OpenClaw needs. Just click the button below and wait.
              This might take a minute or two depending on your internet speed.
            </p>
            {!installResult && (
              <Tooltip text={!path ? 'Go back and set the OpenClaw path first.' : 'Click to download and install all required packages. This runs npm install inside your OpenClaw folder.'}>
                <button onClick={runInstall} disabled={installing || !path} style={{
                  ...btnPrimary,
                  opacity: installing || !path ? 0.5 : 1,
                  cursor: installing || !path ? 'not-allowed' : 'pointer',
                }}>
                  {installing ? '⏳ Installing... (this may take a minute)' : '📦 Install Now'}
                </button>
              </Tooltip>
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
                  <Tooltip text="Try the installation again. Sometimes things fail due to temporary network issues.">
                    <button onClick={() => { setInstallResult(null); runInstall() }} style={{
                      ...btnPrimary,
                      background: 'var(--color-warning)',
                      fontSize: 13,
                      padding: '8px 18px',
                    }}>
                      🔄 Retry
                    </button>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Setup Complete!</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.8 }}>
              You are all set! Here is what to do next:
            </p>
            <ol style={{ paddingLeft: 20, fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 2.2, marginTop: 12 }}>
              <li>Go to <strong style={{ color: 'var(--color-primary)' }}>The Harbour</strong> and click <strong style={{ color: 'var(--color-primary)' }}>Summon</strong> to start the service</li>
              <li>Go to <strong style={{ color: 'var(--color-primary)' }}>Dispatch</strong> and type your first task</li>
              <li>Check the <strong style={{ color: 'var(--color-primary)' }}>Fishtank</strong> to watch the emissary work!</li>
            </ol>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 12, marginTop: 16, fontStyle: 'italic' }}>
              💡 Tip: Hover over any button or &quot;?&quot; icon in the app for an explanation of what it does.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
        <Tooltip text={step === 0 ? 'You are already at the first step.' : 'Go back to the previous step.'}>
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
        </Tooltip>
        {step < STEPS.length - 1 && (
          <Tooltip text="Continue to the next step.">
            <button onClick={() => setStep((s) => s + 1)} style={btnPrimary}>
              Next →
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
