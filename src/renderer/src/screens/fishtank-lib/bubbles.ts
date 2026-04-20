import type { Weather } from './weather'
import { WEATHER_BUBBLE_COUNT } from './weather'

export interface Bubble {
  id: number
  x: number
  size: number
  delay: number
}

export interface Particle {
  id: number
  x: number
  y: number
  size: number
  delay: number
}

export function spawnBubbles(weather: Weather): Bubble[] {
  const [base, extra] = WEATHER_BUBBLE_COUNT[weather]
  const count = base + Math.floor(Math.random() * extra)
  return Array.from({ length: count }, (_, i) => ({
    id: Date.now() + i,
    x: 5 + Math.random() * 90,
    size: 3 + Math.random() * 14,
    delay: Math.random() * 4,
  }))
}

export function spawnParticles(): Particle[] {
  const count = 4 + Math.floor(Math.random() * 4)
  return Array.from({ length: count }, (_, i) => ({
    id: Date.now() + 1000 + i,
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 80,
    size: 2 + Math.random() * 4,
    delay: Math.random() * 5,
  }))
}

export function getBubbleColors(weather: Weather) {
  const color = weather === 'golden' ? 'rgba(240,200,80,0.4)' : weather === 'thunderstorm' ? 'rgba(232,93,93,0.3)' : weather === 'stormy' ? 'rgba(150,100,200,0.3)' : 'rgba(0,200,212,0.4)'
  const bg = weather === 'golden' ? 'rgba(240,200,80,0.08)' : weather === 'thunderstorm' ? 'rgba(232,93,93,0.06)' : weather === 'stormy' ? 'rgba(150,100,200,0.06)' : 'rgba(0,200,212,0.08)'
  const border = weather === 'golden' ? 'rgba(240,200,80,0.15)' : weather === 'thunderstorm' ? 'rgba(232,93,93,0.12)' : weather === 'stormy' ? 'rgba(150,100,200,0.12)' : 'rgba(0,200,212,0.15)'
  const speed = (weather === 'stormy' || weather === 'thunderstorm') ? 2.5 : 4
  return { color, bg, border, speed }
}

export function getParticleColor(weather: Weather): string {
  return weather === 'golden' ? 'rgba(240,200,80,0.3)' : weather === 'thunderstorm' ? 'rgba(232,93,93,0.2)' : weather === 'stormy' ? 'rgba(150,100,200,0.2)' : 'rgba(0,200,212,0.3)'
}
