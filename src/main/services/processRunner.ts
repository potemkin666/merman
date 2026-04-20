import { spawn, ChildProcess } from 'child_process'
import { existsSync } from 'fs'
import { resolve, isAbsolute } from 'path'
import type { BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc'
import type { LogEntry } from '../../shared/types'

let logIdCounter = 0

function makeLog(level: LogEntry['level'], message: string): LogEntry {
  return {
    id: String(++logIdCounter),
    timestamp: new Date().toISOString(),
    level,
    message,
    raw: message,
  }
}

/**
 * Validate that a path is safe to use as a cwd for spawned processes.
 * Rejects paths containing shell metacharacters that could be dangerous.
 */
export function validatePath(path: string): { ok: boolean; error?: string } {
  if (!path || !path.trim()) {
    return { ok: false, error: 'Path is empty.' }
  }

  // Reject shell metacharacters and command separators
  const shellMetacharactersPattern = /[;|&`$(){}[\]!<>*?\n\r]/
  if (shellMetacharactersPattern.test(path)) {
    return { ok: false, error: 'Path contains invalid characters. Please use a simple directory path.' }
  }

  // Resolve to absolute and ensure it exists
  const resolved = isAbsolute(path) ? path : resolve(path)
  if (!existsSync(resolved)) {
    return { ok: false, error: `Directory not found: ${resolved}` }
  }

  return { ok: true }
}

/**
 * A properly typed wrapper that gives callers access to both the
 * underlying ChildProcess (for kill/pid) and the completion Promise.
 */
export interface RunResult {
  /** The spawned child process — use for kill(), pid, etc. */
  process: ChildProcess
  /** Resolves with the full stdout+stderr output when the process exits 0; rejects otherwise. */
  completed: Promise<string>
}

/**
 * Spawn a command and stream output to the renderer.
 *
 * Returns a `RunResult` with:
 * - `process` — the ChildProcess (for kill/pid)
 * - `completed` — a Promise<string> that resolves when the process exits
 *
 * shell: false — arguments are passed directly to the executable, preventing
 * shell metacharacter injection via the cwd or args.
 */
export function runCommand(
  cmd: string,
  args: string[],
  cwd: string,
  win: BrowserWindow | null,
  onExit?: (proc: ChildProcess) => void
): RunResult {
  const proc = spawn(cmd, args, { cwd, shell: false })
  const output: string[] = []

  proc.stdout.on('data', (data: Buffer) => {
    const msg = data.toString()
    output.push(msg)
    win?.webContents.send(IPC_CHANNELS.ON_LOG, makeLog('info', msg.trim()))
  })

  proc.stderr.on('data', (data: Buffer) => {
    const msg = data.toString()
    output.push(msg)
    win?.webContents.send(IPC_CHANNELS.ON_LOG, makeLog('warning', msg.trim()))
  })

  const completed = new Promise<string>((resolve, reject) => {
    proc.on('close', (code) => {
      if (onExit) onExit(proc)
      if (code === 0) {
        resolve(output.join(''))
      } else {
        reject(new Error(`Process exited with code ${code}`))
      }
    })

    proc.on('error', (err) => {
      if (onExit) onExit(proc)
      reject(err)
    })
  })

  return { process: proc, completed }
}

export function killProcess(proc: ChildProcess): void {
  if (proc && !proc.killed) {
    proc.kill('SIGTERM')
  }
}
