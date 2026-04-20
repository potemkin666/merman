import React from 'react'
import type { EmissaryAnimation, EmissaryEmotion } from '../screens/fishtank-lib'
import { ANIMATION_LABELS } from '../screens/fishtank-lib'
import type { ServiceStatus } from '../../../shared/types'

import laughingImg from '../assets/emissary/laughing.png'
import wavingImg from '../assets/emissary/waving.png'
import cryingImg from '../assets/emissary/crying.png'
import smugImg from '../assets/emissary/smug.png'

const EMOTION_IMAGES: Record<EmissaryEmotion, string> = {
  laughing: laughingImg,
  waving: wavingImg,
  crying: cryingImg,
  smug: smugImg,
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
  const src = EMOTION_IMAGES[emotion]
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
