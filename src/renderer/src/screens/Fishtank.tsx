import React, { useState, useEffect, useCallback } from 'react'
import type { ServiceStatus, TaskResult } from '../../../shared/types'

interface FishtankProps {
  status: ServiceStatus
  recentTasks?: TaskResult[]
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

export const Fishtank: React.FC<FishtankProps> = ({ status, recentTasks = [] }) => {
  const [animation, setAnimation] = useState<EmissaryAnimation>('floating')
  const [saying, setSaying] = useState('')
  const [sayingKey, setSayingKey] = useState(0)
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; size: number; delay: number }>>([])
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([])
  const [clickCount, setClickCount] = useState(0)

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

  // Generate random bubbles
  const spawnBubbles = useCallback(() => {
    const count = 5 + Math.floor(Math.random() * 6)
    setBubbles(Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: 5 + Math.random() * 90,
      size: 3 + Math.random() * 14,
      delay: Math.random() * 4,
    })))
  }, [])

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

  const emissaryStyle = getEmissaryStyle(animation, status)

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>
        The Fishtank
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, fontSize: 14 }}>
        🐠 Peer into the depths and see what the emissary is up to.
      </p>

      {/* The tank */}
      <div
        role="img"
        aria-label={`Fishtank: the emissary is ${ANIMATION_LABELS[animation].toLowerCase()}. Status: ${getStatusText(status)}.`}
        style={{
        flex: 1,
        minHeight: 420,
        background: 'linear-gradient(180deg, #041020 0%, #081a35 25%, #0b2445 50%, #0d2a4a 75%, #0a1e38 100%)',
        border: '2px solid rgba(0, 200, 212, 0.2)',
        borderRadius: 20,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 100px rgba(0, 200, 212, 0.06), 0 0 50px rgba(0, 200, 212, 0.08)',
      }}>
        {/* Caustic light overlays */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 25% 15%, rgba(0,200,212,0.07) 0%, transparent 55%)', animation: 'caustic 8s ease-in-out infinite alternate', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 75% 35%, rgba(26,155,138,0.06) 0%, transparent 45%)', animation: 'caustic 13s ease-in-out infinite alternate-reverse', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 80%, rgba(0,100,150,0.05) 0%, transparent 40%)', animation: 'caustic 10s ease-in-out infinite alternate', pointerEvents: 'none' }} />

        {/* Light rays from surface */}
        <div style={{
          position: 'absolute', top: 0, left: '20%', width: 80, height: '60%',
          background: 'linear-gradient(180deg, rgba(0,200,212,0.04), transparent)',
          transform: 'skewX(-8deg)',
          pointerEvents: 'none',
          animation: 'lightRay 6s ease-in-out infinite alternate',
        }} />
        <div style={{
          position: 'absolute', top: 0, left: '60%', width: 50, height: '50%',
          background: 'linear-gradient(180deg, rgba(0,200,212,0.03), transparent)',
          transform: 'skewX(5deg)',
          pointerEvents: 'none',
          animation: 'lightRay 8s ease-in-out infinite alternate-reverse',
        }} />

        {/* Floating light particles */}
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'rgba(0,200,212,0.3)',
            boxShadow: '0 0 6px rgba(0,200,212,0.3)',
            animation: `particleFloat ${6 + p.size}s ease-in-out ${p.delay}s infinite`,
            pointerEvents: 'none',
          }} />
        ))}

        {/* Bubbles */}
        {bubbles.map(b => (
          <div key={b.id} style={{
            position: 'absolute',
            left: `${b.x}%`,
            bottom: -20,
            width: b.size,
            height: b.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, rgba(0,200,212,0.4), rgba(0,200,212,0.08))',
            border: '1px solid rgba(0,200,212,0.15)',
            animation: `bubbleRise ${4 + b.size * 0.3}s ease-in ${b.delay}s infinite`,
            pointerEvents: 'none',
          }} />
        ))}

        {/* Seabed */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, background: 'linear-gradient(180deg, transparent, rgba(8,18,35,0.95))', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 5, left: '8%', fontSize: 22, opacity: 0.3 }}>🪸</div>
        <div style={{ position: 'absolute', bottom: 8, left: '25%', fontSize: 14, opacity: 0.2 }}>🌿</div>
        <div style={{ position: 'absolute', bottom: 4, right: '12%', fontSize: 18, opacity: 0.25 }}>🐚</div>
        <div style={{ position: 'absolute', bottom: 10, left: '55%', fontSize: 12, opacity: 0.18 }}>🪨</div>
        <div style={{ position: 'absolute', bottom: 6, right: '35%', fontSize: 16, opacity: 0.2 }}>🪸</div>
        <div style={{ position: 'absolute', bottom: 12, left: '42%', fontSize: 10, opacity: 0.15 }}>✨</div>
        <div style={{ position: 'absolute', bottom: 2, left: '72%', fontSize: 13, opacity: 0.2 }}>🌊</div>

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
