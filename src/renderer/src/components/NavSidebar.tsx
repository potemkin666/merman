import React, { useState, useCallback } from 'react'
import { Tooltip } from './Tooltip'
import { useConfig } from '../hooks/useConfig'
import { useTheme } from '../hooks/useTheme'
import type { ThemeMode } from '../hooks/useTheme'

interface NavItem {
  id: string
  label: string
  icon: string
  tooltip: (name: string) => string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'harbor', label: 'Harbour', icon: '🏠', tooltip: () => 'Your home base — see if everything is running, start or stop the service, and view recent tasks.' },
  { id: 'setup', label: 'Setup', icon: '⚙️', tooltip: () => 'First time? This wizard walks you through getting OpenClaw ready. No terminal needed.' },
  { id: 'dispatch', label: 'Dispatch', icon: '🔱', tooltip: (n) => `Send a task to ${n}. Type what you want done in plain English.` },
  { id: 'fishtank', label: 'Fishtank', icon: '🐠', tooltip: (n) => `Peer into the depths! Watch ${n} swim around and see what he is up to.` },
  { id: 'deepdive', label: 'Deep Dive', icon: '🤿', tooltip: (n) => `A real terminal inside the app — ${n} narrates every command you run.` },
  { id: 'tidelog', label: 'Tide Log', icon: '🌊', tooltip: () => 'A log of everything that happened — in simple language. Great for seeing what went right or wrong.' },
  { id: 'deepconfig', label: 'Deep Config', icon: '🔧', tooltip: () => 'Change settings like file paths, AI model, API key, and saved presets. For when you need to tweak things.' },
]

interface ClickBubble {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
}

interface NavSidebarProps {
  active: string
  onNavigate: (id: string) => void
}

let bubbleIdCounter = 0

export const NavSidebar: React.FC<NavSidebarProps> = ({ active, onNavigate }) => {
  const { config } = useConfig()
  const { theme, setTheme } = useTheme()
  const name = config.emissaryName || 'Azurel'
  const [clickBubbles, setClickBubbles] = useState<ClickBubble[]>([])

  const cycleTheme = useCallback(() => {
    const order: ThemeMode[] = ['deep', 'surface', 'auto']
    const next = order[(order.indexOf(theme) + 1) % order.length]
    setTheme(next)
  }, [theme, setTheme])
  const spawnBubbles = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const navRect = e.currentTarget.closest('nav')?.getBoundingClientRect()
    if (!navRect) return

    // Spawn 5–8 tiny bubbles from the button center, relative to the nav
    const centerX = rect.left - navRect.left + rect.width / 2
    const centerY = rect.top - navRect.top + rect.height / 2
    const count = 5 + Math.floor(Math.random() * 4)
    const newBubbles: ClickBubble[] = []

    for (let i = 0; i < count; i++) {
      newBubbles.push({
        id: ++bubbleIdCounter,
        x: centerX + (Math.random() - 0.5) * 30,
        y: centerY + (Math.random() - 0.5) * 10,
        size: 3 + Math.random() * 5,
        duration: 0.8 + Math.random() * 0.6,
        delay: Math.random() * 0.15,
      })
    }

    setClickBubbles(prev => [...prev, ...newBubbles])

    // Clean up after animations finish
    setTimeout(() => {
      setClickBubbles(prev => prev.filter(b => !newBubbles.includes(b)))
    }, 1600)
  }, [])

  const handleClick = useCallback((id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    spawnBubbles(e)
    onNavigate(id)
  }, [spawnBubbles, onNavigate])

  return (
    <nav aria-label="Main navigation" style={{
      width: 80,
      minHeight: '100vh',
      background: 'var(--color-nav-bg)',
      backdropFilter: 'blur(12px)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 24,
      gap: 4,
      flexShrink: 0,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated water caustic overlay */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 40% 20%, rgba(0,200,212,0.06) 0%, transparent 60%)',
          animation: 'sidebarCaustic1 7s ease-in-out infinite alternate',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 60% 70%, rgba(26,155,138,0.05) 0%, transparent 50%)',
          animation: 'sidebarCaustic2 11s ease-in-out infinite alternate-reverse',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 30% 90%, rgba(0,100,180,0.04) 0%, transparent 45%)',
          animation: 'sidebarCaustic3 9s ease-in-out infinite alternate',
        }} />
      </div>
      <div style={{ marginBottom: 24, fontSize: 24, position: 'relative', zIndex: 1 }} aria-hidden="true">🔱</div>
      {NAV_ITEMS.map((item) => (
        <Tooltip key={item.id} text={item.tooltip(name)} position="right" maxWidth={240}>
          <button
            onClick={(e) => handleClick(item.id, e)}
            aria-label={`Navigate to ${item.label}`}
            aria-current={active === item.id ? 'page' : undefined}
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
              position: 'relative',
              zIndex: 1,
            }}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 500 }}>{item.label}</span>
          </button>
        </Tooltip>
      ))}

      {/* Click bubbles — tiny bubbles that float up when you click a nav button */}
      {clickBubbles.map(b => (
        <div
          key={b.id}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: b.x - b.size / 2,
            top: b.y,
            width: b.size,
            height: b.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, rgba(0,200,212,0.6), rgba(0,200,212,0.15))',
            border: '1px solid rgba(0,200,212,0.3)',
            pointerEvents: 'none',
            zIndex: 2,
            animation: `navBubbleRise ${b.duration}s ease-out ${b.delay}s both`,
          }}
        />
      ))}

      {/* Theme toggle — cycles between Deep / Surface / Auto */}
      <div style={{ marginTop: 'auto', paddingBottom: 16, position: 'relative', zIndex: 1 }}>
        <Tooltip
          text={theme === 'deep' ? 'Deep mode (dark). Click to switch to Surface mode.' : theme === 'surface' ? 'Surface mode (light). Click to switch to Auto.' : 'Auto — follows your system preference. Click to switch to Deep mode.'}
          position="right"
          maxWidth={220}
        >
          <button
            onClick={cycleTheme}
            aria-label={`Theme: ${theme}. Click to change.`}
            style={{
              width: 56,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              fontSize: 16,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <span aria-hidden="true">{theme === 'deep' ? '🌊' : theme === 'surface' ? '☀️' : '🔄'}</span>
          </button>
        </Tooltip>
      </div>
    </nav>
  )
}
