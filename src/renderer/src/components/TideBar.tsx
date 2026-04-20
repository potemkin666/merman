import React from 'react'
import type { ServiceStatus } from '../../../shared/types'

interface TideBarProps {
  status: ServiceStatus
}

const TIDE_LABELS: Record<ServiceStatus, string> = {
  idle: '🌙 Low tide — idle',
  running: '🌊 Rising tide — working',
  stopped: '🏖️ High tide — complete',
  error: '⛈️ Stormy waves — error',
}

function getTideState(status: ServiceStatus): string {
  switch (status) {
    case 'running': return 'working'
    case 'stopped': return 'complete'
    case 'error': return 'error'
    default: return 'idle'
  }
}

/**
 * Animated tide-line status bar for the Harbor screen.
 * Shows water level corresponding to service status:
 * - Low tide = idle
 * - Rising tide = working
 * - High tide = complete
 * - Stormy waves = error
 */
export const TideBar: React.FC<TideBarProps> = ({ status }) => {
  const tideState = getTideState(status)

  // Generate a simple SVG wave pattern for the top of the water
  const waveColor = status === 'error'
    ? 'rgba(232,93,93,0.5)'
    : status === 'stopped'
    ? 'rgba(45,212,160,0.5)'
    : 'rgba(0,200,212,0.5)'

  const waveSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='12' viewBox='0 0 120 12'%3E%3Cpath d='M0 6 Q15 0 30 6 Q45 12 60 6 Q75 0 90 6 Q105 12 120 6' fill='none' stroke='${encodeURIComponent(waveColor)}' stroke-width='2'/%3E%3C/svg%3E")`

  return (
    <div
      className={`tide-bar tide-bar--${tideState}`}
      role="status"
      aria-live="polite"
      aria-label={TIDE_LABELS[status]}
    >
      <div className="tide-bar__water">
        <div className="tide-bar__wave" style={{ backgroundImage: waveSvg }} />
      </div>
      <div className="tide-bar__label">
        {TIDE_LABELS[status]}
      </div>
    </div>
  )
}
