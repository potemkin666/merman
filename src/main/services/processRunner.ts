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
 * Spawn a command and stream output to the renderer.
 * Returns the ChildProcess when used as a fire-and-forget (onExit supplied).
 * Returns a Promise<string> when awaited.
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
): ChildProcess & Promise<string> {
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

  const promise = new Promise<string>((resolve, reject) => {
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

  // Merge the promise interface onto the ChildProcess so callers
  // can either await the result or hold a reference for kill().
  const hybrid = proc as ChildProcess & Promise<string>
  hybrid.then = promise.then.bind(promise)
  hybrid.catch = promise.catch.bind(promise)
  hybrid.finally = promise.finally.bind(promise)

  return hybrid
}

export function killProcess(proc: ChildProcess): void {
  if (proc && !proc.killed) {
    proc.kill('SIGTERM')
  }
}
