import type { ServiceStatus, TaskResult } from '../../../../shared/types'

// --- Weather system ---
// Weather state derived from app state and recent task history

export type Weather = 'calm' | 'working' | 'stormy' | 'golden' | 'thunderstorm'

export function deriveWeather(status: ServiceStatus, recentTasks: TaskResult[]): Weather {
  // Thunderstorm: service crashed (status is error)
  if (status === 'error') return 'thunderstorm'

  // Working: actively running
  if (status === 'running') return 'working'

  // Check recent tasks for context
  const lastTask = recentTasks[0]
  if (lastTask) {
    // Golden: last task was successful and finished recently (within 60s)
    if (lastTask.status === 'done' && lastTask.finishedAt) {
      const ago = Date.now() - new Date(lastTask.finishedAt).getTime()
      if (ago < 60000) return 'golden'
    }
    // Stormy: last task failed and was recent
    if (lastTask.status === 'error' && lastTask.finishedAt) {
      const ago = Date.now() - new Date(lastTask.finishedAt).getTime()
      if (ago < 60000) return 'stormy'
    }
  }

  return 'calm'
}

export const WEATHER_BACKGROUNDS: Record<Weather, string> = {
  calm: 'linear-gradient(180deg, #041020 0%, #081a35 25%, #0b2445 50%, #0d2a4a 75%, #0a1e38 100%)',
  working: 'linear-gradient(180deg, #041020 0%, #0a1e40 25%, #0e2d55 50%, #102f58 75%, #0c2240 100%)',
  stormy: 'linear-gradient(180deg, #0a0810 0%, #14101e 25%, #1a1428 50%, #1e1630 75%, #150e20 100%)',
  golden: 'linear-gradient(180deg, #0a0e10 0%, #1a2215 25%, #1e2818 50%, #22301a 75%, #18220e 100%)',
  thunderstorm: 'linear-gradient(180deg, #080408 0%, #100810 25%, #180c14 50%, #1a0a12 75%, #12060a 100%)',
}

export const WEATHER_CAUSTIC_OPACITY: Record<Weather, number> = {
  calm: 1,
  working: 1.4,
  stormy: 0.3,
  golden: 0.8,
  thunderstorm: 0.15,
}

export const WEATHER_BUBBLE_COUNT: Record<Weather, [number, number]> = {
  calm: [5, 6],
  working: [8, 8],
  stormy: [10, 10],
  golden: [4, 4],
  thunderstorm: [12, 8],
}
