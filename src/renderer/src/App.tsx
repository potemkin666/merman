import React, { useState, useEffect } from 'react'
import { NavSidebar } from './components/NavSidebar'
import { WelcomeOverlay } from './components/WelcomeOverlay'
import { Harbor } from './screens/Harbor'
import { SetupWizard } from './screens/SetupWizard'
import { Dispatch } from './screens/Dispatch'
import { Fishtank } from './screens/Fishtank'
import { TideLog } from './screens/TideLog'
import { DeepConfig } from './screens/DeepConfig'
import { useAppState } from './hooks/useAppState'

const WELCOME_KEY = 'openclaw-harbor-welcome-seen'

export default function App() {
  const [page, setPage] = useState('harbor')
  const { config, logs, status, recentTasks, loading, updateConfig, addTask, setStatus } = useAppState()
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    if (!loading && !localStorage.getItem(WELCOME_KEY)) {
      setShowWelcome(true)
    }
  }, [loading])

  const dismissWelcome = () => {
    setShowWelcome(false)
    localStorage.setItem(WELCOME_KEY, 'true')
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: 16,
        background: 'var(--color-bg)',
      }}>
        <div style={{ fontSize: 56, animation: 'emissaryFloat 3s ease-in-out infinite' }}>🔱</div>
        <p style={{ color: 'var(--color-primary)', fontSize: 18, fontWeight: 600 }}>OpenClaw Harbour</p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Your merman emissary awaits.</p>
      </div>
    )
  }

  const renderScreen = () => {
    switch (page) {
      case 'harbor': return <Harbor config={config} status={status} recentTasks={recentTasks} onStatusChange={setStatus} onNavigate={setPage} />
      case 'setup': return <SetupWizard config={config} onSave={updateConfig} />
      case 'dispatch': return <Dispatch config={config} onTaskAdded={addTask} />
      case 'fishtank': return <Fishtank status={status} />
      case 'tidelog': return <TideLog logs={logs} />
      case 'deepconfig': return <DeepConfig config={config} onSave={updateConfig} />
      default: return <Harbor config={config} status={status} recentTasks={recentTasks} onStatusChange={setStatus} onNavigate={setPage} />
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {showWelcome && <WelcomeOverlay onDismiss={dismissWelcome} />}
      <NavSidebar active={page} onNavigate={setPage} />
      <main style={{
        flex: 1,
        overflowY: 'auto',
        background: 'var(--color-bg)',
      }}>
        {renderScreen()}
      </main>
    </div>
  )
}
