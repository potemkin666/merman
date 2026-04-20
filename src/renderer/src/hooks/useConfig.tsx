import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useIpc } from './useIpc'
import { IPC_CHANNELS } from '../../../shared/ipc'
import { defaultConfig } from '../../../shared/defaults'
import type { AppConfig } from '../../../shared/types'

interface ConfigContextValue {
  config: AppConfig
  loading: boolean
  updateConfig: (updates: Partial<AppConfig>) => Promise<AppConfig>
}

const ConfigContext = createContext<ConfigContextValue | null>(null)

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { invoke } = useIpc()
  const [config, setConfig] = useState<AppConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    invoke<AppConfig>(IPC_CHANNELS.GET_CONFIG)
      .then(setConfig)
      .catch((e) => console.error('Config load error:', e))
      .finally(() => setLoading(false))
  }, [invoke])

  const updateConfig = useCallback(
    async (updates: Partial<AppConfig>) => {
      const newCfg = await invoke<AppConfig>(IPC_CHANNELS.SET_CONFIG, updates)
      setConfig(newCfg)
      return newCfg
    },
    [invoke]
  )

  return (
    <ConfigContext.Provider value={{ config, loading, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig(): ConfigContextValue {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error('useConfig must be used within a ConfigProvider')
  return ctx
}
