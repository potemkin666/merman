import React, { createContext, useContext, useState, useEffect } from 'react'
import { useIpc, useIpcListener } from './useIpc'
import { IPC_CHANNELS } from '../../../shared/ipc'
import type { LogEntry } from '../../../shared/types'

interface LogsContextValue {
  logs: LogEntry[]
}

const LogsContext = createContext<LogsContextValue | null>(null)

export const LogsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { invoke } = useIpc()
  const [logs, setLogs] = useState<LogEntry[]>([])

  useEffect(() => {
    invoke<LogEntry[]>(IPC_CHANNELS.GET_LOGS)
      .then(setLogs)
      .catch((e) => console.error('Logs load error:', e))
  }, [invoke])

  useIpcListener(IPC_CHANNELS.ON_LOG, (...args) => {
    const entry = args[0] as LogEntry
    setLogs((prev) => [...prev.slice(-999), entry])
  })

  return (
    <LogsContext.Provider value={{ logs }}>
      {children}
    </LogsContext.Provider>
  )
}

export function useLogs(): LogsContextValue {
  const ctx = useContext(LogsContext)
  if (!ctx) throw new Error('useLogs must be used within a LogsProvider')
  return ctx
}
