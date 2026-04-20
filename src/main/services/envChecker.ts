import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import type { EnvCheckResult } from '../../shared/types'
import { getConfig } from './configService'

function checkCommand(name: string, cmd: string, versionFlag = '--version'): EnvCheckResult {
  try {
    const out = execSync(`${cmd} ${versionFlag}`, { encoding: 'utf8', timeout: 5000 }).trim()
    const version = out.split('\n')[0].replace(/^v/, '')
    return { name, version, ok: true }
  } catch {
    return {
      name,
      ok: false,
      message: `${name} not found. Install it and make sure it is available in your PATH.`,
    }
  }
}

function checkOpenClawDir(): EnvCheckResult {
  const config = getConfig()
  const dir = config.openClawPath
  if (!dir) {
    return {
      name: 'OpenClaw Directory',
      ok: false,
      message: 'No path configured. Set it in Deep Config or the Setup Wizard.',
    }
  }
  if (!existsSync(dir)) {
    return {
      name: 'OpenClaw Directory',
      ok: false,
      message: `Directory not found at ${dir}. Check the path in Deep Config.`,
    }
  }
  const hasPackageJson = existsSync(join(dir, 'package.json'))
  if (!hasPackageJson) {
    return {
      name: 'OpenClaw Directory',
      ok: false,
      message: `Directory exists but no package.json found. Is this the right folder?`,
    }
  }
  const hasNodeModules = existsSync(join(dir, 'node_modules'))
  if (!hasNodeModules) {
    return {
      name: 'OpenClaw Directory',
      ok: true,
      version: 'found',
      message: 'Directory found but dependencies not installed. Run Setup to install them.',
    }
  }
  return { name: 'OpenClaw Directory', ok: true, version: 'ready' }
}

function checkOpenClawConfig(): EnvCheckResult {
  const config = getConfig()
  const dir = config.openClawPath
  if (!dir || !existsSync(dir)) {
    return {
      name: 'OpenClaw Config',
      ok: false,
      message: 'Cannot check — OpenClaw directory is not set or missing.',
    }
  }
  const candidates = ['.env', 'config.json', 'openclaw.config.js', 'openclaw.config.ts']
  const found = candidates.filter((f) => existsSync(join(dir, f)))
  if (found.length === 0) {
    return {
      name: 'OpenClaw Config',
      ok: false,
      message: 'No configuration file detected. You may need to create one before launching.',
    }
  }
  return {
    name: 'OpenClaw Config',
    ok: true,
    version: found.join(', '),
  }
}

export async function checkEnvironment(): Promise<EnvCheckResult[]> {
  return [
    checkCommand('Node.js', 'node'),
    checkCommand('npm', 'npm'),
    checkCommand('git', 'git'),
    checkOpenClawDir(),
    checkOpenClawConfig(),
  ]
}
