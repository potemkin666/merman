import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { IPC_CHANNELS } from '../shared/ipc'
import { checkEnvironment } from './services/envChecker'
import { runCommand } from './services/processRunner'
import { getConfig, setConfig } from './services/configService'
import { getLogs, addLog } from './services/logService'

let mainWindow: BrowserWindow | null = null

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
    return { ok: false, error: msg }
  }
})

ipcMain.handle(IPC_CHANNELS.START_SERVICE, async (_event, openClawPath: string) => {
  try {
    addLog('info', 'Starting OpenClaw service...')
    mainWindow?.webContents.send(IPC_CHANNELS.ON_STATUS_CHANGE, 'running')
    runCommand('node', ['index.js'], openClawPath, mainWindow).catch((err) => {
      addLog('error', `Service error: ${err.message}`)
      mainWindow?.webContents.send(IPC_CHANNELS.ON_STATUS_CHANGE, 'error')
    })
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    addLog('error', `Failed to start: ${msg}`)
    return { ok: false, error: msg }
  }
})

ipcMain.handle(IPC_CHANNELS.STOP_SERVICE, async () => {
  addLog('info', 'Service stop requested')
  mainWindow?.webContents.send(IPC_CHANNELS.ON_STATUS_CHANGE, 'stopped')
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
    return { ok: false, error: msg }
  }
})
