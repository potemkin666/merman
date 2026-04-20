import React, { useRef, useEffect, useCallback } from 'react'

/** Procedurally generated underwater seabed using HTML5 Canvas. */

interface SeabedItem {
  x: number
  type: 'coral' | 'kelp' | 'rock' | 'bioluminescent' | 'shell' | 'anemone'
  size: number
  hue: number
  sway: number
  swaySpeed: number
}

interface Creature {
  x: number
  y: number
  dx: number
  dy: number
  type: 'fish' | 'jellyfish' | 'seahorse'
  size: number
  hue: number
  phase: number
}

function seedRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateSeabed(width: number, rand: () => number): SeabedItem[] {
  const items: SeabedItem[] = []
  const count = Math.floor(width / 40) + Math.floor(rand() * 8)
  for (let i = 0; i < count; i++) {
    const types: SeabedItem['type'][] = ['coral', 'kelp', 'rock', 'bioluminescent', 'shell', 'anemone']
    const weights = [0.25, 0.25, 0.15, 0.15, 0.1, 0.1]
    let r = rand()
    let type: SeabedItem['type'] = 'coral'
    for (let j = 0; j < types.length; j++) {
      r -= weights[j]
      if (r <= 0) { type = types[j]; break }
    }
    items.push({
      x: rand() * width,
      type,
      size: 8 + rand() * 20,
      hue: type === 'bioluminescent' ? 140 + rand() * 80 : 160 + rand() * 40,
      sway: rand() * Math.PI * 2,
      swaySpeed: 0.3 + rand() * 0.7,
    })
  }
  return items.sort((a, b) => a.x - b.x)
}

function generateCreatures(width: number, height: number, rand: () => number): Creature[] {
  const count = 2 + Math.floor(rand() * 3)
  return Array.from({ length: count }, () => {
    const types: Creature['type'][] = ['fish', 'fish', 'fish', 'jellyfish', 'seahorse']
    return {
      x: rand() * width,
      y: 40 + rand() * (height - 120),
      dx: (rand() - 0.5) * 0.6,
      dy: (rand() - 0.5) * 0.15,
      type: types[Math.floor(rand() * types.length)],
      size: 4 + rand() * 8,
      hue: rand() * 360,
      phase: rand() * Math.PI * 2,
    }
  })
}

function drawCoral(ctx: CanvasRenderingContext2D, x: number, baseY: number, size: number, hue: number, swayOffset: number): void {
  const branches = 3 + Math.floor(size / 8)
  ctx.save()
  ctx.translate(x, baseY)
  for (let i = 0; i < branches; i++) {
    const angle = -Math.PI / 2 + (i - branches / 2) * 0.3 + Math.sin(swayOffset + i) * 0.05
    const len = size * (0.6 + (i % 2) * 0.4)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    const tipX = Math.cos(angle) * len
    const tipY = Math.sin(angle) * len
    ctx.quadraticCurveTo(tipX * 0.3, tipY * 0.5, tipX, tipY)
    ctx.strokeStyle = `hsla(${hue}, 60%, 45%, 0.6)`
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.stroke()
    // Blob at tip
    ctx.beginPath()
    ctx.arc(tipX, tipY, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${hue}, 70%, 55%, 0.5)`
    ctx.fill()
  }
  ctx.restore()
}

function drawKelp(ctx: CanvasRenderingContext2D, x: number, baseY: number, size: number, hue: number, swayOffset: number): void {
  const segments = 5 + Math.floor(size / 5)
  const segLen = size / segments * 1.5
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(x, baseY)
  let cx = x
  let cy = baseY
  for (let i = 0; i < segments; i++) {
    const sway = Math.sin(swayOffset + i * 0.5) * (3 + i * 0.8)
    cx += sway * 0.3
    cy -= segLen
    ctx.lineTo(cx + sway, cy)
  }
  ctx.strokeStyle = `hsla(${hue - 30}, 55%, 35%, 0.5)`
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.stroke()
  // Leaf blobs along stem
  for (let i = 2; i < segments; i += 2) {
    const lx = x + Math.sin(swayOffset + i * 0.5) * (3 + i * 0.8) * 0.3
    const ly = baseY - segLen * i
    ctx.beginPath()
    ctx.ellipse(lx + (i % 4 === 0 ? -5 : 5), ly, 6, 3, (i % 4 === 0 ? -0.3 : 0.3), 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${hue - 20}, 50%, 40%, 0.35)`
    ctx.fill()
  }
  ctx.restore()
}

function drawRock(ctx: CanvasRenderingContext2D, x: number, baseY: number, size: number): void {
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(x, baseY - size * 0.3, size * 0.7, size * 0.45, 0, 0, Math.PI * 2)
  const g = ctx.createRadialGradient(x, baseY - size * 0.3, 0, x, baseY - size * 0.3, size * 0.7)
  g.addColorStop(0, 'rgba(60,70,90,0.5)')
  g.addColorStop(1, 'rgba(30,40,55,0.3)')
  ctx.fillStyle = g
  ctx.fill()
  ctx.restore()
}

function drawBioluminescent(ctx: CanvasRenderingContext2D, x: number, baseY: number, size: number, hue: number, swayOffset: number): void {
  const petals = 4 + Math.floor(size / 6)
  ctx.save()
  ctx.translate(x, baseY)
  // Stem
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(Math.sin(swayOffset) * 2, -size * 0.6)
  ctx.strokeStyle = `hsla(${hue}, 50%, 35%, 0.4)`
  ctx.lineWidth = 1.5
  ctx.stroke()
  // Glow
  const gx = Math.sin(swayOffset) * 2
  const gy = -size * 0.6
  ctx.beginPath()
  ctx.arc(gx, gy, size * 0.3, 0, Math.PI * 2)
  ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${0.15 + Math.sin(swayOffset * 2) * 0.1})`
  ctx.shadowColor = `hsla(${hue}, 90%, 65%, 0.5)`
  ctx.shadowBlur = 12
  ctx.fill()
  ctx.shadowBlur = 0
  // Petals
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2 + swayOffset * 0.2
    const px = gx + Math.cos(angle) * size * 0.2
    const py = gy + Math.sin(angle) * size * 0.15
    ctx.beginPath()
    ctx.arc(px, py, 1.5, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${hue}, 85%, 70%, 0.6)`
    ctx.fill()
  }
  ctx.restore()
}

function drawShell(ctx: CanvasRenderingContext2D, x: number, baseY: number, size: number, hue: number): void {
  ctx.save()
  ctx.translate(x, baseY - size * 0.2)
  ctx.beginPath()
  ctx.ellipse(0, 0, size * 0.4, size * 0.25, 0, Math.PI, Math.PI * 2)
  ctx.fillStyle = `hsla(${hue + 40}, 40%, 55%, 0.35)`
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(0, 0, size * 0.35, size * 0.15, 0, 0, Math.PI)
  ctx.fillStyle = `hsla(${hue + 50}, 30%, 45%, 0.25)`
  ctx.fill()
  ctx.restore()
}

function drawAnemone(ctx: CanvasRenderingContext2D, x: number, baseY: number, size: number, hue: number, swayOffset: number): void {
  const tendrils = 6 + Math.floor(size / 4)
  ctx.save()
  ctx.translate(x, baseY)
  // Base
  ctx.beginPath()
  ctx.ellipse(0, -2, size * 0.3, 4, 0, 0, Math.PI * 2)
  ctx.fillStyle = `hsla(${hue + 60}, 50%, 40%, 0.4)`
  ctx.fill()
  // Tendrils
  for (let i = 0; i < tendrils; i++) {
    const spread = (i - tendrils / 2) * (size * 0.06)
    const sway = Math.sin(swayOffset + i * 0.4) * 3
    ctx.beginPath()
    ctx.moveTo(spread, -2)
    ctx.quadraticCurveTo(spread + sway, -size * 0.5, spread + sway * 1.5, -size * 0.8)
    ctx.strokeStyle = `hsla(${hue + 70}, 55%, 55%, 0.35)`
    ctx.lineWidth = 1.2
    ctx.lineCap = 'round'
    ctx.stroke()
    // Dot at tip
    ctx.beginPath()
    ctx.arc(spread + sway * 1.5, -size * 0.8, 1.2, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${hue + 80}, 70%, 65%, 0.5)`
    ctx.fill()
  }
  ctx.restore()
}

function drawCreature(ctx: CanvasRenderingContext2D, c: Creature, t: number): void {
  const wobble = Math.sin(t * 2 + c.phase) * 3
  ctx.save()
  ctx.translate(c.x, c.y + wobble)

  if (c.type === 'fish') {
    const dir = c.dx >= 0 ? 1 : -1
    ctx.scale(dir, 1)
    // Body
    ctx.beginPath()
    ctx.ellipse(0, 0, c.size, c.size * 0.5, 0, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${c.hue}, 60%, 55%, 0.25)`
    ctx.fill()
    // Tail
    ctx.beginPath()
    ctx.moveTo(-c.size, 0)
    ctx.lineTo(-c.size - c.size * 0.5, -c.size * 0.4)
    ctx.lineTo(-c.size - c.size * 0.5, c.size * 0.4)
    ctx.closePath()
    ctx.fillStyle = `hsla(${c.hue}, 55%, 50%, 0.2)`
    ctx.fill()
    // Eye
    ctx.beginPath()
    ctx.arc(c.size * 0.4, -c.size * 0.1, 1.2, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(200,220,240,0.5)'
    ctx.fill()
  } else if (c.type === 'jellyfish') {
    // Bell
    ctx.beginPath()
    ctx.arc(0, 0, c.size, Math.PI, Math.PI * 2)
    ctx.fillStyle = `hsla(${c.hue}, 50%, 60%, 0.15)`
    ctx.fill()
    // Tentacles
    for (let i = -2; i <= 2; i++) {
      const tx = i * c.size * 0.35
      ctx.beginPath()
      ctx.moveTo(tx, 0)
      const tw = Math.sin(t * 1.5 + c.phase + i) * 4
      ctx.quadraticCurveTo(tx + tw, c.size, tx + tw * 0.5, c.size * 2)
      ctx.strokeStyle = `hsla(${c.hue}, 50%, 65%, 0.15)`
      ctx.lineWidth = 0.8
      ctx.stroke()
    }
  } else {
    // Seahorse - simple form
    ctx.beginPath()
    ctx.ellipse(0, 0, c.size * 0.4, c.size, 0, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${c.hue}, 50%, 50%, 0.2)`
    ctx.fill()
    // Snout
    ctx.beginPath()
    ctx.moveTo(c.size * 0.3, -c.size * 0.5)
    ctx.lineTo(c.size * 0.7, -c.size * 0.7)
    ctx.strokeStyle = `hsla(${c.hue}, 50%, 50%, 0.2)`
    ctx.lineWidth = 1.5
    ctx.stroke()
    // Tail curl
    ctx.beginPath()
    ctx.arc(0, c.size * 0.8, c.size * 0.3, 0, Math.PI * 1.2)
    ctx.strokeStyle = `hsla(${c.hue}, 50%, 50%, 0.15)`
    ctx.lineWidth = 1
    ctx.stroke()
  }
  ctx.restore()
}

interface SeabedCanvasProps {
  width: number
  height: number
  seed?: number
}

export const SeabedCanvas: React.FC<SeabedCanvasProps> = ({ width, height, seed = 42 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const itemsRef = useRef<SeabedItem[]>([])
  const creaturesRef = useRef<Creature[]>([])
  const frameRef = useRef<number>(0)

  // Generate items on mount or size change
  useEffect(() => {
    const rand = seedRandom(seed)
    itemsRef.current = generateSeabed(width, rand)
    creaturesRef.current = generateCreatures(width, height, rand)
  }, [width, height, seed])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const t = performance.now() / 1000
    ctx.clearRect(0, 0, width, height)

    // Sandy gradient floor
    const floorGrad = ctx.createLinearGradient(0, height - 70, 0, height)
    floorGrad.addColorStop(0, 'rgba(8,18,35,0)')
    floorGrad.addColorStop(0.3, 'rgba(15,25,40,0.6)')
    floorGrad.addColorStop(1, 'rgba(20,30,45,0.9)')
    ctx.fillStyle = floorGrad
    ctx.fillRect(0, height - 70, width, 70)

    // Sandy texture dots
    const sandRand = seedRandom(seed + 999)
    for (let i = 0; i < 40; i++) {
      const sx = sandRand() * width
      const sy = height - 10 - sandRand() * 50
      ctx.beginPath()
      ctx.arc(sx, sy, 0.5 + sandRand() * 1.2, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(100,120,140,${0.08 + sandRand() * 0.08})`
      ctx.fill()
    }

    // Draw seabed items
    const baseY = height - 12
    for (const item of itemsRef.current) {
      const swayOffset = t * item.swaySpeed + item.sway
      switch (item.type) {
        case 'coral': drawCoral(ctx, item.x, baseY, item.size, item.hue, swayOffset); break
        case 'kelp': drawKelp(ctx, item.x, baseY, item.size, item.hue, swayOffset); break
        case 'rock': drawRock(ctx, item.x, baseY, item.size); break
        case 'bioluminescent': drawBioluminescent(ctx, item.x, baseY, item.size, item.hue, swayOffset); break
        case 'shell': drawShell(ctx, item.x, baseY, item.size, item.hue); break
        case 'anemone': drawAnemone(ctx, item.x, baseY, item.size, item.hue, swayOffset); break
      }
    }

    // Update and draw creatures
    for (const c of creaturesRef.current) {
      c.x += c.dx
      c.y += c.dy + Math.sin(t + c.phase) * 0.05
      // Wrap around
      if (c.x > width + 20) c.x = -20
      if (c.x < -20) c.x = width + 20
      if (c.y < 30) c.dy = Math.abs(c.dy)
      if (c.y > height - 80) c.dy = -Math.abs(c.dy)
      drawCreature(ctx, c, t)
    }

    frameRef.current = requestAnimationFrame(draw)
  }, [width, height, seed])

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      aria-hidden="true"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
