import React, { useState } from 'react'
import { LogPanel } from '../components/LogPanel'
import { Tooltip } from '../components/Tooltip'
import { HelpHint } from '../components/Tooltip'
import type { LogEntry } from '../../../shared/types'

interface TideLogProps {
  logs: LogEntry[]
}

type Filter = 'all' | LogEntry['level']

export const TideLog: React.FC<TideLogProps> = ({ logs }) => {
  const [filter, setFilter] = useState<Filter>('all')
  const [rawMode, setRawMode] = useState(false)

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 'var(--radius-sm)',
    background: active ? 'rgba(0,200,212,0.15)' : 'transparent',
    color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
    border: active ? '1px solid var(--color-border)' : '1px solid transparent',
    fontSize: 12,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    transition: 'all 0.15s',
  })

  const counts = {
    all: logs.length,
    info: logs.filter((l) => l.level === 'info').length,
    warning: logs.filter((l) => l.level === 'warning').length,
    error: logs.filter((l) => l.level === 'error').length,
  }

  const filterTooltips: Record<string, string> = {
    all: 'Show all log entries — info, warnings, and errors.',
    info: 'Show only informational messages — normal activity.',
    warning: 'Show only warnings — things that might need attention but are not critical.',
    error: 'Show only errors — things that went wrong and probably need fixing.',
  }

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8, display: 'flex', alignItems: 'center' }}>
        Tide Log
        <HelpHint text="This is the activity log. Everything the app and the emissary do gets recorded here. Think of it like a diary of events. If something goes wrong, this is the first place to look." />
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, fontSize: 14 }}>
        🌊 The currents of activity, recorded. Newest entries are at the bottom.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {(['all', 'info', 'warning', 'error'] as Filter[]).map((f) => (
          <Tooltip key={f} text={filterTooltips[f]}>
            <button onClick={() => setFilter(f)} style={filterBtnStyle(filter === f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          </Tooltip>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tooltip text="Toggle between 'simple' mode (easy to read) and 'raw' mode (shows the exact text from the system — more technical).">
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', cursor: 'help' }}>Raw</span>
          </Tooltip>
          <div
            onClick={() => setRawMode((r) => !r)}
            style={{
              width: 36,
              height: 20,
              borderRadius: 10,
              background: rawMode ? 'var(--color-primary)' : 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: rawMode ? '#0a0f1e' : 'var(--color-text-muted)',
              position: 'absolute',
              top: 2,
              left: rawMode ? 18 : 2,
              transition: 'left 0.2s',
            }} />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <LogPanel logs={logs} filter={filter} rawMode={rawMode} maxHeight="calc(100vh - 280px)" />
      </div>
    </div>
  )
}
