import React, { useState, useRef, useEffect, useId } from 'react'

interface TooltipProps {
  text: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  maxWidth?: number
}

export const Tooltip: React.FC<TooltipProps> = ({
  text,
  children,
  position = 'top',
  maxWidth = 260,
}) => {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const tooltipId = useId()

  useEffect(() => {
    if (visible && triggerRef.current && tipRef.current) {
      const tr = triggerRef.current.getBoundingClientRect()
      const tp = tipRef.current.getBoundingClientRect()
      let top = 0
      let left = 0

      switch (position) {
        case 'top':
          top = tr.top - tp.height - 8
          left = tr.left + tr.width / 2 - tp.width / 2
          break
        case 'bottom':
          top = tr.bottom + 8
          left = tr.left + tr.width / 2 - tp.width / 2
          break
        case 'left':
          top = tr.top + tr.height / 2 - tp.height / 2
          left = tr.left - tp.width - 8
          break
        case 'right':
          top = tr.top + tr.height / 2 - tp.height / 2
          left = tr.right + 8
          break
      }

      // Keep within viewport
      if (left < 8) left = 8
      if (left + tp.width > window.innerWidth - 8) left = window.innerWidth - tp.width - 8
      if (top < 8) top = 8

      setCoords({ top, left })
    }
  }, [visible, position])

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        aria-describedby={visible ? tooltipId : undefined}
        style={{ display: 'inline-flex' }}
      >
        {children}
      </span>
      {visible && (
        <div
          ref={tipRef}
          id={tooltipId}
          role="tooltip"
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            maxWidth,
            padding: '10px 14px',
            background: 'rgba(6, 20, 40, 0.95)',
            border: '1px solid rgba(0, 200, 212, 0.3)',
            borderRadius: 10,
            color: 'var(--color-text)',
            fontSize: 12,
            lineHeight: 1.6,
            zIndex: 9999,
            pointerEvents: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 15px rgba(0,200,212,0.1)',
            backdropFilter: 'blur(12px)',
            animation: 'tooltipIn 0.15s ease-out',
          }}
        >
          {text}
        </div>
      )}
    </>
  )
}

/** Small help icon "?" that shows a tooltip on hover */
export const HelpHint: React.FC<{ text: string; position?: TooltipProps['position'] }> = ({
  text,
  position = 'right',
}) => (
  <Tooltip text={text} position={position}>
    <span
      role="img"
      aria-label="Help"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: 'rgba(0,200,212,0.15)',
        border: '1px solid rgba(0,200,212,0.3)',
        color: 'var(--color-primary)',
        fontSize: 10,
        fontWeight: 700,
        cursor: 'help',
        marginLeft: 6,
        flexShrink: 0,
      }}
    >
      ?
    </span>
  </Tooltip>
)
