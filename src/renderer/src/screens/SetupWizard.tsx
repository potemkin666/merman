import React, { useState, useEffect, useRef } from 'react'
import { useIpc, useIpcListener } from '../hooks/useIpc'
import { Tooltip } from '../components/Tooltip'
import { HelpHint } from '../components/Tooltip'
import { IPC_CHANNELS } from '../../../shared/ipc'
import type { EnvCheckResult, AppConfig, CommandResult, LogEntry } from '../../../shared/types'

interface SetupWizardProps {
  config: AppConfig
  onSave: (updates: Partial<AppConfig>) => Promise<AppConfig>
}

const STEPS = ['Welcome', 'Prerequisites', 'Configuration', 'Install', 'Done']

export const SetupWizard: React.FC<SetupWizardProps> = ({ config, onSave }) => {
  const { invoke } = useIpc()
  const [step, setStep] = useState(0)
  const [envResults, setEnvResults] = useState<EnvCheckResult[]>([])
  const [checking, setChecking] = useState(false)
  const [path, setPath] = useState(config.openClawPath)
  const [installing, setInstalling] = useState(false)
  const [installResult, setInstallResult] = useState<CommandResult | null>(null)
  const [installLogs, setInstallLogs] = useState<string[]>([])
  const [elapsed, setElapsed] = useState(0)
  const logBottomRef = useRef<HTMLDivElement>(null)
  const [pathError, setPathError] = useState<string | null>(null)
  const [validatingPath, setValidatingPath] = useState(false)
  const [pathValid, setPathValid] = useState(false)

  const MAX_INSTALL_LOG_LINES = 200

  // Stream ON_LOG events into the install mini-log while installing
  useIpcListener(IPC_CHANNELS.ON_LOG, (...args: unknown[]) => {
    if (!installing) return
    const entry = args[0] as LogEntry
    if (entry?.message) {
      setInstallLogs((prev) => [...prev.slice(-MAX_INSTALL_LOG_LINES), entry.message.trim()])
    }
  }, [installing])

  // Elapsed time counter during install
  useEffect(() => {
    if (!installing) return
    setElapsed(0)
    const t = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [installing])

  // Auto-scroll install log to bottom
  useEffect(() => {
    logBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [installLogs])

  const checkPrereqs = async () => {
    setChecking(true)
    const results = await invoke<EnvCheckResult[]>(IPC_CHANNELS.CHECK_ENV)
    setEnvResults(results)
    setChecking(false)
  }

  const allPrereqsOk = envResults.length > 0 && envResults.every((r) => r.ok)

  // Auto-run prereq checks when entering step 1
  const prereqsTriggered = React.useRef(false)
  useEffect(() => {
    if (step === 1 && !prereqsTriggered.current && envResults.length === 0 && !checking) {
      prereqsTriggered.current = true
      checkPrereqs()
    }
  }, [step, envResults.length, checking])

  // Auto-detect OpenClaw path when entering step 2
  const detectTriggered = React.useRef(false)
  useEffect(() => {
    if (step === 2 && !detectTriggered.current && !path) {
      detectTriggered.current = true
      invoke<string>(IPC_CHANNELS.DETECT_PATH).then((detected) => {
        if (detected) setPath(detected)
      })
    }
  }, [step, path, invoke])

  // Reset path validation when path changes
  useEffect(() => {
    setPathError(null)
    setPathValid(false)
  }, [path])

  // Validate path before allowing progression from step 2
  const validatePathInline = async (): Promise<boolean> => {
    if (!path || !path.trim()) {
      setPathError('A path is required before we can continue.')
      return false
    }
    setValidatingPath(true)
    setPathError(null)
    try {
      const result = await invoke<{ ok: boolean; error?: string }>(IPC_CHANNELS.VALIDATE_PATH, path)
      if (result.ok) {
        setPathValid(true)
        setPathError(null)
        return true
      } else {
        setPathError(result.error || 'The path is invalid.')
        setPathValid(false)
        return false
      }
    } catch {
      setPathError('Could not validate the path. Please check it and try again.')
      setPathValid(false)
      return false
    } finally {
      setValidatingPath(false)
    }
  }

  const handleNext = async () => {
    // On step 2 (Configuration), validate path before advancing
    if (step === 2) {
      const valid = await validatePathInline()
      if (!valid) return
    }
    setStep((s) => s + 1)
  }

  const runInstall = async () => {
    setInstalling(true)
    setInstallResult(null)
    setInstallLogs([])
    await onSave({ openClawPath: path })
    const result = await invoke<CommandResult>(IPC_CHANNELS.RUN_SETUP, path)
    setInstallResult(result)
    setInstalling(false)
    if (result.ok) setTimeout(() => setStep(4), 1000)
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="setup-wizard">
      <h1 className="screen-title">
        Setup Wizard
      </h1>
      <p className="screen-subtitle" style={{ marginBottom: 8 }}>
        Follow these steps and you will be up and running in no time. No terminal needed!
      </p>

      {/* Progress bar */}
      <div className="setup-wizard__progress">
        <div className="setup-wizard__steps">
          {STEPS.map((s, i) => (
            <Tooltip key={s} text={
              i === 0 ? 'A quick introduction to what this wizard does.' :
              i === 1 ? 'We check that your computer has the tools needed to run OpenClaw.' :
              i === 2 ? 'Tell us where OpenClaw is on your computer.' :
              i === 3 ? 'We install the packages OpenClaw needs. You just click one button.' :
              'All done! You are ready to use the app.'
            }>
              <span className="setup-wizard__step-label" style={{
                fontWeight: i === step ? 600 : 400,
                color: i <= step ? 'var(--color-primary)' : 'var(--color-text-muted)',
              }}>
                {s}
              </span>
            </Tooltip>
          ))}
        </div>
        <div className="setup-wizard__bar"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={0}
          aria-valuemax={STEPS.length - 1}
          aria-label={`Setup progress: step ${step + 1} of ${STEPS.length}`}
        >
          <div className="setup-wizard__bar-fill" style={{
            width: `${progress}%`,
          }} />
        </div>
      </div>

      {/* Step Content */}
      <div className="setup-wizard__content">
        {step === 0 && (
          <div>
            <div className="setup-wizard__big-icon">🔱</div>
            <h2 className="setup-wizard__step-heading--no-flex">Welcome to OpenClaw Harbour</h2>
            <p className="setup-wizard__body-text">
              This wizard will prepare your computer for OpenClaw in just a few steps.
            </p>
            <div className="setup-wizard__info-box">
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
            <h2 className="setup-wizard__step-heading">
              Checking Prerequisites
              <HelpHint text="Prerequisites are tools your computer needs to have installed before OpenClaw can work. Think of them like ingredients for a recipe — you need them before you can cook." />
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
              We need a few things installed on your computer. Click the button below and we will check automatically.
              If anything is missing, we will tell you exactly how to fix it.
            </p>
            <Tooltip text="Click this to scan your system. It checks for Node.js (runs JavaScript), npm (installs packages), and git (version control). Takes about 2 seconds.">
              <button onClick={checkPrereqs} disabled={checking} aria-label={checking ? 'Checking prerequisites' : 'Run prerequisite checks'} className="btn btn--primary">
                {checking ? '⏳ Checking...' : '🔍 Run Checks'}
              </button>
            </Tooltip>
            {envResults.length > 0 && (
              <div className="setup-wizard__env-results">
                {envResults.map((r) => (
                  <div key={r.name} className="setup-wizard__env-result" style={{
                    border: r.ok ? '1px solid transparent' : '1px solid rgba(232,93,93,0.2)',
                  }}>
                    <span className="setup-wizard__env-result-icon">{r.ok ? '✅' : '❌'}</span>
                    <div className="setup-wizard__env-result-body">
                      <div className="setup-wizard__env-result-header">
                        <span className="setup-wizard__env-result-name">{r.name}</span>
                        {r.version && <span className="setup-wizard__env-result-version">v{r.version}</span>}
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
                  <div className="setup-wizard__status-banner--warning">
                    <strong>Some checks did not pass.</strong> Install the missing tools using the instructions above,
                    then click &quot;Run Checks&quot; again. You can still continue, but the install step might fail.
                  </div>
                )}
                {allPrereqsOk && (
                  <div className="setup-wizard__status-banner--success">
                    🎉 Everything looks good! Click &quot;Next&quot; to continue.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="setup-wizard__step-heading">
              Configure Paths
              <HelpHint text="We need to know where on your computer you downloaded or cloned OpenClaw. This is just a folder path, like the address of a house." />
            </h2>
            <label className="label">
              OpenClaw Directory Path
              <HelpHint text="This is the folder where OpenClaw lives. If you cloned it from GitHub, it is wherever you ran 'git clone'. It should have a file called package.json inside." />
            </label>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/path/to/openclaw"
              aria-label="OpenClaw directory path"
              className="input"
            />
            <div className="setup-wizard__browse-actions">
              <Tooltip text="Open a folder picker to select the OpenClaw directory. Easier than typing!">
                <button
                  onClick={async () => {
                    const selected = await invoke<string>(IPC_CHANNELS.BROWSE_FOLDER)
                    if (selected) setPath(selected)
                  }}
                  aria-label="Browse for OpenClaw directory"
                  className="deep-config__btn-sm"
                >
                  📁 Browse…
                </button>
              </Tooltip>
            </div>
            <div className="setup-wizard__info-box" style={{ marginTop: 12 }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--color-text)' }}>💡 How to find this path:</strong><br />
                <strong>Windows:</strong> Open File Explorer, navigate to the OpenClaw folder, click the address bar — copy that text.<br />
                <strong>macOS:</strong> Open Finder, navigate to the folder, press <code style={{ color: 'var(--color-primary)' }}>Cmd+Option+C</code> to copy the path.<br />
                <strong>Linux:</strong> Open your file manager or terminal, <code style={{ color: 'var(--color-primary)' }}>pwd</code> in the folder.
              </p>
            </div>
            {!path && (
              <p style={{ marginTop: 12, fontSize: 12, color: 'var(--color-warning)' }}>
                ⚠️ A path is required before we can continue.
              </p>
            )}
            {pathError && (
              <div className="setup-wizard__status-banner--error">
                ❌ {pathError}
              </div>
            )}
            {pathValid && !pathError && (
              <div className="setup-wizard__status-banner--success" style={{ marginTop: 12 }}>
                ✅ Path looks good!
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="setup-wizard__step-heading">
              Install Dependencies
              <HelpHint text="OpenClaw needs some extra packages to work. This step downloads and installs them automatically. It is like installing an app — you just click a button and wait." />
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
              Almost there! We will install the packages OpenClaw needs. Just click the button below and wait.
              This might take a minute or two depending on your internet speed.
            </p>
            {!installResult && !installing && (
              <Tooltip text={!path ? 'Go back and set the OpenClaw path first.' : 'Click to download and install all required packages. This runs npm install inside your OpenClaw folder.'}>
                <button onClick={runInstall} disabled={installing || !path} aria-label={installing ? 'Installing dependencies' : 'Install dependencies now'} className="btn btn--primary" style={{
                  opacity: installing || !path ? 0.5 : 1,
                  cursor: installing || !path ? 'not-allowed' : 'pointer',
                }}>
                  📦 Install Now
                </button>
              </Tooltip>
            )}

            {/* Live install progress */}
            {installing && (
              <div style={{ marginTop: 12 }}>
                <div className="setup-wizard__install-progress">
                  <span style={{ fontSize: 18, animation: 'pulse 1.5s infinite' }}>⏳</span>
                  <span style={{ fontSize: 14, color: 'var(--color-primary)', fontWeight: 600 }}>
                    Installing... ({Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} elapsed)
                  </span>
                </div>
                <div
                  role="log"
                  aria-label="Install output"
                  aria-live="polite"
                  className="setup-wizard__install-log"
                >
                  {installLogs.length === 0 ? (
                    <span style={{ opacity: 0.5 }}>Waiting for output...</span>
                  ) : (
                    installLogs.map((line, i) => (
                      <div key={i} style={{ wordBreak: 'break-all' }}>{line}</div>
                    ))
                  )}
                  <div ref={logBottomRef} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8, opacity: 0.7 }}>
                  💡 This output is the same as what you would see in a terminal. It is normal to see warnings.
                </p>
              </div>
            )}

            {installResult?.ok && (
              <div className="setup-wizard__install-result--ok">
                ✅ Installation complete! Moving to the final step...
              </div>
            )}
            {installResult && !installResult.ok && (
              <div className="setup-wizard__install-result--fail">
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
                    <button onClick={() => { setInstallResult(null); runInstall() }} aria-label="Retry installation" className="btn btn--warning" style={{
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
            <div className="setup-wizard__big-icon">🎉</div>
            <h2 className="setup-wizard__step-heading--no-flex">Setup Complete!</h2>
            <p className="setup-wizard__body-text">
              You are all set! Here is what to do next:
            </p>
            <ol style={{ paddingLeft: 20, fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 2.2, marginTop: 12 }}>
              <li>Go to <strong style={{ color: 'var(--color-primary)' }}>The Harbour</strong> and click <strong style={{ color: 'var(--color-primary)' }}>Summon</strong> to start the service</li>
              <li>Go to <strong style={{ color: 'var(--color-primary)' }}>Dispatch</strong> and type your first task</li>
              <li>Check the <strong style={{ color: 'var(--color-primary)' }}>Fishtank</strong> to watch {config.emissaryName || 'Azurel'} work!</li>
            </ol>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 12, marginTop: 16, fontStyle: 'italic' }}>
              💡 Tip: Hover over any button or &quot;?&quot; icon in the app for an explanation of what it does.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="setup-wizard__nav">
        <Tooltip text={step === 0 ? 'You are already at the first step.' : 'Go back to the previous step.'}>
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            aria-label="Go to previous step"
            className="setup-wizard__back-btn"
            style={{
              color: step === 0 ? 'var(--color-text-muted)' : 'var(--color-text)',
              cursor: step === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            ← Back
          </button>
        </Tooltip>
        {step < STEPS.length - 1 && (
          <Tooltip text={step === 2 && !path?.trim() ? 'Enter a valid path first.' : 'Continue to the next step.'}>
            <button
              onClick={handleNext}
              disabled={validatingPath}
              aria-label={validatingPath ? 'Validating path' : 'Go to next step'}
              className="btn btn--primary"
            >
              {validatingPath ? '⏳ Checking...' : 'Next →'}
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
