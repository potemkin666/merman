import React, { useEffect, useRef } from 'react'
import type { LogEntry } from '../../../shared/types'

interface LogPanelProps {
  logs: LogEntry[]
  filter?: LogEntry['level'] | 'all'
  rawMode?: boolean
  maxHeight?: string
}

const LEVEL_COLORS: Record<LogEntry['level'], string> = {
  info: 'var(--color-primary)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
}

export const LogPanel: React.FC<LogPanelProps> = ({
  logs,
  filter = 'all',
  rawMode = false,
  maxHeight = '300px',
}) => {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const filtered = filter === 'all' ? logs : logs.filter((l) => l.level === filter)

  return (
    <div role="log" aria-label="Activity log" aria-live="polite" style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      overflowY: 'auto',
      maxHeight,
      fontFamily: 'monospace',
      fontSize: 12,
    }}>
      {filtered.length === 0 ? (
        <div style={{ padding: 16, color: 'var(--color-text-muted)', textAlign: 'center' }}>
          No logs yet...
        </div>
      ) : (
        filtered.map((log) => (
          <div key={log.id} style={{
            padding: '6px 12px',
            borderBottom: '1px solid rgba(0,200,212,0.05)',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
          }}>
            <span style={{ color: 'var(--color-text-muted)', flexShrink: 0, fontSize: 10 }}>
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span style={{
              color: LEVEL_COLORS[log.level],
              flexShrink: 0,
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              width: 52,
            }}>
              {log.level}
            </span>
            <span style={{ color: 'var(--color-text)', wordBreak: 'break-all' }}>
              {rawMode ? log.raw : log.message}
            </span>
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  )
}
