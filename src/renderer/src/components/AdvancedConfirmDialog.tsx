import React from 'react'
import { Modal } from './Modal'
import { useConfig } from '../hooks/useConfig'

interface AdvancedConfirmDialogProps {
  open: boolean
  prompt: string
  openClawPath: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Confirmation dialog shown before dispatching a task in "Advanced Custom" mode.
 * Requires the user to explicitly acknowledge the lack of safety guardrails.
 */
export const AdvancedConfirmDialog: React.FC<AdvancedConfirmDialogProps> = ({
  open,
  prompt,
  openClawPath,
  onConfirm,
  onCancel,
}) => {
  const { config } = useConfig()
  const name = config.emissaryName || 'Azurel'
  return (
    <Modal open={open} title="⚠️ Advanced Custom — No Guardrails" onClose={onCancel}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Warning banner */}
        <div style={{
          background: 'rgba(232,93,93,0.1)',
          border: '1px solid rgba(232,93,93,0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
        }}>
          <p style={{ fontSize: 13, color: 'var(--color-error)', fontWeight: 600, marginBottom: 6 }}>
            ⚠️ This mode has no safety limits
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Advanced Custom gives {name} full control with no guardrails.
            The agent may execute arbitrary commands, modify files, or make
            network requests without restriction. Make sure you understand what
            your prompt is asking for before proceeding.
          </p>
        </div>

        {/* Full prompt */}
        <div>
          <label style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4, display: 'block' }}>
            Full prompt
          </label>
          <pre style={{
            fontSize: 12,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            color: 'var(--color-text)',
            background: 'var(--color-surface)',
            padding: 12,
            borderRadius: 'var(--radius-md)',
            maxHeight: 160,
            overflowY: 'auto',
            border: '1px solid var(--color-border)',
          }}>
            {prompt}
          </pre>
        </div>

        {/* Resolved path */}
        <div>
          <label style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4, display: 'block' }}>
            OpenClaw path (resolved)
          </label>
          <code style={{
            fontSize: 12,
            fontFamily: 'monospace',
            color: 'var(--color-primary)',
            background: 'var(--color-surface)',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            display: 'block',
            border: '1px solid var(--color-border)',
          }}>
            {openClawPath || '(not set — will use current directory)'}
          </code>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
          <button
            onClick={onCancel}
            aria-label="Cancel dispatch"
            style={{
              padding: '10px 20px',
              background: 'var(--color-surface)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            aria-label="Acknowledge and dispatch in advanced mode"
            style={{
              padding: '10px 20px',
              background: 'var(--color-error)',
              color: '#fff',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            I understand — Dispatch
          </button>
        </div>
      </div>
    </Modal>
  )
}
