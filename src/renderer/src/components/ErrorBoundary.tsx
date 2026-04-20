import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Catches render errors in child components and displays a themed
 * recovery screen instead of a blank white page.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: 40,
            textAlign: 'center',
            color: 'var(--color-text)',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }} aria-hidden="true">
            🌊
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p
            style={{
              fontSize: 13,
              color: 'var(--color-text-muted)',
              lineHeight: 1.6,
              maxWidth: 480,
              marginBottom: 20,
            }}
          >
            A wave knocked this screen over. The error has been logged below.
            You can try again or navigate to a different screen.
          </p>
          {this.state.error && (
            <pre
              style={{
                fontSize: 11,
                color: 'var(--color-error)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                maxWidth: 560,
                maxHeight: 120,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                marginBottom: 20,
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleRetry}
            aria-label="Try rendering this screen again"
            className="btn btn--primary"
          >
            🔄 Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
