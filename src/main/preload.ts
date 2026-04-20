import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc'
import type { IpcChannel } from '../shared/ipc'

const validChannels = new Set<string>(Object.values(IPC_CHANNELS))

function assertValidChannel(channel: string): asserts channel is IpcChannel {
  if (!validChannels.has(channel)) {
    throw new Error(`Invalid IPC channel: "${channel}". Check IPC_CHANNELS for valid values.`)
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel: IpcChannel, ...args: unknown[]) => {
    assertValidChannel(channel)
    return ipcRenderer.invoke(channel, ...args)
  },
  on: (channel: IpcChannel, callback: (...args: unknown[]) => void) => {
    assertValidChannel(channel)
    const listener = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => callback(...args)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
  IPC_CHANNELS,
})
