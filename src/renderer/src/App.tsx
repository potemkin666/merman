import React, { useState, useEffect, useCallback } from 'react'
import { NavSidebar } from './components/NavSidebar'
import { WelcomeOverlay } from './components/WelcomeOverlay'
import { ElectronUnavailable } from './components/ElectronUnavailable'
import { Harbor } from './screens/Harbor'
import { SetupWizard } from './screens/SetupWizard'
import { Dispatch } from './screens/Dispatch'
import { Fishtank } from './screens/Fishtank'
import { DeepDive } from './screens/DeepDive'
import { TideLog } from './screens/TideLog'
import { DeepConfig } from './screens/DeepConfig'
import { ConfigProvider, useConfig } from './hooks/useConfig'
import { LogsProvider, useLogs } from './hooks/useLogs'
import { ServiceProvider, useService } from './hooks/useService'
import { TasksProvider, useTasks } from './hooks/useTasks'
import { isElectronAvailable, useIpc } from './hooks/useIpc'
import { IPC_CHANNELS } from '../../shared/ipc'

function AppContent() {
  const [page, setPage] = useState('harbor')
  const { config, loading, updateConfig } = useConfig()
  const { logs } = useLogs()
  const { status, setStatus } = useService()
  const { recentTasks, addTask } = useTasks()
  const { invoke } = useIpc()
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    if (!loading) {
      invoke<boolean>(IPC_CHANNELS.GET_WELCOME_SEEN).then((seen) => {
        if (!seen) setShowWelcome(true)
      }).catch(() => {
        // Fallback: if IPC fails, don't show welcome
      })
    }
  }, [loading, invoke])

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false)
    invoke(IPC_CHANNELS.SET_WELCOME_SEEN).catch(() => {
      // Best-effort persist
    })
  }, [invoke])

  const handleFishtankWorkspaceDrop = useCallback((path: string) => {
    updateConfig({ workspacePath: path })
  }, [updateConfig])

  if (loading) {
    return (
      <div
        role="status"
        aria-label="Loading OpenClaw Harbour"
        style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: 16,
        background: 'var(--color-bg)',
      }}>
        <div style={{ fontSize: 56, animation: 'emissaryFloat 3s ease-in-out infinite' }} aria-hidden="true">🔱</div>
        <p style={{ color: 'var(--color-primary)', fontSize: 18, fontWeight: 600 }}>OpenClaw Harbour</p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Your emissary awaits.</p>
      </div>
    )
  }

  const renderScreen = () => {
    switch (page) {
      case 'harbor': return <Harbor config={config} status={status} recentTasks={recentTasks} onStatusChange={setStatus} onNavigate={setPage} />
      case 'setup': return <SetupWizard config={config} onSave={updateConfig} />
      case 'dispatch': return <Dispatch config={config} onTaskAdded={addTask} />
      case 'fishtank': return <Fishtank status={status} recentTasks={recentTasks} onWorkspacePathSet={handleFishtankWorkspaceDrop} />
      case 'deepdive': return <DeepDive config={config} />
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

export default function App() {
  const electronAvailable = isElectronAvailable()

  // If the Electron bridge is not available, show a helpful error screen
  if (!electronAvailable) {
    return <ElectronUnavailable />
  }

  return (
    <ConfigProvider>
      <LogsProvider>
        <ServiceProvider>
          <TasksProvider>
            <AppContent />
          </TasksProvider>
        </ServiceProvider>
      </LogsProvider>
    </ConfigProvider>
  )
}
