import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type ThemeMode = 'deep' | 'surface' | 'auto'

interface ThemeContextValue {
  theme: ThemeMode
  setTheme: (t: ThemeMode) => void
  /** The resolved theme after system-preference evaluation (always 'deep' or 'surface') */
  resolved: 'deep' | 'surface'
}

const STORAGE_KEY = 'merman-theme'

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemPreference(): 'deep' | 'surface' {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
    return 'surface'
  }
  return 'deep'
}

function resolveTheme(mode: ThemeMode): 'deep' | 'surface' {
  if (mode === 'auto') return getSystemPreference()
  return mode
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeRaw] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'deep' || saved === 'surface' || saved === 'auto') return saved
    } catch { /* ignore */ }
    return 'deep'
  })
  const [resolved, setResolved] = useState<'deep' | 'surface'>(() => resolveTheme(theme))

  // Apply data-theme attribute to document root
  useEffect(() => {
    const r = resolveTheme(theme)
    setResolved(r)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Listen for system preference changes when in 'auto' mode
  useEffect(() => {
    if (theme !== 'auto') return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const handler = () => setResolved(getSystemPreference())
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeRaw(t)
    try { localStorage.setItem(STORAGE_KEY, t) } catch { /* ignore */ }
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
