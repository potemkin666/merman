import { execSync } from 'child_process'
import type { EnvCheckResult } from '../../shared/types'

function checkCommand(name: string, cmd: string, versionFlag = '--version'): EnvCheckResult {
  try {
    const out = execSync(`${cmd} ${versionFlag}`, { encoding: 'utf8', timeout: 5000 }).trim()
    const version = out.split('\n')[0].replace(/^v/, '')
    return { name, version, ok: true }
  } catch {
    return { name, ok: false, message: `${name} not found in PATH` }
  }
}

export async function checkEnvironment(): Promise<EnvCheckResult[]> {
  return [
    checkCommand('Node.js', 'node'),
    checkCommand('npm', 'npm'),
    checkCommand('git', 'git'),
  ]
}
