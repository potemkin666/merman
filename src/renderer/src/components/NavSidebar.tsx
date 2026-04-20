import React from 'react'

interface NavItem {
  id: string
  label: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'harbor', label: 'Harbor', icon: '🏠' },
  { id: 'setup', label: 'Setup', icon: '⚙️' },
  { id: 'dispatch', label: 'Dispatch', icon: '🔱' },
  { id: 'fishtank', label: 'Fishtank', icon: '🐠' },
  { id: 'tidelog', label: 'Tide Log', icon: '🌊' },
  { id: 'deepconfig', label: 'Deep Config', icon: '🔧' },
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
      background: 'var(--color-surface)',
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
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          title={item.label}
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
      ))}
    </nav>
  )
}
