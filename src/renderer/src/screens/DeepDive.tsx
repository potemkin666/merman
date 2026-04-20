import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { useIpc, useIpcListener } from '../hooks/useIpc'
import { IPC_CHANNELS } from '../../../shared/ipc'
import { Tooltip } from '../components/Tooltip'
import type { AppConfig, CommandResult } from '../../../shared/types'

interface DeepDiveProps {
  config: AppConfig
}

// Emissary narration for common commands
const NARRATIONS: Array<{ pattern: RegExp; lines: string[] }> = [
  { pattern: /^\s*ls/, lines: [
    'Ah, ls... let me illuminate these files for you, commander.',
    'Peering into the contents of this directory...',
    'Revealing what lies in this chamber of the deep.',
  ]},
  { pattern: /^\s*cd/, lines: [
    'Navigating to new waters...',
    'Changing currents — follow me.',
    'A new destination! The tides shift.',
  ]},
  { pattern: /^\s*cat/, lines: [
    'Unrolling the scroll... let us read together.',
    'The contents of this file, commander:',
    'Opening the ancient texts...',
  ]},
  { pattern: /^\s*npm\s+install/, lines: [
    'Summoning packages from the surface world...',
    'Gathering dependencies like pearls from the ocean floor.',
    'The package currents flow... this may take a moment.',
  ]},
  { pattern: /^\s*npm\s+run/, lines: [
    'Invoking the ritual... let us see what emerges.',
    'Running the command. Stand back from the trident.',
    'Executing... the deep stirs.',
  ]},
  { pattern: /^\s*git/, lines: [
    'Consulting the version scrolls...',
    'The git currents flow with history.',
    'Diving into the repository depths...',
  ]},
  { pattern: /^\s*node/, lines: [
    'Awakening the JavaScript leviathan...',
    'The Node engine hums to life.',
    'Invoking the runtime... prepare for output.',
  ]},
  { pattern: /^\s*rm/, lines: [
    'Careful, commander! Destroying things in the deep is permanent.',
    'The abyss claims another... removed.',
    '...Are you sure about that? Very well.',
  ]},
  { pattern: /^\s*mkdir/, lines: [
    'Carving a new chamber in the sea floor.',
    'A new directory — a new frontier.',
  ]},
  { pattern: /^\s*grep/, lines: [
    'Searching the depths for your pattern...',
    'The emissary scours every crevice.',
  ]},
  { pattern: /^\s*clear/, lines: [
    'Clearing the waters... fresh start.',
    'A clean slate. The ocean refreshes.',
  ]},
  { pattern: /^\s*pwd/, lines: [
    'You are here, in these depths:',
    'Your current position in the ocean:',
  ]},
  { pattern: /^\s*echo/, lines: [
    'The deep echoes back...',
    'Your words reverberate through the abyss.',
  ]},
  { pattern: /^\s*exit/, lines: [
    'Returning to the surface... farewell for now.',
    'The deep dive ends. Until next time, commander.',
  ]},
]

function getNarration(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  for (const { pattern, lines } of NARRATIONS) {
    if (pattern.test(trimmed)) {
      return lines[Math.floor(Math.random() * lines.length)]
    }
  }
  // Generic narration for unknown commands
  const generic = [
    `Executing "${trimmed.split(' ')[0]}"... let us see what the deep returns.`,
    'An unfamiliar command, but the emissary presses on.',
    'Into unknown waters we go...',
    'The deep does not recognise this, but we try anyway.',
  ]
  return generic[Math.floor(Math.random() * generic.length)]
}

export const DeepDive: React.FC<DeepDiveProps> = ({ config }) => {
  const { invoke } = useIpc()
  const terminalRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [narration, setNarration] = useState('Click "Dive In" to open a shell session in your OpenClaw directory.')
  const inputBuffer = useRef('')

  // Terminal output listener
  useIpcListener(IPC_CHANNELS.TERMINAL_OUTPUT, (...args: unknown[]) => {
    const data = args[0] as string
    termRef.current?.write(data)
  }, [])

  // Terminal exit listener
  useIpcListener(IPC_CHANNELS.TERMINAL_EXIT, () => {
    setIsRunning(false)
    setNarration('The deep dive has ended. The emissary has returned to shore.')
    termRef.current?.write('\r\n\x1b[36m[Session ended]\x1b[0m\r\n')
  }, [])

  // Initialize xterm
  useEffect(() => {
    if (!terminalRef.current || termRef.current) return

    const term = new Terminal({
      theme: {
        background: '#060d1a',
        foreground: '#e8f4f8',
        cursor: '#00c8d4',
        cursorAccent: '#060d1a',
        selectionBackground: 'rgba(0,200,212,0.3)',
        black: '#0a0f1e',
        red: '#e85d5d',
        green: '#2dd4a0',
        yellow: '#f0a500',
        blue: '#00c8d4',
        magenta: '#c9a227',
        cyan: '#1a9b8a',
        white: '#e8f4f8',
        brightBlack: '#7ba8b8',
        brightRed: '#ff7777',
        brightGreen: '#44eebb',
        brightYellow: '#ffcc33',
        brightBlue: '#33ddee',
        brightMagenta: '#ddcc44',
        brightCyan: '#33ccaa',
        brightWhite: '#ffffff',
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
      fontSize: 13,
      lineHeight: 1.3,
      cursorBlink: true,
      cursorStyle: 'bar',
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(terminalRef.current)

    // Fit after opening
    setTimeout(() => fitAddon.fit(), 50)

    // Send user input to PTY + capture for narration
    term.onData((data) => {
      if (!isRunning) return
      invoke(IPC_CHANNELS.TERMINAL_INPUT, data)

      // Track input line for narration (detect Enter)
      if (data === '\r' || data === '\n') {
        const line = inputBuffer.current
        inputBuffer.current = ''
        const n = getNarration(line)
        if (n) setNarration(n)
      } else if (data === '\x7f') {
        // Backspace
        inputBuffer.current = inputBuffer.current.slice(0, -1)
      } else if (data.length === 1 && data >= ' ') {
        inputBuffer.current += data
      }
    })

    termRef.current = term
    fitAddonRef.current = fitAddon

    return () => {
      term.dispose()
      termRef.current = null
      fitAddonRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current && termRef.current) {
        fitAddonRef.current.fit()
        const dims = fitAddonRef.current.proposeDimensions()
        if (dims) {
          invoke(IPC_CHANNELS.TERMINAL_RESIZE, dims.cols, dims.rows)
        }
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [invoke])

  const handleDiveIn = useCallback(async () => {
    const cwd = config.openClawPath || process.cwd?.() || ''
    const result = await invoke<CommandResult>(IPC_CHANNELS.TERMINAL_SPAWN, cwd)
    if (result.ok) {
      setIsRunning(true)
      setNarration('The deep dive begins. Type commands and the emissary will narrate your journey.')
      // Focus the terminal
      setTimeout(() => {
        termRef.current?.focus()
        if (fitAddonRef.current) {
          fitAddonRef.current.fit()
          const dims = fitAddonRef.current.proposeDimensions()
          if (dims) invoke(IPC_CHANNELS.TERMINAL_RESIZE, dims.cols, dims.rows)
        }
      }, 100)
    } else {
      setNarration(result.error || 'Could not start terminal session.')
    }
  }, [config.openClawPath, invoke])

  const handleSurface = useCallback(async () => {
    await invoke(IPC_CHANNELS.TERMINAL_KILL)
    setIsRunning(false)
    setNarration('Surfacing... the deep dive is over. Click "Dive In" to start a new session.')
  }, [invoke])

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>
        Deep Dive
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 16, fontSize: 14 }}>
        🤿 A real shell session inside your OpenClaw directory — narrated by the emissary.
      </p>

      {/* Emissary narration bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        background: 'var(--color-panel)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 12,
      }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>🧜‍♂️</span>
        <p style={{
          flex: 1,
          fontSize: 13,
          color: 'var(--color-text)',
          lineHeight: 1.5,
          fontStyle: narration.startsWith('*') ? 'italic' : 'normal',
        }}>
          {narration}
        </p>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {!isRunning ? (
            <Tooltip text={!config.openClawPath ? 'Set your OpenClaw path in Deep Config or Setup first.' : 'Open a real terminal session inside your OpenClaw directory.'}>
              <button
                onClick={handleDiveIn}
                disabled={!config.openClawPath}
                aria-label="Start terminal session"
                style={{
                  padding: '7px 18px',
                  background: !config.openClawPath ? 'rgba(0,200,212,0.2)' : 'var(--color-primary)',
                  color: !config.openClawPath ? 'var(--color-text-muted)' : '#0a0f1e',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: !config.openClawPath ? 'not-allowed' : 'pointer',
                  boxShadow: !config.openClawPath ? 'none' : 'var(--glow-primary)',
                }}
              >
                🤿 Dive In
              </button>
            </Tooltip>
          ) : (
            <Tooltip text="End the terminal session and return to the surface.">
              <button
                onClick={handleSurface}
                aria-label="End terminal session"
                style={{
                  padding: '7px 18px',
                  background: 'var(--color-warning)',
                  color: '#0a0f1e',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                🏊 Surface
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Terminal container */}
      <div style={{
        flex: 1,
        minHeight: 300,
        background: '#060d1a',
        border: '2px solid rgba(0, 200, 212, 0.2)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        position: 'relative',
        padding: 8,
      }}>
        <div
          ref={terminalRef}
          style={{ width: '100%', height: '100%' }}
        />
        {!isRunning && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 12,
            background: 'rgba(6,13,26,0.8)',
            zIndex: 1,
          }}>
            <span style={{ fontSize: 48 }}>🤿</span>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              Click &ldquo;Dive In&rdquo; above to start a terminal session.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
