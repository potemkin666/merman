import { app, BrowserWindow, ipcMain, shell, dialog, Notification } from 'electron'
import { join } from 'path'
import { statSync } from 'fs'
import { IPC_CHANNELS } from '../shared/ipc'
import { checkEnvironment, detectOpenClawPath } from './services/envChecker'
import { runCommand, killProcess, validatePath } from './services/processRunner'
import type { RunResult } from './services/processRunner'
import { spawnTerminal, writeTerminal, resizeTerminal, killTerminal } from './services/terminalService'
import { getConfig, setConfig } from './services/configService'
import { getApiKey, setApiKey, isSecureStorageAvailable } from './services/keychainService'
import { getLogs, addLog, initLogStore, exportLogs, flushLogs } from './services/logService'
import { getTasks, addTask as addTaskToStore, initTaskStore, flushTasks } from './services/taskService'
import { translateError } from './services/translateError'
import { initHabitStore, recordDispatch, getSuggestion } from './services/habitService'

let mainWindow: BrowserWindow | null = null
let serviceRun: RunResult | null = null
let dispatchRun: RunResult | null = null
let heartbeatTimer: ReturnType<typeof setInterval> | null = null

/**
 * Show a desktop notification if the app window is not focused.
 * Useful for long-running tasks — the user may have tabbed away.
 */
function notifyIfUnfocused(title: string, body: string): void {
  if (mainWindow?.isFocused()) return
  if (!Notification.isSupported()) return
  const notification = new Notification({ title, body })
  notification.on('click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
  notification.show()
}

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
  const userData = app.getPath('userData')
  initLogStore(userData)
  initTaskStore(userData)
  initHabitStore(userData)
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  stopHeartbeat()
  flushLogs()
  flushTasks()
  if (serviceRun) {
    killProcess(serviceRun.process)
    serviceRun = null
  }
  if (dispatchRun) {
    killProcess(dispatchRun.process)
    dispatchRun = null
  }
  killTerminal()
})

// --- IPC Handlers ---

ipcMain.handle(IPC_CHANNELS.CHECK_ENV, async () => {
  const results = await checkEnvironment()
  addLog('info', `Environment check completed: ${results.filter(r => r.ok).length}/${results.length} OK`)
  return results
})

ipcMain.handle(IPC_CHANNELS.DETECT_PATH, () => {
  return detectOpenClawPath()
})

ipcMain.handle(IPC_CHANNELS.BROWSE_FOLDER, async () => {
  if (!mainWindow) return ''
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Folder',
  })
  if (result.canceled || result.filePaths.length === 0) return ''
  return result.filePaths[0]
})

ipcMain.handle(IPC_CHANNELS.GET_CONFIG, () => getConfig())

ipcMain.handle(IPC_CHANNELS.SET_CONFIG, (_event, updates) => setConfig(updates))

ipcMain.handle(IPC_CHANNELS.GET_API_KEY, () => getApiKey())

ipcMain.handle(IPC_CHANNELS.SET_API_KEY, (_event, key: string) => {
  return setApiKey(key)
})

ipcMain.handle(IPC_CHANNELS.CHECK_SECURE_STORAGE, () => {
  return isSecureStorageAvailable()
})

ipcMain.handle(IPC_CHANNELS.GET_WELCOME_SEEN, async () => {
  const cfg = await getConfig()
  return cfg.welcomeSeen === true
})

ipcMain.handle(IPC_CHANNELS.SET_WELCOME_SEEN, async () => {
  await setConfig({ welcomeSeen: true })
  return { ok: true }
})

ipcMain.handle(IPC_CHANNELS.GET_LOGS, () => getLogs())

ipcMain.handle(IPC_CHANNELS.EXPORT_LOGS, async () => {
  if (!mainWindow) return { ok: false, error: 'No window available.' }
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Tide Log',
    defaultPath: `tide-log-${new Date().toISOString().slice(0, 10)}.txt`, // YYYY-MM-DD
    filters: [{ name: 'Text Files', extensions: ['txt'] }],
  })
  if (result.canceled || !result.filePath) return { ok: false, error: 'Export cancelled.' }
  try {
    const { writeFile } = await import('fs/promises')
    await writeFile(result.filePath, exportLogs(), 'utf8')
    addLog('info', `Logs exported to ${result.filePath}`)
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, error: msg }
  }
})

ipcMain.handle(IPC_CHANNELS.VALIDATE_PATH, (_event, path: string) => {
  return validatePath(path)
})

ipcMain.handle(IPC_CHANNELS.RUN_SETUP, async (_event, openClawPath: string) => {
  const pathCheck = validatePath(openClawPath)
  if (!pathCheck.ok) {
    addLog('error', `Setup path rejected: ${pathCheck.error}`)
    return { ok: false, error: pathCheck.error, explanation: { what: 'The path is invalid.', cause: pathCheck.error || 'Unknown', action: 'Fix the OpenClaw path in Deep Config or Setup Wizard.', retryable: true } }
  }
  try {
    addLog('info', `Running npm install in ${openClawPath}`)
    await runCommand('npm', ['install'], openClawPath, mainWindow).completed
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
  const pathCheck = validatePath(openClawPath)
  if (!pathCheck.ok) {
    addLog('error', `Start path rejected: ${pathCheck.error}`)
    return { ok: false, error: pathCheck.error }
  }
  try {
    if (serviceRun) {
      return { ok: false, error: 'Service is already running.' }
    }
    addLog('info', 'Starting OpenClaw service...')
    mainWindow?.webContents.send(IPC_CHANNELS.ON_STATUS_CHANGE, 'running')
    serviceRun = runCommand('node', ['index.js'], openClawPath, mainWindow, (proc) => {
      if (serviceRun && proc === serviceRun.process) {
        serviceRun = null
        addLog('info', 'Service process exited')
        mainWindow?.webContents.send(IPC_CHANNELS.ON_STATUS_CHANGE, 'stopped')
        stopHeartbeat()
      }
    })
    startHeartbeat()
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    addLog('error', `Failed to start: ${msg}`)
    return { ok: false, error: msg, explanation: translateError(msg, 'start') }
  }
})

ipcMain.handle(IPC_CHANNELS.STOP_SERVICE, async () => {
  stopHeartbeat()
  if (serviceRun) {
    killProcess(serviceRun.process)
    serviceRun = null
    addLog('info', 'Service stopped by user')
  } else {
    addLog('info', 'Stop requested, but no active service process')
  }
  mainWindow?.webContents.send(IPC_CHANNELS.ON_STATUS_CHANGE, 'stopped')
  return { ok: true }
})

ipcMain.handle(IPC_CHANNELS.RESTART_SERVICE, async (_event, openClawPath: string) => {
  const pathCheck = validatePath(openClawPath)
  if (!pathCheck.ok) {
    addLog('error', `Restart path rejected: ${pathCheck.error}`)
    return { ok: false, error: pathCheck.error }
  }
  stopHeartbeat()
  if (serviceRun) {
    killProcess(serviceRun.process)
    serviceRun = null
    addLog('info', 'Stopping service for restart...')
  }
  addLog('info', 'Restarting OpenClaw service...')
  mainWindow?.webContents.send(IPC_CHANNELS.ON_STATUS_CHANGE, 'running')
  serviceRun = runCommand('node', ['index.js'], openClawPath, mainWindow, (proc) => {
    if (serviceRun && proc === serviceRun.process) {
      serviceRun = null
      mainWindow?.webContents.send(IPC_CHANNELS.ON_STATUS_CHANGE, 'stopped')
      stopHeartbeat()
    }
  })
  startHeartbeat()
  return { ok: true }
})

ipcMain.handle(IPC_CHANNELS.DISPATCH_TASK, async (_event, { prompt, mode, openClawPath }) => {
  const resolvedPath = openClawPath || process.cwd()
  const pathCheck = validatePath(resolvedPath)
  if (!pathCheck.ok) {
    addLog('error', `Dispatch path rejected: ${pathCheck.error}`)
    return { ok: false, error: pathCheck.error, explanation: { what: 'The path is invalid.', cause: pathCheck.error || 'Unknown', action: 'Fix the OpenClaw path in Deep Config.', retryable: true } }
  }
  try {
    addLog('info', `Dispatching task: ${prompt.substring(0, 60)}...`)
    recordDispatch(prompt, mode)
    mainWindow?.webContents.send(IPC_CHANNELS.ON_STATUS_CHANGE, 'running')
    const run = runCommand(
      'node',
      ['index.js', '--prompt', JSON.stringify(prompt), '--mode', mode],
      resolvedPath,
      mainWindow
    )
    dispatchRun = run
    const output = await run.completed
    dispatchRun = null
    addLog('info', 'Task completed')
    mainWindow?.webContents.send(IPC_CHANNELS.ON_STATUS_CHANGE, 'idle')
    notifyIfUnfocused('🔱 Task Complete', 'Your emissary has returned to shore with results.')
    return { ok: true, output }
  } catch (err) {
    dispatchRun = null
    const msg = err instanceof Error ? err.message : 'Unknown error'
    // Distinguish user-initiated cancellation from real errors
    if (msg.includes('SIGTERM') || msg.includes('killed')) {
      addLog('info', 'Task was cancelled by user')
      mainWindow?.webContents.send(IPC_CHANNELS.ON_STATUS_CHANGE, 'idle')
      return { ok: false, error: 'Task cancelled.', explanation: { what: 'You cancelled the task.', cause: 'The task was stopped at your request.', action: 'Dispatch a new task when you are ready.', retryable: true } }
    }
    addLog('error', `Task failed: ${msg}`)
    mainWindow?.webContents.send(IPC_CHANNELS.ON_STATUS_CHANGE, 'error')
    notifyIfUnfocused('❌ Task Failed', 'Something went wrong. Check the app for details.')
    return { ok: false, error: msg, explanation: translateError(msg, 'dispatch') }
  }
})

ipcMain.handle(IPC_CHANNELS.CANCEL_TASK, async () => {
  if (dispatchRun) {
    killProcess(dispatchRun.process)
    dispatchRun = null
    addLog('info', 'Task cancelled by user')
    mainWindow?.webContents.send(IPC_CHANNELS.ON_STATUS_CHANGE, 'idle')
    return { ok: true }
  }
  return { ok: false, error: 'No active task to cancel.' }
})

// --- Dropped file/folder resolution ---

ipcMain.handle(IPC_CHANNELS.RESOLVE_DROPPED_PATHS, async (_event, paths: string[]) => {
  const results = paths.map((p) => {
    try {
      const stat = statSync(p)
      return { path: p, isDirectory: stat.isDirectory(), error: false }
    } catch (err) {
      // Path may be inaccessible (permissions) or non-existent
      addLog('warning', `Could not stat dropped path: ${p} — ${err instanceof Error ? err.message : 'unknown error'}`)
      return { path: p, isDirectory: false, error: true }
    }
  })
  return results.filter(r => !r.error)
})

// --- Terminal IPC Handlers ---

ipcMain.handle(IPC_CHANNELS.TERMINAL_SPAWN, async (_event, cwd: string) => {
  const dir = cwd || process.cwd()
  const pathCheck = validatePath(dir)
  if (!pathCheck.ok) {
    addLog('error', `Terminal spawn path rejected: ${pathCheck.error}`)
    return { ok: false, error: pathCheck.error }
  }
  const spawned = spawnTerminal(dir, mainWindow)
  if (spawned) {
    addLog('info', `Terminal session started in ${dir}`)
    return { ok: true }
  }
  return { ok: false, error: 'Terminal session already running.' }
})

ipcMain.handle(IPC_CHANNELS.TERMINAL_INPUT, async (_event, data: string) => {
  writeTerminal(data)
})

ipcMain.handle(IPC_CHANNELS.TERMINAL_RESIZE, async (_event, cols: number, rows: number) => {
  resizeTerminal(cols, rows)
})

ipcMain.handle(IPC_CHANNELS.TERMINAL_KILL, async () => {
  killTerminal()
  addLog('info', 'Terminal session ended')
  return { ok: true }
})

// --- Task persistence ---

ipcMain.handle(IPC_CHANNELS.GET_TASKS, () => getTasks())

ipcMain.handle(IPC_CHANNELS.ADD_TASK, (_event, task) => {
  return addTaskToStore(task)
})

// --- Habit suggestion ---

ipcMain.handle(IPC_CHANNELS.GET_HABIT_SUGGESTION, () => {
  return getSuggestion()
})

// --- Service heartbeat ---

/**
 * Check if the service process is still alive.
 * Returns { alive, pid } — if the process exists but is not responding,
 * this sets the status to 'error' so the user knows something is wrong.
 */
ipcMain.handle(IPC_CHANNELS.SERVICE_HEARTBEAT, () => {
  if (!serviceRun) return { alive: false, pid: null }
  const proc = serviceRun.process
  // A killed process has .killed === true or .exitCode !== null
  if (proc.killed || proc.exitCode !== null) {
    serviceRun = null
    addLog('warning', 'Service process was found dead during heartbeat check')
    mainWindow?.webContents.send(IPC_CHANNELS.ON_STATUS_CHANGE, 'stopped')
    return { alive: false, pid: proc.pid ?? null }
  }
  return { alive: true, pid: proc.pid ?? null }
})

function startHeartbeat(): void {
  stopHeartbeat()
  heartbeatTimer = setInterval(() => {
    if (!serviceRun) {
      stopHeartbeat()
      return
    }
    const proc = serviceRun.process
    if (proc.killed || proc.exitCode !== null) {
      serviceRun = null
      addLog('warning', 'Service process died unexpectedly (heartbeat)')
      mainWindow?.webContents.send(IPC_CHANNELS.ON_STATUS_CHANGE, 'stopped')
      stopHeartbeat()
    }
  }, 5000) // Check every 5 seconds
}

function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}
