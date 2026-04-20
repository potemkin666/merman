import React from 'react'

/**
 * Shown when the Electron preload bridge (electronAPI) is not available.
 * This happens if the app is opened in a regular browser, the preload script fails,
 * or Electron context isolation blocks the bridge.
 */
export const ElectronUnavailable: React.FC = () => {
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: 32,
        textAlign: 'center',
        background: 'var(--color-bg)',
      }}
    >
      <div style={{ fontSize: 64, marginBottom: 24 }} aria-hidden="true">🌊</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 12 }}>
        Connection to the deep was lost
      </h1>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', maxWidth: 480, lineHeight: 1.8, marginBottom: 24 }}>
        The app could not connect to its local system bridge. This usually means one of these things:
      </p>
      <ul style={{
        textAlign: 'left',
        fontSize: 13,
        color: 'var(--color-text-muted)',
        lineHeight: 2,
        maxWidth: 460,
        marginBottom: 32,
        paddingLeft: 20,
      }}>
        <li>You opened this page in a <strong style={{ color: 'var(--color-text)' }}>regular web browser</strong> instead of the Electron desktop app.</li>
        <li>The app&apos;s internal startup script <strong style={{ color: 'var(--color-text)' }}>failed to load</strong>.</li>
        <li>There is a <strong style={{ color: 'var(--color-text)' }}>version mismatch</strong> between app components.</li>
      </ul>
      <div style={{
        background: 'var(--color-panel)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 28px',
        maxWidth: 480,
      }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>
          💡 How to fix this:
        </p>
        <ol style={{
          fontSize: 12,
          color: 'var(--color-text-muted)',
          lineHeight: 2,
          paddingLeft: 18,
        }}>
          <li>Close this window completely.</li>
          <li>Re-launch OpenClaw Harbour from your desktop or start menu.</li>
          <li>If this keeps happening, try re-installing the app.</li>
        </ol>
      </div>
    </div>
  )
}
