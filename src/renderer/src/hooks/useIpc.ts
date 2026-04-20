import { useEffect, useCallback, useRef } from 'react'
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

/**
 * Subscribe to an IPC channel. The callback is stored in a ref so it
 * always sees the latest props/state without needing a manual deps array
 * — this eliminates the stale-closure risk that existed previously.
 */
export function useIpcListener(
  channel: IpcChannel,
  callback: (...args: unknown[]) => void
) {
  const { on } = useIpc()
  const callbackRef = useRef(callback)

  // Keep the ref up-to-date on every render
  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    const cleanup = on(channel, (...args: unknown[]) => {
      callbackRef.current(...args)
    })
    return cleanup
  }, [channel, on])
}
