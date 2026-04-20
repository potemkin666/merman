import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import type { ChildProcess } from 'child_process'
import { IPC_CHANNELS } from '../shared/ipc'
import { checkEnvironment } from './services/envChecker'
import { runCommand, killProcess } from './services/processRunner'
import { getConfig, setConfig } from './services/configService'
import { getLogs, addLog } from './services/logService'

let mainWindow: BrowserWindow | null = null
let serviceProcess: ChildProcess | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0a0f1e',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (serviceProcess) {
    killProcess(serviceProcess)
    serviceProcess = null
  }
})

// --- IPC Handlers ---

ipcMain.handle(IPC_CHANNELS.CHECK_ENV, async () => {
  const results = await checkEnvironment()
  addLog('info', `Environment check completed: ${results.filter(r => r.ok).length}/${results.length} OK`)
  return results
})

ipcMain.handle(IPC_CHANNELS.GET_CONFIG, () => getConfig())

ipcMain.handle(IPC_CHANNELS.SET_CONFIG, (_event, updates) => setConfig(updates))

ipcMain.handle(IPC_CHANNELS.GET_LOGS, () => getLogs())

ipcMain.handle(IPC_CHANNELS.RUN_SETUP, async (_event, openClawPath: string) => {
  try {
    addLog('info', `Running npm install in ${openClawPath}`)
    await runCommand('npm', ['install'], openClawPath, mainWindow)
    addLog('info', 'Setup completed successfully')
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    addLog('error', `Setup failed: ${msg}`)
    return {
      ok: false,
      error: msg,
      explanation: translateError(msg, 'setup'),
    }
  }
})

ipcMain.handle(IPC_CHANNELS.START_SERVICE, async (_event, openClawPath: string) => {
  try {
    if (serviceProcess) {
      return { ok: false, error: 'Service is already running.' }
    }
    addLog('info', 'Starting OpenClaw service...')
    mainWindow?.webContents.send(IPC_CHANNELS.ON_STATUS_CHANGE, 'running')
    serviceProcess = runCommand('node', ['index.js'], openClawPath, mainWindow, (proc) => {
      if (proc === serviceProcess) {
        serviceProcess = null
        addLog('info', 'Service process exited')
        mainWindow?.webContents.send(IPC_CHANNELS.ON_STATUS_CHANGE, 'stopped')
      }
    })
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    addLog('error', `Failed to start: ${msg}`)
    return { ok: false, error: msg, explanation: translateError(msg, 'start') }
  }
})

ipcMain.handle(IPC_CHANNELS.STOP_SERVICE, async () => {
  if (serviceProcess) {
    killProcess(serviceProcess)
    serviceProcess = null
    addLog('info', 'Service stopped by user')
  } else {
    addLog('info', 'Stop requested, but no active service process')
  }
  mainWindow?.webContents.send(IPC_CHANNELS.ON_STATUS_CHANGE, 'stopped')
  return { ok: true }
})

ipcMain.handle(IPC_CHANNELS.RESTART_SERVICE, async (_event, openClawPath: string) => {
  if (serviceProcess) {
    killProcess(serviceProcess)
    serviceProcess = null
    addLog('info', 'Stopping service for restart...')
  }
  addLog('info', 'Restarting OpenClaw service...')
  mainWindow?.webContents.send(IPC_CHANNELS.ON_STATUS_CHANGE, 'running')
  serviceProcess = runCommand('node', ['index.js'], openClawPath, mainWindow, (proc) => {
    if (proc === serviceProcess) {
      serviceProcess = null
      mainWindow?.webContents.send(IPC_CHANNELS.ON_STATUS_CHANGE, 'stopped')
    }
  })
  return { ok: true }
})

ipcMain.handle(IPC_CHANNELS.DISPATCH_TASK, async (_event, { prompt, mode, openClawPath }) => {
  try {
    addLog('info', `Dispatching task: ${prompt.substring(0, 60)}...`)
    mainWindow?.webContents.send(IPC_CHANNELS.ON_STATUS_CHANGE, 'running')
    const output = await runCommand(
      'node',
      ['index.js', '--prompt', JSON.stringify(prompt), '--mode', mode],
      openClawPath || process.cwd(),
      mainWindow
    )
    addLog('info', 'Task completed')
    mainWindow?.webContents.send(IPC_CHANNELS.ON_STATUS_CHANGE, 'idle')
    return { ok: true, output }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    addLog('error', `Task failed: ${msg}`)
    mainWindow?.webContents.send(IPC_CHANNELS.ON_STATUS_CHANGE, 'error')
    return { ok: false, error: msg, explanation: translateError(msg, 'dispatch') }
  }
})

// --- Error Translation ---

interface ErrorExplanation {
  what: string
  cause: string
  action: string
  retryable: boolean
}

function translateError(message: string, context: 'setup' | 'start' | 'dispatch'): ErrorExplanation {
  const lower = message.toLowerCase()

  if (lower.includes('enoent') || lower.includes('not found') || lower.includes('no such file')) {
    return {
      what: 'A required file or directory was not found.',
      cause: 'The configured path may be incorrect, or dependencies are missing.',
      action: 'Check your OpenClaw path in Deep Config, then re-run Setup.',
      retryable: true,
    }
  }
  if (lower.includes('eacces') || lower.includes('permission denied')) {
    return {
      what: 'Permission was denied when accessing a file or directory.',
      cause: 'The app does not have the right permissions for that folder.',
      action: 'Check folder permissions, or try choosing a different directory.',
      retryable: true,
    }
  }
  if (lower.includes('eaddrinuse') || lower.includes('address already in use')) {
    return {
      what: 'The port is already in use.',
      cause: 'Another service (or a previous instance) is using the same port.',
      action: 'Stop the other process or change the port in your OpenClaw config.',
      retryable: true,
    }
  }
  if (lower.includes('npm err') || lower.includes('npm warn') || lower.includes('exit code 1')) {
    return {
      what: context === 'setup' ? 'Dependency installation failed.' : 'The process exited with an error.',
      cause: 'A package may have failed to install, or a script error occurred.',
      action: 'Check the Tide Log for details. You can also try running the command manually in a terminal.',
      retryable: true,
    }
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return {
      what: 'The operation timed out.',
      cause: 'A network request or process took too long to respond.',
      action: 'Check your internet connection and try again.',
      retryable: true,
    }
  }
  return {
    what: 'An unexpected error occurred.',
    cause: message,
    action: 'Review the Tide Log for more details. If the problem persists, check the OpenClaw documentation.',
    retryable: true,
  }
}
