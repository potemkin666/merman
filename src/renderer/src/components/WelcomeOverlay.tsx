import React, { useState } from 'react'

interface WelcomeOverlayProps {
  onDismiss: () => void
}

const steps = [
  {
    emoji: '🔱',
    title: 'Welcome to OpenClaw Harbour',
    body: `This app helps you control OpenClaw — an AI agent that can do tasks on your computer.

Think of it like having a very capable assistant. You tell it what to do, it goes and does it, then comes back with results.

You don't need to know how to code. This app handles all the technical bits.`,
  },
  {
    emoji: '🧜‍♂️',
    title: 'Meet your emissary',
    body: `Your emissary is an AI agent — a program that can understand instructions in plain English, then carry them out.

"Agent" just means "a program that can make decisions and take actions on its own."

You write what you want. The emissary figures out how to do it.

(You can watch him work in the Fishtank!)`,
  },
  {
    emoji: '🗺️',
    title: 'Here is how this works',
    body: `1. First, run the Setup Wizard — it checks your computer is ready
2. Point the app at your OpenClaw folder
3. Hit "Summon" on the Harbour to start the service
4. Go to Dispatch and type what you want done
5. The emissary dives in and brings back results

That is it. No command line needed.`,
  },
  {
    emoji: '🏠',
    title: 'Quick tour of the sidebar',
    body: `🏠 Harbour — Your home base. See status, start/stop the service.
⚙️ Setup — Guided walkthrough to get everything ready.
🔱 Dispatch — Send tasks to the emissary.
🐠 Fishtank — Watch the emissary work (it is fun).
🌊 Tide Log — See what happened, in plain English.
🔧 Deep Config — Change settings if you need to.

Hover over any button for an explanation of what it does.`,
  },
]

export const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ onDismiss }) => {
  const [step, setStep] = useState(0)
  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(4, 8, 20, 0.92)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      animation: 'fadeInSaying 0.4s ease-out',
    }}>
      <div style={{
        maxWidth: 520,
        width: '90%',
        background: 'linear-gradient(135deg, rgba(13,26,46,0.98), rgba(15,32,64,0.98))',
        border: '1px solid rgba(0,200,212,0.3)',
        borderRadius: 20,
        padding: '40px 36px',
        boxShadow: '0 0 60px rgba(0,200,212,0.12), 0 20px 60px rgba(0,0,0,0.5)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Water shimmer */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, transparent, rgba(0,200,212,0.5), transparent)',
          animation: 'shimmerBar 3s ease-in-out infinite',
        }} />

        <div style={{ fontSize: 48, marginBottom: 16 }}>{current.emoji}</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 16 }}>
          {current.title}
        </h2>
        <p style={{
          color: 'var(--color-text)',
          fontSize: 14,
          lineHeight: 1.8,
          whiteSpace: 'pre-line',
          marginBottom: 28,
        }}>
          {current.body}
        </p>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i === step ? 'var(--color-primary)' : 'rgba(0,200,212,0.2)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={onDismiss}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Skip tour
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                ← Back
              </button>
            )}
            <button
              onClick={() => isLast ? onDismiss() : setStep(s => s + 1)}
              style={{
                padding: '10px 24px',
                background: 'var(--color-primary)',
                color: '#0a0f1e',
                borderRadius: 'var(--radius-md)',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'var(--glow-primary)',
              }}
            >
              {isLast ? '🌊 Dive In!' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
