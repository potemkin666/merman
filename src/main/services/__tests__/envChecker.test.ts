import { describe, it, expect, vi, beforeEach } from 'vitest'

// We need to mock `fs` and `path` and `child_process` before importing envChecker.
// Also mock configService since envChecker reads config.

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  statSync: vi.fn(),
}))

vi.mock('../configService', () => ({
  getConfig: vi.fn(),
}))

// Mock child_process.execFile for the async command checks
vi.mock('child_process', () => ({
  execFile: vi.fn(),
}))

import { existsSync, readdirSync, statSync } from 'fs'
import { execFile } from 'child_process'
import { getConfig } from '../configService'
import { checkEnvironment, detectOpenClawPath } from '../envChecker'

const mockExistsSync = vi.mocked(existsSync)
const mockGetConfig = vi.mocked(getConfig)
const mockExecFile = vi.mocked(execFile)
const mockReaddirSync = vi.mocked(readdirSync)
const mockStatSync = vi.mocked(statSync)

describe('envChecker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkEnvironment', () => {
    it('returns results for all checks in parallel', async () => {
      // Mock execFile to simulate successful node/npm/git
      mockExecFile.mockImplementation(((cmd: string, _args: string[], _opts: object, cb: (err: Error | null, stdout: string) => void) => {
        cb(null, `${cmd} v18.0.0\n`)
        return { on: vi.fn() }
      }) as unknown as typeof execFile)

      // Mock config for directory checks
      mockGetConfig.mockResolvedValue({
        openClawPath: '/some/path',
        workspacePath: '',
        model: 'gpt-4o',
        provider: 'openai',
        apiKey: '',
        presets: [],
        emissaryName: '',
      })
      mockExistsSync.mockReturnValue(true)

      const results = await checkEnvironment()
      expect(results).toHaveLength(5) // node, npm, git, dir, config
      expect(results[0].name).toBe('Node.js')
      expect(results[0].ok).toBe(true)
      expect(results[1].name).toBe('npm')
      expect(results[2].name).toBe('git')
    })

    it('marks commands as failed when execFile errors', async () => {
      mockExecFile.mockImplementation(((_cmd: string, _args: string[], _opts: object, cb: (err: Error | null, stdout: string) => void) => {
        cb(new Error('command not found'), '')
        return { on: vi.fn() }
      }) as unknown as typeof execFile)

      mockGetConfig.mockResolvedValue({
        openClawPath: '',
        workspacePath: '',
        model: 'gpt-4o',
        provider: 'openai',
        apiKey: '',
        presets: [],
        emissaryName: '',
      })
      mockExistsSync.mockReturnValue(false)

      const results = await checkEnvironment()
      expect(results[0].ok).toBe(false)
      expect(results[0].message).toContain('not found')
    })

    it('checks OpenClaw directory existence and package.json', async () => {
      mockExecFile.mockImplementation(((_cmd: string, _args: string[], _opts: object, cb: (err: Error | null, stdout: string) => void) => {
        cb(null, 'v20.0.0\n')
        return { on: vi.fn() }
      }) as unknown as typeof execFile)

      mockGetConfig.mockResolvedValue({
        openClawPath: '/my/openclaw',
        workspacePath: '',
        model: 'gpt-4o',
        provider: 'openai',
        apiKey: '',
        presets: [],
        emissaryName: '',
      })

      // dir exists, package.json exists, node_modules exists
      mockExistsSync.mockImplementation((p: unknown) => {
        const path = String(p)
        if (path === '/my/openclaw') return true
        if (path.endsWith('package.json')) return true
        if (path.endsWith('node_modules')) return true
        // config files
        if (path.endsWith('.env')) return true
        return false
      })

      const results = await checkEnvironment()
      const dirCheck = results.find(r => r.name === 'OpenClaw Directory')
      expect(dirCheck?.ok).toBe(true)
      expect(dirCheck?.version).toBe('ready')
    })

    it('reports missing OpenClaw directory when path is empty', async () => {
      mockExecFile.mockImplementation(((_cmd: string, _args: string[], _opts: object, cb: (err: Error | null, stdout: string) => void) => {
        cb(null, 'v20.0.0\n')
        return { on: vi.fn() }
      }) as unknown as typeof execFile)

      mockGetConfig.mockResolvedValue({
        openClawPath: '',
        workspacePath: '',
        model: 'gpt-4o',
        provider: 'openai',
        apiKey: '',
        presets: [],
        emissaryName: '',
      })
      mockExistsSync.mockReturnValue(false)

      const results = await checkEnvironment()
      const dirCheck = results.find(r => r.name === 'OpenClaw Directory')
      expect(dirCheck?.ok).toBe(false)
      expect(dirCheck?.message).toContain('No path configured')
    })
  })

  describe('detectOpenClawPath', () => {
    it('returns empty string when HOME is not set and no paths exist', async () => {
      const origHome = process.env.HOME
      const origUserProfile = process.env.USERPROFILE
      delete process.env.HOME
      delete process.env.USERPROFILE
      mockExistsSync.mockReturnValue(false)
      mockGetConfig.mockResolvedValue({
        openClawPath: '',
        workspacePath: '',
        model: 'gpt-4o',
        provider: 'openai',
        apiKey: '',
        presets: [],
        emissaryName: '',
      })

      const result = await detectOpenClawPath()
      expect(result).toBe('')

      process.env.HOME = origHome
      if (origUserProfile !== undefined) process.env.USERPROFILE = origUserProfile
    })

    it('returns the configured openClawPath first if it is valid', async () => {
      mockGetConfig.mockResolvedValue({
        openClawPath: '/configured/openclaw',
        workspacePath: '',
        model: 'gpt-4o',
        provider: 'openai',
        apiKey: '',
        presets: [],
        emissaryName: '',
      })
      mockExistsSync.mockImplementation((p: unknown) => {
        const path = String(p)
        return path === '/configured/openclaw' || path === '/configured/openclaw/package.json'
      })

      const result = await detectOpenClawPath()
      expect(result).toBe('/configured/openclaw')
    })

    it('returns the first matching hardcoded path with package.json', async () => {
      const home = process.env.HOME || '/home/test'
      mockGetConfig.mockResolvedValue({
        openClawPath: '',
        workspacePath: '',
        model: 'gpt-4o',
        provider: 'openai',
        apiKey: '',
        presets: [],
        emissaryName: '',
      })
      mockExistsSync.mockImplementation((p: unknown) => {
        const path = String(p)
        if (path === `${home}/openclaw`) return true
        if (path === `${home}/openclaw/package.json`) return true
        return false
      })

      const result = await detectOpenClawPath()
      expect(result).toBe(`${home}/openclaw`)
    })

    it('finds git clones named openclaw in parent directories', async () => {
      const home = process.env.HOME || '/home/test'
      mockGetConfig.mockResolvedValue({
        openClawPath: '',
        workspacePath: '',
        model: 'gpt-4o',
        provider: 'openai',
        apiKey: '',
        presets: [],
        emissaryName: '',
      })
      // No hardcoded candidates exist
      mockExistsSync.mockImplementation((p: unknown) => {
        const path = String(p)
        // Only the git-cloned folder in ~/projects exists
        if (path === `${home}/projects`) return true
        if (path === `${home}/projects/OpenClaw/.git`) return true
        if (path === `${home}/projects/OpenClaw/package.json`) return true
        return false
      })
      mockReaddirSync.mockImplementation((p: unknown) => {
        const path = String(p)
        if (path === `${home}/projects`) return ['some-other-repo', 'OpenClaw'] as unknown as ReturnType<typeof readdirSync>
        return [] as unknown as ReturnType<typeof readdirSync>
      })
      mockStatSync.mockImplementation((_p: unknown) => {
        return { isDirectory: () => true } as ReturnType<typeof statSync>
      })

      const result = await detectOpenClawPath()
      expect(result).toBe(`${home}/projects/OpenClaw`)
    })
  })
})
