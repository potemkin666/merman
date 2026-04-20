import React, { useState } from 'react'
import { LogPanel } from '../components/LogPanel'
import { Tooltip } from '../components/Tooltip'
import { HelpHint } from '../components/Tooltip'
import { useConfig } from '../hooks/useConfig'
import type { LogEntry } from '../../../shared/types'

interface TideLogProps {
  logs: LogEntry[]
}

type Filter = 'all' | LogEntry['level']

export const TideLog: React.FC<TideLogProps> = ({ logs }) => {
  const { config } = useConfig()
  const name = config.emissaryName || 'Azurel'
  const [filter, setFilter] = useState<Filter>('all')
  const [rawMode, setRawMode] = useState(false)

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
    <div className="screen-page--flex">
      <h1 className="screen-title" style={{ display: 'flex', alignItems: 'center' }}>
        Tide Log
        <HelpHint text={`This is the activity log. Everything the app and ${name} do gets recorded here. Think of it like a diary of events. If something goes wrong, this is the first place to look.`} />
      </h1>
      <p className="screen-subtitle">
        🌊 The currents of activity, recorded. Newest entries are at the bottom.
      </p>

      <div className="tide-log__toolbar">
        {(['all', 'info', 'warning', 'error'] as Filter[]).map((f) => (
          <Tooltip key={f} text={filterTooltips[f]}>
            <button
              onClick={() => setFilter(f)}
              aria-label={`Filter logs: ${f}`}
              aria-pressed={filter === f}
              className={`filter-btn ${filter === f ? 'filter-btn--active' : 'filter-btn--inactive'}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          </Tooltip>
        ))}
        <div className="tide-log__toolbar-right">
          <Tooltip text="Toggle between 'simple' mode (easy to read) and 'raw' mode (shows the exact text from the system — more technical).">
            <span className="tide-log__raw-label">Raw</span>
          </Tooltip>
          <div
            onClick={() => setRawMode((r) => !r)}
            role="switch"
            aria-checked={rawMode}
            aria-label="Toggle raw log mode"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setRawMode((r) => !r)
              }
            }}
            className="toggle-switch"
            style={{
              background: rawMode ? 'var(--color-primary)' : 'var(--color-surface)',
            }}
          >
            <div className="toggle-switch__knob" style={{
              background: rawMode ? '#0a0f1e' : 'var(--color-text-muted)',
              left: rawMode ? 18 : 2,
            }} />
          </div>
        </div>
      </div>

      <div className="tide-log__content">
        <LogPanel logs={logs} filter={filter} rawMode={rawMode} maxHeight="calc(100vh - 280px)" />
      </div>
    </div>
  )
}
