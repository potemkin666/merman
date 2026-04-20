import { useState, useEffect, useCallback } from 'react'
import { useIpc, useIpcListener } from './useIpc'
import { IPC_CHANNELS } from '../../../shared/ipc'
import type { AppConfig, LogEntry, ServiceStatus, TaskResult } from '../../../shared/types'

const defaultConfig: AppConfig = {
  openClawPath: '',
  workspacePath: '',
  model: 'gpt-4o',
  provider: 'openai',
  apiKey: '',
  presets: [{ id: '1', name: 'Default', mode: 'default', description: 'Standard agent mode' }],
}

export function useAppState() {
  const { invoke } = useIpc()
  const [config, setConfig] = useState<AppConfig>(defaultConfig)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [status, setStatus] = useState<ServiceStatus>('idle')
  const [recentTasks, setRecentTasks] = useState<TaskResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        const [cfg, logList] = await Promise.all([
          invoke<AppConfig>(IPC_CHANNELS.GET_CONFIG),
          invoke<LogEntry[]>(IPC_CHANNELS.GET_LOGS),
        ])
        setConfig(cfg)
        setLogs(logList)
        const stored = localStorage.getItem('recentTasks')
        if (stored) setRecentTasks(JSON.parse(stored))
      } catch (e) {
        console.error('Init error:', e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [invoke])

  useIpcListener(IPC_CHANNELS.ON_LOG, (...args) => {
    const entry = args[0] as LogEntry
    setLogs((prev) => [...prev.slice(-999), entry])
  })

  useIpcListener(IPC_CHANNELS.ON_STATUS_CHANGE, (...args) => {
    setStatus(args[0] as ServiceStatus)
  })

  const updateConfig = useCallback(
    async (updates: Partial<AppConfig>) => {
      const newCfg = await invoke<AppConfig>(IPC_CHANNELS.SET_CONFIG, updates)
      setConfig(newCfg)
      return newCfg
    },
    [invoke]
  )

  const addTask = useCallback((task: TaskResult) => {
    setRecentTasks((prev) => {
      const updated = [task, ...prev].slice(0, 20)
      localStorage.setItem('recentTasks', JSON.stringify(updated))
      return updated
    })
  }, [])

  return { config, logs, status, recentTasks, loading, updateConfig, addTask, setStatus }
}
