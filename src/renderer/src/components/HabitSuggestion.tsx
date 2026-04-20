import React, { useState, useEffect, useCallback } from 'react'
import { useIpc } from '../hooks/useIpc'
import { IPC_CHANNELS } from '../../../shared/ipc'
import type { HabitSuggestion as HabitSuggestionType } from '../../../shared/types'

interface HabitSuggestionProps {
  emissaryName: string
}

export const HabitSuggestion: React.FC<HabitSuggestionProps> = ({ emissaryName }) => {
  const { invoke } = useIpc()
  const [suggestion, setSuggestion] = useState<HabitSuggestionType | null>(null)
  const [dismissed, setDismissed] = useState(false)

  const fetchSuggestion = useCallback(async () => {
    try {
      const result = await invoke<HabitSuggestionType | null>(IPC_CHANNELS.GET_HABIT_SUGGESTION)
      setSuggestion(result)
      setDismissed(false)
    } catch {
      // Habit suggestion is best-effort
    }
  }, [invoke])

  // Fetch suggestion on mount and every 5 minutes
  useEffect(() => {
    fetchSuggestion()
    const interval = setInterval(fetchSuggestion, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchSuggestion])

  if (!suggestion || dismissed) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="habit-suggestion"
      style={{
        background: 'linear-gradient(135deg, rgba(0,200,212,0.08) 0%, rgba(201,162,39,0.06) 100%)',
        border: '1px solid rgba(0,200,212,0.15)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px 16px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        animation: 'fadeIn 0.6s ease-out',
      }}
    >
      <span style={{ fontSize: 20, flexShrink: 0 }}>🔮</span>
      <div style={{ flex: 1, fontSize: 13, lineHeight: 1.5, color: 'var(--color-text-muted)' }}>
        <strong style={{ color: 'var(--color-primary)' }}>{emissaryName} notices a pattern:</strong>{' '}
        {suggestion.text}
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss suggestion"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          fontSize: 16,
          padding: 4,
          opacity: 0.6,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  )
}
