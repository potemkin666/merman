import React, { useState, useEffect, useCallback } from 'react'
import type { ServiceStatus } from '../../../shared/types'

interface FishtankProps {
  status: ServiceStatus
}

// --- Idle animations the emissary cycles through ---
type EmissaryAnimation =
  | 'floating'
  | 'swimming'
  | 'thinking'
  | 'examining-scroll'
  | 'waving'
  | 'stretching'
  | 'gazing'

const ANIMATIONS: EmissaryAnimation[] = [
  'floating',
  'swimming',
  'thinking',
  'examining-scroll',
  'waving',
  'stretching',
  'gazing',
]

const ANIMATION_LABELS: Record<EmissaryAnimation, string> = {
  floating: 'Drifting gently in the current',
  swimming: 'Gliding through the deep',
  thinking: 'Lost in thought',
  'examining-scroll': 'Studying an ancient scroll',
  waving: 'Waves at you through the glass',
  stretching: 'Stretching his fins',
  gazing: 'Gazing into the abyss',
}

// --- Fun things the emissary says ---
const IDLE_SAYINGS = [
  'The depths are quiet... for now.',
  'Hmm, I wonder what lies beyond the trench.',
  'These pearls won\'t sort themselves.',
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
  'I\'ve found a promising current. Following it now.',
  'The pressure is immense, but I press on.',
  '*swims faster, determination in his eyes*',
  'The deep reveals what the surface cannot.',
]

const DONE_SAYINGS = [
  'Returned to shore with treasures.',
  'The depths have answered.',
  'Mission complete. The sea is calm.',
  'Surfacing now... results in hand.',
  'Another voyage concluded successfully.',
  '*emerges triumphantly from the deep*',
]

const ERROR_SAYINGS = [
  'The waters are troubled...',
  'A storm in the deep. We must regroup.',
  'The currents turned hostile.',
  'I was pushed back. We should try again.',
  '*surfaces looking concerned*',
]

function getSayings(status: ServiceStatus): string[] {
  switch (status) {
    case 'running': return WORKING_SAYINGS
    case 'error': return ERROR_SAYINGS
    case 'stopped': return DONE_SAYINGS
    default: return IDLE_SAYINGS
  }
}

export const Fishtank: React.FC<FishtankProps> = ({ status }) => {
  const [animation, setAnimation] = useState<EmissaryAnimation>('floating')
  const [saying, setSaying] = useState('')
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; size: number; delay: number }>>([])

  // Cycle animations every 6–12 seconds
  useEffect(() => {
    const pick = () => {
      if (status === 'running') {
        // When working, mostly thinking/examining
        const workAnims: EmissaryAnimation[] = ['thinking', 'examining-scroll', 'swimming', 'gazing']
        setAnimation(workAnims[Math.floor(Math.random() * workAnims.length)])
      } else {
        setAnimation(ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)])
      }
    }
    pick()
    const interval = setInterval(pick, 6000 + Math.random() * 6000)
    return () => clearInterval(interval)
  }, [status])

  // Cycle sayings every 5–10 seconds
  useEffect(() => {
    const pick = () => {
      const pool = getSayings(status)
      setSaying(pool[Math.floor(Math.random() * pool.length)])
    }
    pick()
    const interval = setInterval(pick, 5000 + Math.random() * 5000)
    return () => clearInterval(interval)
  }, [status])

  // Generate random bubbles
  const spawnBubbles = useCallback(() => {
    const count = 3 + Math.floor(Math.random() * 4)
    const newBubbles = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: 10 + Math.random() * 80,
      size: 4 + Math.random() * 12,
      delay: Math.random() * 3,
    }))
    setBubbles(newBubbles)
  }, [])

  useEffect(() => {
    spawnBubbles()
    const interval = setInterval(spawnBubbles, 8000)
    return () => clearInterval(interval)
  }, [spawnBubbles])

  const emissaryStyle = getEmissaryStyle(animation, status)

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>
        The Fishtank
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, fontSize: 14 }}>
        🐠 Peer into the depths. The emissary dwells here.
      </p>

      {/* The tank itself */}
      <div style={{
        flex: 1,
        minHeight: 400,
        background: 'linear-gradient(180deg, #061428 0%, #0a1e3d 30%, #0d2a4a 60%, #102040 100%)',
        border: '2px solid rgba(0, 200, 212, 0.25)',
        borderRadius: 'var(--radius-lg)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 80px rgba(0, 200, 212, 0.08), 0 0 40px rgba(0, 200, 212, 0.1)',
      }}>
        {/* Caustic light overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 30% 20%, rgba(0,200,212,0.06) 0%, transparent 60%)',
          animation: 'caustic 8s ease-in-out infinite alternate',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 70% 40%, rgba(26,155,138,0.05) 0%, transparent 50%)',
          animation: 'caustic 12s ease-in-out infinite alternate-reverse',
          pointerEvents: 'none',
        }} />

        {/* Bubbles */}
        {bubbles.map((b) => (
          <div
            key={b.id}
            style={{
              position: 'absolute',
              left: `${b.x}%`,
              bottom: -20,
              width: b.size,
              height: b.size,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, rgba(0,200,212,0.4), rgba(0,200,212,0.1))',
              border: '1px solid rgba(0,200,212,0.2)',
              animation: `bubbleRise ${4 + b.size * 0.3}s ease-in ${b.delay}s infinite`,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Seabed hints */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          background: 'linear-gradient(180deg, transparent, rgba(15,32,64,0.9))',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: 8,
          left: '10%',
          fontSize: 20,
          opacity: 0.3,
          filter: 'blur(0.5px)',
        }}>🪸</div>
        <div style={{
          position: 'absolute',
          bottom: 6,
          right: '15%',
          fontSize: 16,
          opacity: 0.25,
          filter: 'blur(0.5px)',
        }}>🐚</div>
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: '55%',
          fontSize: 14,
          opacity: 0.2,
        }}>🪨</div>

        {/* The Emissary */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          ...emissaryStyle,
        }}>
          {/* Emissary avatar area */}
          <div style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, rgba(0,200,212,0.2), rgba(0,200,212,0.05))',
            border: '2px solid rgba(0,200,212,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 56,
            boxShadow: status === 'running'
              ? '0 0 40px rgba(0,200,212,0.3), 0 0 80px rgba(0,200,212,0.1)'
              : '0 0 20px rgba(0,200,212,0.15)',
            transition: 'box-shadow 0.8s',
          }}>
            {getEmissaryEmoji(animation)}
          </div>

          {/* Animation label */}
          <div style={{
            fontSize: 11,
            color: 'rgba(0,200,212,0.6)',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            fontWeight: 500,
          }}>
            {ANIMATION_LABELS[animation]}
          </div>
        </div>

        {/* Speech bubble */}
        <div style={{
          position: 'absolute',
          top: 24,
          right: 24,
          maxWidth: 260,
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(0,200,212,0.2)',
          borderRadius: '16px 16px 4px 16px',
          padding: '12px 16px',
          backdropFilter: 'blur(8px)',
          animation: 'fadeInSaying 0.6s ease-out',
        }}>
          <p style={{
            fontSize: 13,
            color: 'var(--color-text)',
            lineHeight: 1.5,
            fontStyle: saying.startsWith('*') ? 'italic' : 'normal',
            opacity: saying.startsWith('*') ? 0.8 : 1,
          }}>
            {saying}
          </p>
        </div>

        {/* Status indicator */}
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 16px',
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(0,200,212,0.15)',
          borderRadius: 20,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: status === 'running' ? 'var(--color-success)'
              : status === 'error' ? 'var(--color-error)'
              : status === 'stopped' ? 'var(--color-warning)'
              : 'var(--color-text-muted)',
            boxShadow: status === 'running' ? '0 0 8px var(--color-success)' : 'none',
            animation: status === 'running' ? 'pulse 2s infinite' : 'none',
          }} />
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
            {status === 'running' ? 'Working in the depths'
              : status === 'error' ? 'Troubled waters'
              : status === 'stopped' ? 'Resting at shore'
              : 'Awaiting command'}
          </span>
        </div>
      </div>
    </div>
  )
}

function getEmissaryEmoji(animation: EmissaryAnimation): string {
  switch (animation) {
    case 'thinking': return '🧜‍♂️'
    case 'examining-scroll': return '📜'
    case 'waving': return '👋'
    case 'swimming': return '🏊‍♂️'
    case 'stretching': return '🧜‍♂️'
    case 'gazing': return '🔱'
    default: return '🧜‍♂️'
  }
}

function getEmissaryStyle(animation: EmissaryAnimation, status: ServiceStatus): React.CSSProperties {
  const base: React.CSSProperties = {
    transition: 'all 1.2s ease-in-out',
  }

  if (status === 'running') {
    return {
      ...base,
      animation: 'emissaryWorking 3s ease-in-out infinite',
    }
  }

  switch (animation) {
    case 'floating':
      return { ...base, animation: 'emissaryFloat 4s ease-in-out infinite' }
    case 'swimming':
      return { ...base, animation: 'emissarySwim 5s ease-in-out infinite' }
    case 'thinking':
      return { ...base, animation: 'emissaryThink 3s ease-in-out infinite' }
    case 'waving':
      return { ...base, animation: 'emissaryWave 1.5s ease-in-out 3' }
    case 'stretching':
      return { ...base, animation: 'emissaryStretch 4s ease-in-out infinite' }
    case 'gazing':
      return { ...base, animation: 'emissaryGaze 6s ease-in-out infinite' }
    case 'examining-scroll':
      return { ...base, animation: 'emissaryFloat 5s ease-in-out infinite' }
    default:
      return { ...base, animation: 'emissaryFloat 4s ease-in-out infinite' }
  }
}
