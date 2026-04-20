import React, { useState } from 'react'
import { NavSidebar } from './components/NavSidebar'
import { Harbor } from './screens/Harbor'
import { SetupWizard } from './screens/SetupWizard'
import { Dispatch } from './screens/Dispatch'
import { TideLog } from './screens/TideLog'
import { DeepConfig } from './screens/DeepConfig'
import { useAppState } from './hooks/useAppState'

export default function App() {
  const [page, setPage] = useState('harbor')
  const { config, logs, status, recentTasks, loading, updateConfig, addTask, setStatus } = useAppState()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: 16,
      }}>
        <div style={{ fontSize: 48 }}>🦞</div>
        <p style={{ color: 'var(--color-text-muted)' }}>Summoning the harbor...</p>
      </div>
    )
  }

  const renderScreen = () => {
    switch (page) {
      case 'harbor': return <Harbor config={config} status={status} recentTasks={recentTasks} onStatusChange={setStatus} />
      case 'setup': return <SetupWizard config={config} onSave={updateConfig} />
      case 'dispatch': return <Dispatch config={config} onTaskAdded={addTask} />
      case 'tidelog': return <TideLog logs={logs} />
      case 'deepconfig': return <DeepConfig config={config} onSave={updateConfig} />
      default: return <Harbor config={config} status={status} recentTasks={recentTasks} onStatusChange={setStatus} />
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
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
