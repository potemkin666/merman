import React from 'react'
import type { EmissaryAnimation, EmissaryEmotion } from '../screens/fishtank-lib'
import { ANIMATION_LABELS } from '../screens/fishtank-lib'
import type { ServiceStatus } from '../../../shared/types'

// Dynamically import all portrait PNGs from the emissary assets folder.
// Vite resolves these at build time — no manual list needed as portraits grow.
const _emotionModules = import.meta.glob('../assets/emissary/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const EMOTION_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(_emotionModules).map(([path, url]) => {
    const key = path.split('/').pop()!.replace('.png', '')
    return [key, url]
  }),
)

function getEmotionImage(emotion: EmissaryEmotion): string {
  return EMOTION_IMAGES[emotion] ?? EMOTION_IMAGES['idle'] ?? ''
}

interface EmissaryFigureProps {
  emotion: EmissaryEmotion
  animation: EmissaryAnimation
  status: ServiceStatus
  name: string
  style?: React.CSSProperties
  onClick?: () => void
  onKeyDown?: (e: React.KeyboardEvent) => void
}

export const EmissaryFigure: React.FC<EmissaryFigureProps> = ({
  emotion,
  animation,
  status,
  name,
  style,
  onClick,
  onKeyDown,
}) => {
  const src = getEmotionImage(emotion)
  const haloGlow = status === 'running'
    ? '0 0 60px rgba(0,200,212,0.35), 0 0 120px rgba(0,200,212,0.15)'
    : '0 0 30px rgba(0,200,212,0.18), 0 0 60px rgba(0,200,212,0.07)'

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Click ${name} to interact`}
      onKeyDown={onKeyDown}
      className="fishtank-emissary"
      style={style}
    >
      {/* Glow halo ring sits behind the character */}
      <div
        className="fishtank-emissary-halo"
        style={{ boxShadow: haloGlow }}
      />

      {/* Merman portrait PNG */}
      <img
        src={src}
        alt={`${name} — ${emotion}`}
        className="fishtank-emissary-img"
      />

      {/* Action label */}
      <div className="fishtank-emissary-label">
        {ANIMATION_LABELS[animation]}
      </div>
    </div>
  )
}
