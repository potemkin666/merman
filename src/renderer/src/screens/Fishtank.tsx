import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { ServiceStatus, TaskResult } from '../../../shared/types'
import { useIpc } from '../hooks/useIpc'
import { IPC_CHANNELS } from '../../../shared/ipc'
import { SeabedCanvas } from '../components/SeabedCanvas'

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

// --- Weather system ---
// Weather state derived from app state and recent task history

type Weather = 'calm' | 'working' | 'stormy' | 'golden' | 'thunderstorm'

function deriveWeather(status: ServiceStatus, recentTasks: TaskResult[]): Weather {
  // Thunderstorm: service crashed (status is error)
  if (status === 'error') return 'thunderstorm'

  // Working: actively running
  if (status === 'running') return 'working'

  // Check recent tasks for context
  const lastTask = recentTasks[0]
  if (lastTask) {
    // Golden: last task was successful and finished recently (within 60s)
    if (lastTask.status === 'done' && lastTask.finishedAt) {
      const ago = Date.now() - new Date(lastTask.finishedAt).getTime()
      if (ago < 60000) return 'golden'
    }
    // Stormy: last task failed and was recent
    if (lastTask.status === 'error' && lastTask.finishedAt) {
      const ago = Date.now() - new Date(lastTask.finishedAt).getTime()
      if (ago < 60000) return 'stormy'
    }
  }

  return 'calm'
}

const WEATHER_BACKGROUNDS: Record<Weather, string> = {
  calm: 'linear-gradient(180deg, #041020 0%, #081a35 25%, #0b2445 50%, #0d2a4a 75%, #0a1e38 100%)',
  working: 'linear-gradient(180deg, #041020 0%, #0a1e40 25%, #0e2d55 50%, #102f58 75%, #0c2240 100%)',
  stormy: 'linear-gradient(180deg, #0a0810 0%, #14101e 25%, #1a1428 50%, #1e1630 75%, #150e20 100%)',
  golden: 'linear-gradient(180deg, #0a0e10 0%, #1a2215 25%, #1e2818 50%, #22301a 75%, #18220e 100%)',
  thunderstorm: 'linear-gradient(180deg, #080408 0%, #100810 25%, #180c14 50%, #1a0a12 75%, #12060a 100%)',
}

const WEATHER_CAUSTIC_OPACITY: Record<Weather, number> = {
  calm: 1,
  working: 1.4,
  stormy: 0.3,
  golden: 0.8,
  thunderstorm: 0.15,
}

const WEATHER_BUBBLE_COUNT: Record<Weather, [number, number]> = {
  calm: [5, 6],
  working: [8, 8],
  stormy: [10, 10],
  golden: [4, 4],
  thunderstorm: [12, 8],
}

// --- Expanded idle animations ---
type EmissaryAnimation =
  | 'floating'
  | 'swimming'
  | 'thinking'
  | 'examining-scroll'
  | 'waving'
  | 'stretching'
  | 'gazing'
  | 'flirty'
  | 'fearful'
  | 'preening'
  | 'collecting-pearls'
  | 'chasing-fish'
  | 'flexing'
  | 'singing'
  | 'napping'
  | 'beckoning'
  | 'meditating'
  | 'juggling-shells'
  | 'posing'

const ANIMATIONS: EmissaryAnimation[] = [
  'floating', 'swimming', 'thinking', 'examining-scroll', 'waving',
  'stretching', 'gazing', 'flirty', 'fearful', 'preening',
  'collecting-pearls', 'chasing-fish', 'flexing', 'singing',
  'napping', 'beckoning', 'meditating', 'juggling-shells', 'posing',
]

const ANIMATION_LABELS: Record<EmissaryAnimation, string> = {
  floating: 'Drifting gently in the current',
  swimming: 'Gliding through the deep',
  thinking: 'Lost in thought',
  'examining-scroll': 'Studying an ancient scroll',
  waving: 'Waves at you through the glass',
  stretching: 'Stretching his fins',
  gazing: 'Gazing into the abyss',
  flirty: 'Notices you watching...',
  fearful: 'Something spooked him!',
  preening: 'Adjusting his scales',
  'collecting-pearls': 'Collecting pearls from the seabed',
  'chasing-fish': 'Chasing a curious little fish',
  flexing: 'Showing off a bit',
  singing: 'Humming an old sea melody',
  napping: 'Taking a little rest',
  beckoning: 'Come closer...',
  meditating: 'Finding inner calm',
  'juggling-shells': 'Playing with sea shells',
  posing: 'Striking a heroic pose',
}

const ANIMATION_EMOJIS: Record<EmissaryAnimation, string> = {
  floating: '\u{1F9DC}\u200D\u2642\uFE0F',
  swimming: '\u{1F3CA}\u200D\u2642\uFE0F',
  thinking: '\u{1F914}',
  'examining-scroll': '\u{1F4DC}',
  waving: '\u{1F44B}',
  stretching: '\u{1F9D8}\u200D\u2642\uFE0F',
  gazing: '\u{1F52D}',
  flirty: '\u{1F609}',
  fearful: '\u{1F628}',
  preening: '\u2728',
  'collecting-pearls': '\u{1FAAA}',
  'chasing-fish': '\u{1F420}',
  flexing: '\u{1F4AA}',
  singing: '\u{1F3B6}',
  napping: '\u{1F634}',
  beckoning: '\u{1F919}',
  meditating: '\u{1F9D8}\u200D\u2642\uFE0F',
  'juggling-shells': '\u{1F41A}',
  posing: '\u{1F9DC}\u200D\u2642\uFE0F',
}

// --- Fun things the emissary says ---
const IDLE_SAYINGS = [
  'The depths are quiet... for now.',
  'Hmm, I wonder what lies beyond the trench.',
  "These pearls won't sort themselves.",
  '*adjusts his coral bracelet*',
  'The currents whisper of tasks yet to come.',
  'A fine day beneath the waves.',
  'I could use a good scroll to read...',
  'The moonlight filters beautifully down here.',
  '*hums a sea shanty quietly*',
  'Patience is a virtue of the deep.',
  'The tide shifts... but I remain.',
  '*examines a passing jellyfish with curiosity*',
  'Have you ever seen bioluminescence up close? Stunning.',
  'Ready when you are, commander.',
  '*polishes his trident absent-mindedly*',
  'Oh, hello there. I see you watching.',
  '*winks at the glass*',
  'Do you like what you see?',
  '*flicks his tail playfully*',
  'Ah! Was that a shadow? ...No, just kelp.',
  '*nervously glances around*',
  'I once arm-wrestled a kraken. ...I lost.',
  '*flexes casually*',
  "Not that I'm showing off, but... look at these scales.",
  '*carefully arranges a collection of shells*',
  'This pearl? Found it myself. Just saying.',
  '*chases a tiny fish in circles*',
  'Come back here, little one!',
  'La la laaaa... *notices you* Oh! I was just... warming up.',
  '*stretches magnificently*',
  'I could float here forever. But duty calls. Eventually.',
  '*meditates serenely, one eye open to check if you are impressed*',
  'Ah, the peaceful art of doing nothing.',
  '*strikes a dramatic pose against the current*',
  'Paint me like one of your French fish.',
  '*beckons mysteriously*',
  'Come, let me tell you of the deep...',
  '*juggles three shells, drops one*',
  '...I meant to do that.',
  'You know, you have very kind eyes. For a surface-dweller.',
]

const WORKING_SAYINGS = [
  'Diving deeper... the answer is close.',
  'Following the current of thought...',
  'The waters churn with possibility.',
  'Sifting through the coral data...',
  'Almost... I can feel it in the currents.',
  'The abyss yields its secrets slowly.',
  'Processing... the deep takes time.',
  'Navigating through turbulent waters.',
  "I've found a promising current. Following it now.",
  'The pressure is immense, but I press on.',
  '*swims faster, determination in his eyes*',
  'The deep reveals what the surface cannot.',
  '*rolls up his sleeves (metaphorically — no sleeves)*',
  'I am giving this my full attention. Promise.',
  'Almost there... just a few more fathoms...',
  '*intense concentration face*',
]

const DONE_SAYINGS = [
  'Returned to shore with treasures.',
  'The depths have answered.',
  'Mission complete. The sea is calm.',
  'Surfacing now... results in hand.',
  'Another voyage concluded successfully.',
  '*emerges triumphantly from the deep*',
  'Ta-da! *presents results with a flourish*',
  'I told you I was good at this.',
]

const ERROR_SAYINGS = [
  'The waters are troubled...',
  'A storm in the deep. We must regroup.',
  'The currents turned hostile.',
  'I was pushed back. We should try again.',
  '*surfaces looking concerned*',
  "Don't worry — I've faced worse. Let me try again.",
  '*shakes water from his hair nervously*',
]

function getSayings(status: ServiceStatus): string[] {
  switch (status) {
    case 'running': return WORKING_SAYINGS
    case 'error': return ERROR_SAYINGS
    case 'stopped': return DONE_SAYINGS
    default: return IDLE_SAYINGS
  }
}

function getStatusText(status: ServiceStatus): string {
  switch (status) {
    case 'running': return 'working in the depths'
    case 'error': return 'troubled waters'
    case 'stopped': return 'resting at shore'
    default: return 'awaiting command'
  }
}

// --- Contextual click responses ---
// The emissary reacts differently based on status and history

function getClickResponse(status: ServiceStatus, recentTasks: TaskResult[], clickCount: number): string {
  const lastTask = recentTasks[0]
  const errorCount = recentTasks.filter(t => t.status === 'error').length
  const totalDone = recentTasks.filter(t => t.status === 'done').length

  // Dramatic refusal pool (rare)
  if (clickCount > 5) {
    const annoyed = [
      'You keep poking the glass. I am trying to concentrate.',
      '*sighs dramatically* Yes? Again?',
      'If you click me one more time I am going back to the Mariana Trench.',
      'I am a professional emissary, not a stress ball.',
      '*gives you The Look*',
      'Into the Mariana Trench? Again? I just got my scales polished...',
    ]
    return annoyed[Math.floor(Math.random() * annoyed.length)]
  }

  // Status-aware responses
  if (status === 'running') {
    const busy = [
      'I am working! Give me a moment...',
      '*holds up a fin* Almost there...',
      'Patience. The deep does not yield quickly.',
      'The currents are strong but I am stronger. Almost done.',
      'Do not rush the deep. Good things take time.',
    ]
    return busy[Math.floor(Math.random() * busy.length)]
  }

  if (status === 'error') {
    const troubled = [
      'Things got rough down there. Check the Tide Log for clues.',
      'I tried my best, truly. The sea was not kind this time.',
      '*looks sheepish* That... did not go as planned.',
      'Even the best emissaries have rough tides. Shall we try again?',
    ]
    return troubled[Math.floor(Math.random() * troubled.length)]
  }

  // History-aware responses
  if (lastTask && lastTask.status === 'error') {
    const afterError = [
      'Last time was rough... but I have recovered. Ready for another dive.',
      'I do not like to talk about what happened last time. Let us move forward.',
      '*nervously* So... that last task... shall we try something different?',
    ]
    return afterError[Math.floor(Math.random() * afterError.length)]
  }

  if (errorCount >= 3) {
    const manyErrors = [
      `${errorCount} failed tasks? The sea is testing us. Perhaps check the configuration?`,
      'I keep running into trouble. Maybe the Deep Config needs adjusting?',
      'The currents are hostile lately. Something might be misconfigured.',
    ]
    return manyErrors[Math.floor(Math.random() * manyErrors.length)]
  }

  if (totalDone >= 5) {
    const experienced = [
      `${totalDone} tasks completed! We make a good duo, you and I.`,
      'Another click? You must enjoy my company. The feeling is mutual.',
      'We have been through a lot together. I am proud of what we have accomplished.',
      `${totalDone} successful dives! I am getting quite fond of this arrangement.`,
    ]
    return experienced[Math.floor(Math.random() * experienced.length)]
  }

  if (totalDone === 0 && recentTasks.length === 0) {
    const fresh = [
      'Hello! I am your emissary. Click "Dispatch" in the sidebar to send me on a task!',
      'New around here? Head to Setup first, then Dispatch to give me something to do.',
      'I am ready for my first mission! Just say the word.',
      '*waves enthusiastically* A new commander! I will not disappoint.',
    ]
    return fresh[Math.floor(Math.random() * fresh.length)]
  }

  // Default click responses
  const defaultClicks = [
    'Yes? Did you need something?',
    '*looks up from his coral collection* Oh, hello!',
    'I am at your service. Head to Dispatch if you have a task.',
    'Click me again and I might just blush.',
    '*taps the glass from the inside* I see you!',
    'You know, most people just send tasks. You actually visit. I like that.',
    'The depths are calm. A perfect time to dispatch a new task.',
  ]
  return defaultClicks[Math.floor(Math.random() * defaultClicks.length)]
}

export const Fishtank: React.FC<FishtankProps> = ({ status, recentTasks = [], onWorkspacePathSet, onFilesAttached }) => {
  const { invoke } = useIpc()
  const [animation, setAnimation] = useState<EmissaryAnimation>('floating')
  const [saying, setSaying] = useState('')
  const [sayingKey, setSayingKey] = useState(0)
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; size: number; delay: number }>>([])
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([])
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
        setCatchMessage(`📂 Caught! Workspace set to ${directories[0].path.split('/').pop() || directories[0].path.split('\\').pop() || 'folder'}`)
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
  const spawnBubbles = useCallback(() => {
    const [base, extra] = WEATHER_BUBBLE_COUNT[weather]
    const count = base + Math.floor(Math.random() * extra)
    setBubbles(Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: 5 + Math.random() * 90,
      size: 3 + Math.random() * 14,
      delay: Math.random() * 4,
    })))
  }, [weather])

  // Floating light particles
  const spawnParticles = useCallback(() => {
    const count = 4 + Math.floor(Math.random() * 4)
    setParticles(Array.from({ length: count }, (_, i) => ({
      id: Date.now() + 1000 + i,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 5,
    })))
  }, [])

  useEffect(() => {
    spawnBubbles()
    spawnParticles()
    const bInterval = setInterval(spawnBubbles, 7000)
    const pInterval = setInterval(spawnParticles, 10000)
    return () => { clearInterval(bInterval); clearInterval(pInterval) }
  }, [spawnBubbles, spawnParticles])

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
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>
        The Fishtank
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, fontSize: 14 }}>
        🐠 Peer into the depths and see what the emissary is up to.
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', opacity: 0.7, marginLeft: 8 }}>
          Drop files or folders here — the emissary will catch them!
        </span>
      </p>

      {/* Catch message toast */}
      {catchMessage && (
        <div style={{
          background: 'var(--color-panel)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 16px',
          marginBottom: 12,
          fontSize: 13,
          color: 'var(--color-text)',
          animation: 'fadeInSaying 0.3s ease-out',
        }}>
          {catchMessage}
        </div>
      )}

      {/* The tank */}
      <div
        ref={tankRef}
        role="img"
        aria-label={`Fishtank: the emissary is ${ANIMATION_LABELS[animation].toLowerCase()}. Status: ${getStatusText(status)}. Weather: ${weather}. You can drag and drop files here.`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
        flex: 1,
        minHeight: 420,
        background: WEATHER_BACKGROUNDS[weather],
        border: dragOver
          ? '2px solid var(--color-accent)'
          : weather === 'thunderstorm' ? '2px solid rgba(232,93,93,0.3)' : weather === 'golden' ? '2px solid rgba(240,200,80,0.3)' : '2px solid rgba(0, 200, 212, 0.2)',
        borderRadius: 20,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: dragOver
          ? 'inset 0 0 80px rgba(201,162,39,0.12), 0 0 30px rgba(201,162,39,0.1)'
          : weather === 'thunderstorm'
          ? 'inset 0 0 100px rgba(232,93,93,0.08), 0 0 50px rgba(232,93,93,0.06)'
          : weather === 'golden'
          ? 'inset 0 0 100px rgba(240,200,80,0.08), 0 0 50px rgba(240,200,80,0.06)'
          : 'inset 0 0 100px rgba(0, 200, 212, 0.06), 0 0 50px rgba(0, 200, 212, 0.08)',
        transition: 'background 2s ease, border-color 0.3s ease, box-shadow 0.3s ease',
      }}>
        {/* Drag-over overlay */}
        {dragOver && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(201,162,39,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            pointerEvents: 'none',
          }}>
            <div style={{
              padding: '16px 28px',
              background: 'rgba(4,16,32,0.85)',
              border: '2px dashed var(--color-accent)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--color-accent)',
              fontSize: 16,
              fontWeight: 600,
              textAlign: 'center',
            }}>
              🎣 Drop here — the emissary is ready to catch!
            </div>
          </div>
        )}

        {/* Catch animation overlay */}
        {catchAnimation && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at 50% 45%, rgba(201,162,39,0.15) 0%, transparent 60%)',
            pointerEvents: 'none',
            zIndex: 15,
            animation: 'fadeInSaying 0.3s ease-out',
          }} />
        )}
        {/* Lightning flash overlay */}
        {lightningFlash && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(255,255,255,0.15)',
            pointerEvents: 'none',
            zIndex: 10,
          }} />
        )}

        {/* Caustic light overlays — opacity adjusts with weather */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 25% 15%, rgba(0,200,212,0.07) 0%, transparent 55%)', animation: 'caustic 8s ease-in-out infinite alternate', pointerEvents: 'none', opacity: WEATHER_CAUSTIC_OPACITY[weather], transition: 'opacity 2s' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 75% 35%, rgba(26,155,138,0.06) 0%, transparent 45%)', animation: 'caustic 13s ease-in-out infinite alternate-reverse', pointerEvents: 'none', opacity: WEATHER_CAUSTIC_OPACITY[weather], transition: 'opacity 2s' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 80%, rgba(0,100,150,0.05) 0%, transparent 40%)', animation: 'caustic 10s ease-in-out infinite alternate', pointerEvents: 'none', opacity: WEATHER_CAUSTIC_OPACITY[weather], transition: 'opacity 2s' }} />

        {/* Golden shimmer overlay — visible only during golden weather */}
        {weather === 'golden' && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 30%, rgba(240,200,80,0.08) 0%, transparent 60%)',
            animation: 'caustic 4s ease-in-out infinite alternate',
            pointerEvents: 'none',
          }} />
        )}

        {/* Turbulence overlay — stormy / thunderstorm distortion */}
        {(weather === 'stormy' || weather === 'thunderstorm') && (
          <div style={{
            position: 'absolute', inset: 0,
            background: weather === 'thunderstorm'
              ? 'radial-gradient(ellipse at 50% 50%, rgba(232,93,93,0.04) 0%, transparent 50%)'
              : 'radial-gradient(ellipse at 50% 50%, rgba(150,100,200,0.04) 0%, transparent 50%)',
            animation: 'caustic 2s ease-in-out infinite alternate',
            pointerEvents: 'none',
          }} />
        )}

        {/* Light rays from surface — dimmed in storms */}
        <div style={{
          position: 'absolute', top: 0, left: '20%', width: 80, height: '60%',
          background: weather === 'golden'
            ? 'linear-gradient(180deg, rgba(240,200,80,0.06), transparent)'
            : 'linear-gradient(180deg, rgba(0,200,212,0.04), transparent)',
          transform: 'skewX(-8deg)',
          pointerEvents: 'none',
          animation: 'lightRay 6s ease-in-out infinite alternate',
          opacity: weather === 'stormy' || weather === 'thunderstorm' ? 0.2 : 1,
          transition: 'opacity 2s',
        }} />
        <div style={{
          position: 'absolute', top: 0, left: '60%', width: 50, height: '50%',
          background: weather === 'golden'
            ? 'linear-gradient(180deg, rgba(240,200,80,0.04), transparent)'
            : 'linear-gradient(180deg, rgba(0,200,212,0.03), transparent)',
          transform: 'skewX(5deg)',
          pointerEvents: 'none',
          animation: 'lightRay 8s ease-in-out infinite alternate-reverse',
          opacity: weather === 'stormy' || weather === 'thunderstorm' ? 0.2 : 1,
          transition: 'opacity 2s',
        }} />

        {/* Floating light particles — color shifts with weather */}
        {particles.map(p => {
          const particleColor = weather === 'golden' ? 'rgba(240,200,80,0.3)' : weather === 'thunderstorm' ? 'rgba(232,93,93,0.2)' : weather === 'stormy' ? 'rgba(150,100,200,0.2)' : 'rgba(0,200,212,0.3)'
          return (
            <div key={p.id} style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: particleColor,
              boxShadow: `0 0 6px ${particleColor}`,
              animation: `particleFloat ${6 + p.size}s ease-in-out ${p.delay}s infinite`,
              pointerEvents: 'none',
            }} />
          )
        })}

        {/* Bubbles — appearance shifts with weather */}
        {bubbles.map(b => {
          const bubbleColor = weather === 'golden' ? 'rgba(240,200,80,0.4)' : weather === 'thunderstorm' ? 'rgba(232,93,93,0.3)' : weather === 'stormy' ? 'rgba(150,100,200,0.3)' : 'rgba(0,200,212,0.4)'
          const bubbleBg = weather === 'golden' ? 'rgba(240,200,80,0.08)' : weather === 'thunderstorm' ? 'rgba(232,93,93,0.06)' : weather === 'stormy' ? 'rgba(150,100,200,0.06)' : 'rgba(0,200,212,0.08)'
          const bubbleBorder = weather === 'golden' ? 'rgba(240,200,80,0.15)' : weather === 'thunderstorm' ? 'rgba(232,93,93,0.12)' : weather === 'stormy' ? 'rgba(150,100,200,0.12)' : 'rgba(0,200,212,0.15)'
          const speed = (weather === 'stormy' || weather === 'thunderstorm') ? 2.5 : 4
          return (
            <div key={b.id} style={{
              position: 'absolute',
              left: `${b.x}%`,
              bottom: -20,
              width: b.size,
              height: b.size,
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 30%, ${bubbleColor}, ${bubbleBg})`,
              border: `1px solid ${bubbleBorder}`,
              animation: `bubbleRise ${speed + b.size * 0.3}s ease-in ${b.delay}s infinite`,
              pointerEvents: 'none',
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
          aria-label="Click the emissary to interact"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleEmissaryClick() } }}
          style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          ...emissaryStyle,
        }}>
          <div style={{
            width: 130,
            height: 130,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, rgba(0,200,212,0.15), rgba(0,200,212,0.03))',
            border: '2px solid rgba(0,200,212,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 60,
            boxShadow: status === 'running'
              ? '0 0 50px rgba(0,200,212,0.3), 0 0 100px rgba(0,200,212,0.1)'
              : '0 0 25px rgba(0,200,212,0.12)',
            transition: 'box-shadow 1s',
          }}>
            {ANIMATION_EMOJIS[animation]}
          </div>
          <div style={{
            fontSize: 11,
            color: 'rgba(0,200,212,0.5)',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            fontWeight: 500,
            textAlign: 'center',
            maxWidth: 200,
          }}>
            {ANIMATION_LABELS[animation]}
          </div>
        </div>

        {/* Speech bubble */}
        <div key={sayingKey} aria-live="polite" aria-label="Emissary says" style={{
          position: 'absolute',
          top: 20,
          right: 20,
          maxWidth: 280,
          background: 'rgba(4,16,32,0.7)',
          border: '1px solid rgba(0,200,212,0.2)',
          borderRadius: '16px 16px 4px 16px',
          padding: '12px 16px',
          backdropFilter: 'blur(10px)',
          animation: 'fadeInSaying 0.5s ease-out',
        }}>
          <p style={{
            fontSize: 13,
            color: 'var(--color-text)',
            lineHeight: 1.6,
            fontStyle: saying.startsWith('*') ? 'italic' : 'normal',
            opacity: saying.startsWith('*') ? 0.85 : 1,
          }}>
            {saying}
          </p>
        </div>

        {/* Status bar */}
        <div role="status" aria-live="polite" style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 18px',
          background: 'rgba(4,16,32,0.6)',
          border: '1px solid rgba(0,200,212,0.12)',
          borderRadius: 20,
          backdropFilter: 'blur(6px)',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: status === 'running' ? 'var(--color-success)' : status === 'error' ? 'var(--color-error)' : status === 'stopped' ? 'var(--color-warning)' : 'var(--color-text-muted)',
            boxShadow: status === 'running' ? '0 0 8px var(--color-success)' : 'none',
            animation: status === 'running' ? 'pulse 2s infinite' : 'none',
          }} />
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
            {status === 'running' ? 'Working in the depths' : status === 'error' ? 'Troubled waters' : status === 'stopped' ? 'Resting at shore' : 'Awaiting command'}
          </span>
          <span style={{ fontSize: 10, color: 'rgba(0,200,212,0.35)', fontWeight: 400, marginLeft: 4 }}>
            {weather === 'calm' ? '☀️ clear' : weather === 'working' ? '🌊 active' : weather === 'stormy' ? '🌧️ stormy' : weather === 'golden' ? '✨ golden' : '⛈️ storm'}
          </span>
        </div>
      </div>
    </div>
  )
}

function getEmissaryStyle(animation: EmissaryAnimation, status: ServiceStatus): React.CSSProperties {
  const base: React.CSSProperties = { transition: 'all 1s ease-in-out' }
  if (status === 'running') return { ...base, animation: 'emissaryWorking 3s ease-in-out infinite' }
  const map: Partial<Record<EmissaryAnimation, string>> = {
    floating: 'emissaryFloat 4s ease-in-out infinite',
    swimming: 'emissarySwim 5s ease-in-out infinite',
    thinking: 'emissaryThink 3s ease-in-out infinite',
    waving: 'emissaryWave 1.5s ease-in-out 3',
    stretching: 'emissaryStretch 4s ease-in-out infinite',
    gazing: 'emissaryGaze 6s ease-in-out infinite',
    flirty: 'emissaryFlirty 3s ease-in-out infinite',
    fearful: 'emissaryFearful 0.8s ease-in-out 3',
    preening: 'emissaryFloat 5s ease-in-out infinite',
    'collecting-pearls': 'emissaryCollect 4s ease-in-out infinite',
    'chasing-fish': 'emissaryChase 3s ease-in-out infinite',
    flexing: 'emissaryFlex 2s ease-in-out 2',
    singing: 'emissaryFloat 4s ease-in-out infinite',
    napping: 'emissaryNap 5s ease-in-out infinite',
    beckoning: 'emissaryBeckon 2s ease-in-out infinite',
    meditating: 'emissaryFloat 6s ease-in-out infinite',
    'juggling-shells': 'emissaryJuggle 1.5s ease-in-out infinite',
    posing: 'emissaryPose 4s ease-in-out infinite',
    'examining-scroll': 'emissaryFloat 5s ease-in-out infinite',
  }
  return { ...base, animation: map[animation] || 'emissaryFloat 4s ease-in-out infinite' }
}
