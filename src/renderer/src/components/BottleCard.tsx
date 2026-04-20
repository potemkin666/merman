import React from 'react'
import type { TaskResult } from '../../../shared/types'

interface BottleCardProps {
  task: TaskResult
  onClick: () => void
}

function getBottleEmoji(status: TaskResult['status']): string {
  switch (status) {
    case 'done':
      return '🍾'
    case 'error':
      return '⚗️'
    case 'running':
      return '🧪'
    default:
      return '🫙'
  }
}

function getBottleLabel(status: TaskResult['status']): string {
  switch (status) {
    case 'done':
      return 'Returned to shore'
    case 'error':
      return 'Cracked in the deep'
    case 'running':
      return 'Still at sea'
    default:
      return 'Waiting to dispatch'
  }
}

function getBottleBorderColor(status: TaskResult['status']): string {
  switch (status) {
    case 'done':
      return 'rgba(45,212,160,0.3)'
    case 'error':
      return 'rgba(232,93,93,0.35)'
    case 'running':
      return 'rgba(0,200,212,0.3)'
    default:
      return 'var(--color-border)'
  }
}

function getBottleGlow(status: TaskResult['status']): string {
  switch (status) {
    case 'done':
      return '0 0 12px rgba(45,212,160,0.15)'
    case 'error':
      return '0 0 12px rgba(232,93,93,0.18)'
    case 'running':
      return '0 0 14px rgba(0,200,212,0.2)'
    default:
      return 'none'
  }
}

export const BottleCard: React.FC<BottleCardProps> = ({ task, onClick }) => {
  const emoji = getBottleEmoji(task.status)
  const label = getBottleLabel(task.status)
  const border = getBottleBorderColor(task.status)
  const glow = getBottleGlow(task.status)
  const isCracked = task.status === 'error'

  return (
    <button
      onClick={onClick}
      aria-label={`${label}: ${task.prompt.substring(0, 60)}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '16px 14px',
        background: isCracked
          ? 'rgba(232,93,93,0.06)'
          : 'rgba(15,32,64,0.6)',
        border: `1px solid ${border}`,
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        boxShadow: glow,
        width: 140,
        minHeight: 150,
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Crack overlay for error bottles */}
      {isCracked && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 6,
            right: 8,
            fontSize: 14,
            opacity: 0.5,
            transform: 'rotate(15deg)',
          }}
        >
          💔
        </div>
      )}

      {/* Bottle emoji */}
      <span
        aria-hidden="true"
        style={{
          fontSize: 36,
          filter: isCracked ? 'saturate(0.6)' : 'none',
        }}
      >
        {emoji}
      </span>

      {/* Status tag */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color:
            task.status === 'done'
              ? 'var(--color-success)'
              : task.status === 'error'
              ? 'var(--color-error)'
              : 'var(--color-primary)',
        }}
      >
        {label}
      </span>

      {/* Prompt preview */}
      <span
        style={{
          fontSize: 11,
          color: 'var(--color-text-muted)',
          lineHeight: 1.4,
          textAlign: 'center',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          wordBreak: 'break-word',
        }}
      >
        {task.prompt}
      </span>

      {/* Timestamp */}
      <span
        style={{
          fontSize: 9,
          color: 'var(--color-text-muted)',
          opacity: 0.7,
          marginTop: 'auto',
        }}
      >
        {new Date(task.startedAt).toLocaleTimeString()}
      </span>
    </button>
  )
}
