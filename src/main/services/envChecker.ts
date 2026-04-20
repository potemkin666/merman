import { execFile } from 'child_process'
import { existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import type { EnvCheckResult } from '../../shared/types'
import { getConfig } from './configService'

function checkCommand(name: string, cmd: string, versionFlag = '--version'): Promise<EnvCheckResult> {
  const notFoundResult: EnvCheckResult = {
    name,
    ok: false,
    message: `${name} not found. Install it and make sure it is available in your PATH.`,
  }
  return new Promise((resolve) => {
    const child = execFile(cmd, [versionFlag], { encoding: 'utf8', timeout: 5000 }, (err, stdout) => {
      if (err) {
        resolve(notFoundResult)
      } else {
        const version = stdout.trim().split('\n')[0].replace(/^v/, '')
        resolve({ name, version, ok: true })
      }
    })
    child.on('error', () => resolve(notFoundResult))
  })
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
  const [nodeResult, npmResult, gitResult] = await Promise.all([
    checkCommand('Node.js', 'node'),
    checkCommand('npm', 'npm'),
    checkCommand('git', 'git'),
  ])
  return [
    nodeResult,
    npmResult,
    gitResult,
    checkOpenClawDir(),
    checkOpenClawConfig(),
  ]
}

/**
 * Search for an OpenClaw installation directory.
 *
 * Priority order:
 * 1. The currently-configured openClawPath (if it's valid)
 * 2. Common hardcoded candidate directories
 * 3. Git clone directories — scan common parent folders for repos named "openclaw"
 *
 * Returns the first path that contains a package.json, or empty string.
 */
export function detectOpenClawPath(): string {
  const home = process.env.HOME || process.env.USERPROFILE || ''
  if (!home) return ''

  // 1. Check the already-configured path first
  const config = getConfig()
  if (config.openClawPath && isValidOpenClawDir(config.openClawPath)) {
    return config.openClawPath
  }

  // 2. Check common hardcoded candidates
  const candidates = [
    join(home, 'openclaw'),
    join(home, 'OpenClaw'),
    join(home, 'projects', 'openclaw'),
    join(home, 'projects', 'OpenClaw'),
    join(home, 'Documents', 'openclaw'),
    join(home, 'Documents', 'OpenClaw'),
    join(home, 'Desktop', 'openclaw'),
    join(home, 'Desktop', 'OpenClaw'),
    join(home, 'dev', 'openclaw'),
    join(home, 'dev', 'OpenClaw'),
    join(home, 'src', 'openclaw'),
    join(home, 'src', 'OpenClaw'),
    join(home, 'code', 'openclaw'),
    join(home, 'code', 'OpenClaw'),
    join(home, 'repos', 'openclaw'),
    join(home, 'repos', 'OpenClaw'),
  ]

  for (const dir of candidates) {
    if (isValidOpenClawDir(dir)) {
      return dir
    }
  }

  // 3. Scan common parent directories for git clones named "openclaw"
  const parentDirs = [
    join(home, 'projects'),
    join(home, 'dev'),
    join(home, 'src'),
    join(home, 'code'),
    join(home, 'repos'),
    join(home, 'Documents'),
    join(home, 'Desktop'),
    home,
  ]

  for (const parent of parentDirs) {
    const match = scanForOpenClawRepo(parent)
    if (match) return match
  }

  return ''
}

/** Check whether a directory looks like a valid OpenClaw installation. */
function isValidOpenClawDir(dir: string): boolean {
  return existsSync(dir) && existsSync(join(dir, 'package.json'))
}

/**
 * Scan a parent directory's immediate children for a git repo whose
 * folder name matches "openclaw" (case-insensitive) and contains a package.json.
 */
function scanForOpenClawRepo(parentDir: string): string {
  if (!existsSync(parentDir)) return ''
  try {
    const entries = readdirSync(parentDir)
    for (const name of entries) {
      if (name.toLowerCase() !== 'openclaw') continue
      const candidate = join(parentDir, name)
      try {
        if (!statSync(candidate).isDirectory()) continue
      } catch {
        continue
      }
      if (existsSync(join(candidate, '.git')) && existsSync(join(candidate, 'package.json'))) {
        return candidate
      }
    }
  } catch {
    // Permission denied or other fs error — skip this parent
  }
  return ''
}
