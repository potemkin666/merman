import React from 'react'
import type { ServiceStatus } from '../../../shared/types'

interface StatusCardProps {
  status: ServiceStatus
  model?: string
  provider?: string
}

const STATUS_COLORS: Record<ServiceStatus, string> = {
  idle: 'var(--color-text-muted)',
  running: 'var(--color-success)',
  stopped: 'var(--color-warning)',
  error: 'var(--color-error)',
}

const STATUS_LABELS: Record<ServiceStatus, string> = {
  idle: 'Idle',
  running: 'Running',
  stopped: 'Stopped',
  error: 'Error',
}

export const StatusCard: React.FC<StatusCardProps> = ({ status, model, provider }) => {
  const color = STATUS_COLORS[status]
  return (
    <div style={{
      background: 'var(--color-panel)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}>
      <div style={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 8px ${color}`,
        animation: status === 'running' ? 'pulse 2s infinite' : 'none',
      }} />
      <div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>
          OpenClaw Status
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color }}>
          {STATUS_LABELS[status]}
        </div>
      </div>
      {(model || provider) && (
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          {provider && (
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{provider}</div>
          )}
          {model && (
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-accent)' }}>
              {model}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
