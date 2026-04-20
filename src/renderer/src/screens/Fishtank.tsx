import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { ServiceStatus, TaskResult } from '../../../shared/types'
import { useIpc } from '../hooks/useIpc'
import { useConfig } from '../hooks/useConfig'
import { IPC_CHANNELS } from '../../../shared/ipc'
import { SeabedCanvas } from '../components/SeabedCanvas'
import {
  type Weather,
  type EmissaryAnimation,
  type Bubble,
  type Particle,
  deriveWeather,
  WEATHER_BACKGROUNDS,
  WEATHER_CAUSTIC_OPACITY,
  ANIMATIONS,
  ANIMATION_LABELS,
  ANIMATION_EMOJIS,
  getEmissaryStyle,
  getSayings,
  getStatusText,
  getClickResponse,
  spawnBubbles as spawnBubblesFromWeather,
  spawnParticles as spawnParticlesFromWeather,
  getBubbleColors,
  getParticleColor,
} from './fishtank'

interface DroppedPathInfo {
  path: string
  isDirectory: boolean
}

interface FishtankProps {
  status: ServiceStatus
  recentTasks?: TaskResult[]
  onWorkspacePathSet?: (path: string) => void
  onFilesAttached?: (paths: string[]) => void
}

export const Fishtank: React.FC<FishtankProps> = ({ status, recentTasks = [], onWorkspacePathSet, onFilesAttached }) => {
  const { invoke } = useIpc()
  const { config } = useConfig()
  const name = config.emissaryName || 'Azurel'
  const [animation, setAnimation] = useState<EmissaryAnimation>('floating')
  const [saying, setSaying] = useState('')
  const [sayingKey, setSayingKey] = useState(0)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [clickCount, setClickCount] = useState(0)
  const tankRef = useRef<HTMLDivElement>(null)
  const [tankSize, setTankSize] = useState({ width: 800, height: 420 })
  const [weather, setWeather] = useState<Weather>('calm')
  const [lightningFlash, setLightningFlash] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [catchAnimation, setCatchAnimation] = useState(false)
  const [catchMessage, setCatchMessage] = useState('')

  // Derive weather from status + recent tasks
  useEffect(() => {
    const w = deriveWeather(status, recentTasks)
    setWeather(w)
  }, [status, recentTasks])

  // Lightning flash effect for thunderstorm weather
  useEffect(() => {
    if (weather !== 'thunderstorm') return
    const flash = () => {
      setLightningFlash(true)
      setTimeout(() => setLightningFlash(false), 150)
    }
    // Flash immediately, then periodically
    flash()
    const interval = setInterval(() => {
      if (Math.random() < 0.4) flash()
    }, 2000 + Math.random() * 3000)
    return () => clearInterval(interval)
  }, [weather])

  // Golden shimmer fades back to calm after 60s
  useEffect(() => {
    if (weather === 'golden' || weather === 'stormy') {
      const timeout = setTimeout(() => setWeather('calm'), 60000)
      return () => clearTimeout(timeout)
    }
  }, [weather])

  // Reset click count after 20 seconds of no interaction
  useEffect(() => {
    if (clickCount === 0) return
    const t = setTimeout(() => setClickCount(0), 20000)
    return () => clearTimeout(t)
  }, [clickCount])

  const handleEmissaryClick = useCallback(() => {
    setClickCount(c => c + 1)
    const response = getClickResponse(status, recentTasks, clickCount)
    setSaying(response)
    setSayingKey(k => k + 1)
  }, [status, recentTasks, clickCount])

  // --- Drag-and-drop handlers ---
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)

    const files = e.dataTransfer?.files
    if (!files || files.length === 0) return

    // Collect the file paths from the drop event
    const paths: string[] = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      // Electron exposes `path` on File objects
      const filePath = (f as File & { path?: string }).path
      if (filePath) paths.push(filePath)
    }
    if (paths.length === 0) return

    // Trigger "catch" animation
    setCatchAnimation(true)
    setTimeout(() => setCatchAnimation(false), 1200)

    // Resolve file types via IPC
    try {
      const resolved = await invoke<DroppedPathInfo[]>(IPC_CHANNELS.RESOLVE_DROPPED_PATHS, paths)

      const directories = resolved.filter(r => r.isDirectory)
      const regularFiles = resolved.filter(r => !r.isDirectory)

      if (directories.length > 0 && onWorkspacePathSet) {
        // Use the first dropped directory as the workspace path
        onWorkspacePathSet(directories[0].path)
        const folderName = directories[0].path.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || 'folder'
        setCatchMessage(`📂 Caught! Workspace set to ${folderName}`)
        setSaying('*catches the folder expertly* Your new workspace, as commanded!')
        setSayingKey(k => k + 1)
      } else if (regularFiles.length > 0 && onFilesAttached) {
        onFilesAttached(regularFiles.map(r => r.path))
        const count = regularFiles.length
        setCatchMessage(`📎 Caught ${count} file${count > 1 ? 's' : ''}! Attached for your next dispatch.`)
        setSaying(count === 1
          ? '*snatches the file from the water* Got it! Ready for your next dispatch.'
          : `*gathers ${count} items from the current* All collected! Ready for dispatch.`)
        setSayingKey(k => k + 1)
      } else {
        setCatchMessage('🤔 Dropped, but nothing to do — try a folder or file!')
        setSaying('*reaches for it but misses* Hmm, I could not quite catch that one.')
        setSayingKey(k => k + 1)
      }
    } catch {
      setCatchMessage('❌ Could not process the dropped items.')
      setSaying('*fumbles* Something went wrong catching that...')
      setSayingKey(k => k + 1)
    }

    // Clear catch message after a few seconds
    setTimeout(() => setCatchMessage(''), 4000)
  }, [invoke, onWorkspacePathSet, onFilesAttached])

  // Cycle animations every 5–10 seconds
  useEffect(() => {
    const pick = () => {
      if (status === 'running') {
        const workAnims: EmissaryAnimation[] = ['thinking', 'examining-scroll', 'swimming', 'gazing', 'flexing']
        setAnimation(workAnims[Math.floor(Math.random() * workAnims.length)])
      } else {
        setAnimation(ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)])
      }
    }
    pick()
    const interval = setInterval(pick, 5000 + Math.random() * 5000)
    return () => clearInterval(interval)
  }, [status])

  // Cycle sayings every 4–8 seconds
  useEffect(() => {
    const pick = () => {
      const pool = getSayings(status)
      setSaying(pool[Math.floor(Math.random() * pool.length)])
      setSayingKey(k => k + 1)
    }
    pick()
    const interval = setInterval(pick, 4000 + Math.random() * 4000)
    return () => clearInterval(interval)
  }, [status])

  // Generate random bubbles — density varies with weather
  const refreshBubbles = useCallback(() => {
    setBubbles(spawnBubblesFromWeather(weather))
  }, [weather])

  // Floating light particles
  const refreshParticles = useCallback(() => {
    setParticles(spawnParticlesFromWeather())
  }, [])

  useEffect(() => {
    refreshBubbles()
    refreshParticles()
    const bInterval = setInterval(refreshBubbles, 7000)
    const pInterval = setInterval(refreshParticles, 10000)
    return () => { clearInterval(bInterval); clearInterval(pInterval) }
  }, [refreshBubbles, refreshParticles])

  // Track tank dimensions for seabed canvas
  useEffect(() => {
    const el = tankRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setTankSize({ width: Math.floor(width), height: Math.floor(height) })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const emissaryStyle = getEmissaryStyle(animation, status)

  return (
    <div className="fishtank-page">
      <h1 className="screen-title">
        The Fishtank
      </h1>
      <p className="screen-subtitle">
        🐠 Peer into the depths and see what {name} is up to.
        <span className="fishtank-drop-hint">
          Drop files or folders here — {name} will catch them!
        </span>
      </p>

      {/* Catch message toast */}
      {catchMessage && (
        <div className="fishtank-catch-toast">
          {catchMessage}
        </div>
      )}

      {/* The tank */}
      <div
        ref={tankRef}
        role="img"
        aria-label={`Fishtank: ${name} is ${ANIMATION_LABELS[animation].toLowerCase()}. Status: ${getStatusText(status)}. Weather: ${weather}. You can drag and drop files here.`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="fishtank-tank"
        style={{
        background: WEATHER_BACKGROUNDS[weather],
        borderColor: dragOver
          ? 'var(--color-accent)'
          : weather === 'thunderstorm' ? 'rgba(232,93,93,0.3)' : weather === 'golden' ? 'rgba(240,200,80,0.3)' : 'rgba(0, 200, 212, 0.2)',
        boxShadow: dragOver
          ? 'inset 0 0 80px rgba(201,162,39,0.12), 0 0 30px rgba(201,162,39,0.1)'
          : weather === 'thunderstorm'
          ? 'inset 0 0 100px rgba(232,93,93,0.08), 0 0 50px rgba(232,93,93,0.06)'
          : weather === 'golden'
          ? 'inset 0 0 100px rgba(240,200,80,0.08), 0 0 50px rgba(240,200,80,0.06)'
          : 'inset 0 0 100px rgba(0, 200, 212, 0.06), 0 0 50px rgba(0, 200, 212, 0.08)',
      }}>
        {/* Drag-over overlay */}
        {dragOver && (
          <div className="fishtank-drag-overlay">
            <div className="fishtank-drag-label">
              🎣 Drop here — {name} is ready to catch!
            </div>
          </div>
        )}

        {/* Catch animation overlay */}
        {catchAnimation && (
          <div className="fishtank-catch-overlay" />
        )}
        {/* Lightning flash overlay */}
        {lightningFlash && (
          <div className="fishtank-lightning" />
        )}

        {/* Caustic light overlays — opacity adjusts with weather */}
        <div className="fishtank-caustic fishtank-caustic-1" style={{ opacity: WEATHER_CAUSTIC_OPACITY[weather] }} />
        <div className="fishtank-caustic fishtank-caustic-2" style={{ opacity: WEATHER_CAUSTIC_OPACITY[weather] }} />
        <div className="fishtank-caustic fishtank-caustic-3" style={{ opacity: WEATHER_CAUSTIC_OPACITY[weather] }} />

        {/* Golden shimmer overlay — visible only during golden weather */}
        {weather === 'golden' && (
          <div className="fishtank-golden-shimmer" />
        )}

        {/* Turbulence overlay — stormy / thunderstorm distortion */}
        {(weather === 'stormy' || weather === 'thunderstorm') && (
          <div
            className="fishtank-turbulence"
            style={{
              background: weather === 'thunderstorm'
                ? 'radial-gradient(ellipse at 50% 50%, rgba(232,93,93,0.04) 0%, transparent 50%)'
                : 'radial-gradient(ellipse at 50% 50%, rgba(150,100,200,0.04) 0%, transparent 50%)',
            }}
          />
        )}

        {/* Light rays from surface — dimmed in storms */}
        <div
          className="fishtank-lightray fishtank-lightray-1"
          style={{
            background: weather === 'golden'
              ? 'linear-gradient(180deg, rgba(240,200,80,0.06), transparent)'
              : 'linear-gradient(180deg, rgba(0,200,212,0.04), transparent)',
            opacity: weather === 'stormy' || weather === 'thunderstorm' ? 0.2 : 1,
          }}
        />
        <div
          className="fishtank-lightray fishtank-lightray-2"
          style={{
            background: weather === 'golden'
              ? 'linear-gradient(180deg, rgba(240,200,80,0.04), transparent)'
              : 'linear-gradient(180deg, rgba(0,200,212,0.03), transparent)',
            opacity: weather === 'stormy' || weather === 'thunderstorm' ? 0.2 : 1,
          }}
        />

        {/* Floating light particles — color shifts with weather */}
        {particles.map(p => {
          const pColor = getParticleColor(weather)
          return (
            <div key={p.id} className="fishtank-particle" style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: pColor,
              boxShadow: `0 0 6px ${pColor}`,
              animationDuration: `${6 + p.size}s`,
              animationDelay: `${p.delay}s`,
            }} />
          )
        })}

        {/* Bubbles — appearance shifts with weather */}
        {bubbles.map(b => {
          const { color, bg, border, speed } = getBubbleColors(weather)
          return (
            <div key={b.id} className="fishtank-bubble" style={{
              left: `${b.x}%`,
              width: b.size,
              height: b.size,
              background: `radial-gradient(circle at 30% 30%, ${color}, ${bg})`,
              borderColor: border,
              animationDuration: `${speed + b.size * 0.3}s`,
              animationDelay: `${b.delay}s`,
            }} />
          )
        })}

        {/* Procedural seabed */}
        <SeabedCanvas width={tankSize.width} height={tankSize.height} seed={42} weather={weather} />

        {/* The Emissary — clickable for interaction */}
        <div
          onClick={handleEmissaryClick}
          role="button"
          tabIndex={0}
          aria-label={`Click ${name} to interact`}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleEmissaryClick() } }}
          className="fishtank-emissary"
          style={emissaryStyle}
        >
          <div className="fishtank-emissary-orb" style={{
            boxShadow: status === 'running'
              ? '0 0 50px rgba(0,200,212,0.3), 0 0 100px rgba(0,200,212,0.1)'
              : '0 0 25px rgba(0,200,212,0.12)',
          }}>
            {ANIMATION_EMOJIS[animation]}
          </div>
          <div className="fishtank-emissary-label">
            {ANIMATION_LABELS[animation]}
          </div>
        </div>

        {/* Speech bubble */}
        <div key={sayingKey} aria-live="polite" aria-label={`${name} says`} className="fishtank-speech">
          <p className="fishtank-speech-text" style={{
            fontStyle: saying.startsWith('*') ? 'italic' : 'normal',
            opacity: saying.startsWith('*') ? 0.85 : 1,
          }}>
            {saying}
          </p>
        </div>

        {/* Status bar */}
        <div role="status" aria-live="polite" className="fishtank-status-bar">
          <div className="fishtank-status-dot" style={{
            background: status === 'running' ? 'var(--color-success)' : status === 'error' ? 'var(--color-error)' : status === 'stopped' ? 'var(--color-warning)' : 'var(--color-text-muted)',
            boxShadow: status === 'running' ? '0 0 8px var(--color-success)' : 'none',
            animation: status === 'running' ? 'pulse 2s infinite' : 'none',
          }} />
          <span className="fishtank-status-text">
            {status === 'running' ? 'Working in the depths' : status === 'error' ? 'Troubled waters' : status === 'stopped' ? 'Resting at shore' : 'Awaiting command'}
          </span>
          <span className="fishtank-weather-label">
            {weather === 'calm' ? '☀️ clear' : weather === 'working' ? '🌊 active' : weather === 'stormy' ? '🌧️ stormy' : weather === 'golden' ? '✨ golden' : '⛈️ storm'}
          </span>
        </div>
      </div>
    </div>
  )
}
