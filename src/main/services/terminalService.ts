import { spawn, type ChildProcess } from 'child_process'
import type { BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc'
import { platform } from 'os'

/**
 * Try to load node-pty at runtime.
 * node-pty is a native module that must be compiled against the current
 * Electron headers.  When the binary is missing or was built for the wrong
 * runtime the require() call will throw.  We catch that and fall back to a
 * plain child_process shell — less capable (no proper PTY) but the app still
 * starts and the terminal screen remains usable.
 */
let pty: typeof import('node-pty') | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  pty = require('node-pty')
} catch {
  console.warn(
    'node-pty is not available — falling back to child_process shell. ' +
    'Run "npm run rebuild" to compile native modules for Electron.'
  )
}

const defaultShell =
  platform() === 'win32' ? 'powershell.exe' :
  process.env.SHELL || '/bin/bash'

// --- State for PTY mode ---
let ptyProcess: import('node-pty').IPty | null = null

// --- State for fallback (child_process) mode ---
let fallbackProcess: ChildProcess | null = null

/** Whether the terminal service is using the full PTY backend. */
export function hasPtySupport(): boolean {
  return pty !== null
}

/**
 * Spawn a terminal session in the given working directory.
 * Uses node-pty when available; otherwise falls back to child_process.
 */
export function spawnTerminal(cwd: string, win: BrowserWindow | null): boolean {
  if (ptyProcess || fallbackProcess) {
    return false // already running
  }

  if (pty) {
    return spawnPty(cwd, win)
  }
  return spawnFallback(cwd, win)
}

// ---- PTY backend ----

function spawnPty(cwd: string, win: BrowserWindow | null): boolean {
  ptyProcess = pty!.spawn(defaultShell, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd,
    env: process.env as Record<string, string>,
  })

  ptyProcess.onData((data: string) => {
    win?.webContents.send(IPC_CHANNELS.TERMINAL_OUTPUT, data)
  })

  ptyProcess.onExit(() => {
    ptyProcess = null
    win?.webContents.send(IPC_CHANNELS.TERMINAL_EXIT)
  })

  return true
}

// ---- Fallback (child_process) backend ----

function spawnFallback(cwd: string, win: BrowserWindow | null): boolean {
  const isWin = platform() === 'win32'
  fallbackProcess = spawn(defaultShell, isWin ? [] : ['-i'], {
    cwd,
    env: process.env as Record<string, string>,
    shell: false,
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  fallbackProcess.stdout?.on('data', (data: Buffer) => {
    win?.webContents.send(IPC_CHANNELS.TERMINAL_OUTPUT, data.toString())
  })

  fallbackProcess.stderr?.on('data', (data: Buffer) => {
    win?.webContents.send(IPC_CHANNELS.TERMINAL_OUTPUT, data.toString())
  })

  fallbackProcess.on('exit', () => {
    fallbackProcess = null
    win?.webContents.send(IPC_CHANNELS.TERMINAL_EXIT)
  })

  fallbackProcess.on('error', (err) => {
    win?.webContents.send(IPC_CHANNELS.TERMINAL_OUTPUT, `\r\nShell error: ${err.message}\r\n`)
    fallbackProcess = null
    win?.webContents.send(IPC_CHANNELS.TERMINAL_EXIT)
  })

  return true
}

/** Write data to the active terminal session. */
export function writeTerminal(data: string): void {
  if (ptyProcess) {
    ptyProcess.write(data)
  } else if (fallbackProcess?.stdin?.writable) {
    fallbackProcess.stdin.write(data)
  }
}

/** Resize the terminal (PTY only — no-op in fallback mode). */
export function resizeTerminal(cols: number, rows: number): void {
  try {
    ptyProcess?.resize(cols, rows)
  } catch {
    // ignore resize errors when terminal is not active
  }
}

/** Kill the active terminal session. */
export function killTerminal(): void {
  if (ptyProcess) {
    ptyProcess.kill()
    ptyProcess = null
  }
  if (fallbackProcess) {
    fallbackProcess.kill('SIGTERM')
    fallbackProcess = null
  }
}

/** Check if a terminal session is currently running. */
export function isTerminalRunning(): boolean {
  return ptyProcess !== null || fallbackProcess !== null
}
