import { spawn } from 'child_process'
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

export function runCommand(
  cmd: string,
  args: string[],
  cwd: string,
  win: BrowserWindow | null
): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, shell: true })
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

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(output.join(''))
      } else {
        reject(new Error(`Process exited with code ${code}`))
      }
    })

    proc.on('error', reject)
  })
}
