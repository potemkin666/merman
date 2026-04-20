import * as pty from 'node-pty'
import type { BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc'
import { platform } from 'os'

let ptyProcess: pty.IPty | null = null

const defaultShell =
  platform() === 'win32' ? 'powershell.exe' :
  process.env.SHELL || '/bin/bash'

/**
 * Spawn a PTY session in the given working directory.
 * Pipes output back to the renderer via IPC.
 */
export function spawnTerminal(cwd: string, win: BrowserWindow | null): boolean {
  if (ptyProcess) {
    return false // already running
  }

  ptyProcess = pty.spawn(defaultShell, [], {
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

/** Write data to the active PTY. */
export function writeTerminal(data: string): void {
  ptyProcess?.write(data)
}

/** Resize the PTY. */
export function resizeTerminal(cols: number, rows: number): void {
  try {
    ptyProcess?.resize(cols, rows)
  } catch {
    // ignore resize errors when terminal is not active
  }
}

/** Kill the active PTY. */
export function killTerminal(): void {
  if (ptyProcess) {
    ptyProcess.kill()
    ptyProcess = null
  }
}

/** Check if a PTY is currently running. */
export function isTerminalRunning(): boolean {
  return ptyProcess !== null
}
