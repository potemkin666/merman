import React from 'react'
import { Tooltip } from './Tooltip'

interface NavItem {
  id: string
  label: string
  icon: string
  tooltip: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'harbor', label: 'Harbour', icon: '🏠', tooltip: 'Your home base — see if everything is running, start or stop the service, and view recent tasks.' },
  { id: 'setup', label: 'Setup', icon: '⚙️', tooltip: 'First time? This wizard walks you through getting OpenClaw ready. No terminal needed.' },
  { id: 'dispatch', label: 'Dispatch', icon: '🔱', tooltip: 'Send a task to the emissary. Type what you want done in plain English.' },
  { id: 'fishtank', label: 'Fishtank', icon: '🐠', tooltip: 'Peer into the depths! Watch the emissary swim around and see what he is up to.' },
  { id: 'tidelog', label: 'Tide Log', icon: '🌊', tooltip: 'A log of everything that happened — in simple language. Great for seeing what went right or wrong.' },
  { id: 'deepconfig', label: 'Deep Config', icon: '🔧', tooltip: 'Change settings like file paths, AI model, API key, and saved presets. For when you need to tweak things.' },
]

interface NavSidebarProps {
  active: string
  onNavigate: (id: string) => void
}

export const NavSidebar: React.FC<NavSidebarProps> = ({ active, onNavigate }) => {
  return (
    <nav style={{
      width: 80,
      minHeight: '100vh',
      background: 'rgba(10, 20, 38, 0.9)',
      backdropFilter: 'blur(12px)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 24,
      gap: 4,
      flexShrink: 0,
    }}>
      <div style={{ marginBottom: 24, fontSize: 24 }}>🔱</div>
      {NAV_ITEMS.map((item) => (
        <Tooltip key={item.id} text={item.tooltip} position="right" maxWidth={240}>
          <button
            onClick={() => onNavigate(item.id)}
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-md)',
              background: active === item.id ? 'rgba(0, 200, 212, 0.15)' : 'transparent',
              border: active === item.id ? '1px solid var(--color-border)' : '1px solid transparent',
              color: active === item.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              fontSize: 20,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: active === item.id ? 'var(--glow-primary)' : 'none',
            }}
          >
            <span>{item.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 500 }}>{item.label}</span>
          </button>
        </Tooltip>
      ))}
    </nav>
  )
}
