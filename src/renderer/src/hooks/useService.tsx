import React, { createContext, useContext, useState, useCallback } from 'react'
import { useIpcListener } from './useIpc'
import { IPC_CHANNELS } from '../../../shared/ipc'
import type { ServiceStatus } from '../../../shared/types'

interface ServiceContextValue {
  status: ServiceStatus
  setStatus: (s: ServiceStatus) => void
}

const ServiceContext = createContext<ServiceContextValue | null>(null)

export const ServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatusRaw] = useState<ServiceStatus>('idle')

  useIpcListener(IPC_CHANNELS.ON_STATUS_CHANGE, (...args) => {
    setStatusRaw(args[0] as ServiceStatus)
  })

  const setStatus = useCallback((s: ServiceStatus) => setStatusRaw(s), [])

  return (
    <ServiceContext.Provider value={{ status, setStatus }}>
      {children}
    </ServiceContext.Provider>
  )
}

export function useService(): ServiceContextValue {
  const ctx = useContext(ServiceContext)
  if (!ctx) throw new Error('useService must be used within a ServiceProvider')
  return ctx
}
