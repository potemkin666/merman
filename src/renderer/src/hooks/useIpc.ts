import { useEffect, useCallback } from 'react'
import type { IpcChannel } from '../../../shared/ipc'

declare global {
  interface Window {
    electronAPI: {
      invoke: (channel: IpcChannel, ...args: unknown[]) => Promise<unknown>
      on: (channel: IpcChannel, callback: (...args: unknown[]) => void) => () => void
      IPC_CHANNELS: Record<string, string>
    }
  }
}

/** Whether the Electron preload bridge is available. */
export function isElectronAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI
}

export function useIpc() {
  const invoke = useCallback(
    async <T = unknown>(channel: IpcChannel, ...args: unknown[]): Promise<T> => {
      if (!window.electronAPI) {
        throw new Error(
          'The system bridge is not available. Please re-launch the app from the desktop.'
        )
      }
      return window.electronAPI.invoke(channel, ...args) as Promise<T>
    },
    []
  )

  const on = useCallback(
    (channel: IpcChannel, callback: (...args: unknown[]) => void): (() => void) => {
      if (!window.electronAPI) return () => {}
      return window.electronAPI.on(channel, callback)
    },
    []
  )

  return { invoke, on, available: isElectronAvailable() }
}

export function useIpcListener(
  channel: IpcChannel,
  callback: (...args: unknown[]) => void,
  deps: unknown[] = []
) {
  const { on } = useIpc()
  useEffect(() => {
    const cleanup = on(channel, callback)
    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, ...deps])
}
