import type { ServiceStatus } from '../../../../shared/types'
import type { Weather } from './weather'

// --- Expanded idle animations ---
export type EmissaryAnimation =
  | 'floating'
  | 'swimming'
  | 'thinking'
  | 'examining-scroll'
  | 'waving'
  | 'stretching'
  | 'gazing'
  | 'flirty'
  | 'fearful'
  | 'preening'
  | 'collecting-pearls'
  | 'chasing-fish'
  | 'flexing'
  | 'singing'
  | 'napping'
  | 'beckoning'
  | 'meditating'
  | 'juggling-shells'
  | 'posing'

export const ANIMATIONS: EmissaryAnimation[] = [
  'floating', 'swimming', 'thinking', 'examining-scroll', 'waving',
  'stretching', 'gazing', 'flirty', 'fearful', 'preening',
  'collecting-pearls', 'chasing-fish', 'flexing', 'singing',
  'napping', 'beckoning', 'meditating', 'juggling-shells', 'posing',
]

export const ANIMATION_LABELS: Record<EmissaryAnimation, string> = {
  floating: 'Drifting gently in the current',
  swimming: 'Gliding through the deep',
  thinking: 'Lost in thought',
  'examining-scroll': 'Studying an ancient scroll',
  waving: 'Waves at you through the glass',
  stretching: 'Stretching his fins',
  gazing: 'Gazing into the abyss',
  flirty: 'Notices you watching...',
  fearful: 'Something spooked him!',
  preening: 'Adjusting his scales',
  'collecting-pearls': 'Collecting pearls from the seabed',
  'chasing-fish': 'Chasing a curious little fish',
  flexing: 'Showing off a bit',
  singing: 'Humming an old sea melody',
  napping: 'Taking a little rest',
  beckoning: 'Come closer...',
  meditating: 'Finding inner calm',
  'juggling-shells': 'Playing with sea shells',
  posing: 'Striking a heroic pose',
}

export const ANIMATION_EMOJIS: Record<EmissaryAnimation, string> = {
  floating: '\u{1F9DC}\u200D\u2642\uFE0F',
  swimming: '\u{1F3CA}\u200D\u2642\uFE0F',
  thinking: '\u{1F914}',
  'examining-scroll': '\u{1F4DC}',
  waving: '\u{1F44B}',
  stretching: '\u{1F9D8}\u200D\u2642\uFE0F',
  gazing: '\u{1F52D}',
  flirty: '\u{1F609}',
  fearful: '\u{1F628}',
  preening: '\u2728',
  'collecting-pearls': '\u{1FAAA}',
  'chasing-fish': '\u{1F420}',
  flexing: '\u{1F4AA}',
  singing: '\u{1F3B6}',
  napping: '\u{1F634}',
  beckoning: '\u{1F919}',
  meditating: '\u{1F9D8}\u200D\u2642\uFE0F',
  'juggling-shells': '\u{1F41A}',
  posing: '\u{1F9DC}\u200D\u2642\uFE0F',
}

export function getEmissaryStyle(animation: EmissaryAnimation, status: ServiceStatus): React.CSSProperties {
  const base: React.CSSProperties = { transition: 'all 1s ease-in-out' }
  if (status === 'running') return { ...base, animation: 'emissaryWorking 3s ease-in-out infinite' }
  const map: Partial<Record<EmissaryAnimation, string>> = {
    floating: 'emissaryFloat 4s ease-in-out infinite',
    swimming: 'emissarySwim 5s ease-in-out infinite',
    thinking: 'emissaryThink 3s ease-in-out infinite',
    waving: 'emissaryWave 1.5s ease-in-out 3',
    stretching: 'emissaryStretch 4s ease-in-out infinite',
    gazing: 'emissaryGaze 6s ease-in-out infinite',
    flirty: 'emissaryFlirty 3s ease-in-out infinite',
    fearful: 'emissaryFearful 0.8s ease-in-out 3',
    preening: 'emissaryFloat 5s ease-in-out infinite',
    'collecting-pearls': 'emissaryCollect 4s ease-in-out infinite',
    'chasing-fish': 'emissaryChase 3s ease-in-out infinite',
    flexing: 'emissaryFlex 2s ease-in-out 2',
    singing: 'emissaryFloat 4s ease-in-out infinite',
    napping: 'emissaryNap 5s ease-in-out infinite',
    beckoning: 'emissaryBeckon 2s ease-in-out infinite',
    meditating: 'emissaryFloat 6s ease-in-out infinite',
    'juggling-shells': 'emissaryJuggle 1.5s ease-in-out infinite',
    posing: 'emissaryPose 4s ease-in-out infinite',
    'examining-scroll': 'emissaryFloat 5s ease-in-out infinite',
  }
  return { ...base, animation: map[animation] || 'emissaryFloat 4s ease-in-out infinite' }
}

// ── Emotion mapping for PNG sprite selection ──────────────────────────────────

export type EmissaryEmotion =
  | 'smug'
  | 'laughing'
  | 'waving'
  | 'crying'
  | 'thinking'
  | 'flexing'
  | 'excited'
  | 'distressed'

/**
 * Derives which of the eight merman portrait images to display based on the
 * current animation, service status, and weather state.
 *
 * Priority (highest → lowest):
 *   1. Error status → distressed
 *   2. Fearful animation or thunderstorm → crying
 *   3. Running status or waving/beckoning animation → waving
 *   4. Flexing or posing animation → flexing
 *   5. Golden weather or highly energetic animations → excited
 *   6. Playful/rhythmic animations → laughing
 *   7. Contemplative animations → thinking
 *   8. Everything else → smug (default idle)
 */
export function getEmissaryEmotion(
  animation: EmissaryAnimation,
  status: ServiceStatus,
  weather: Weather,
): EmissaryEmotion {
  if (status === 'error') return 'distressed'
  if (animation === 'fearful' || weather === 'thunderstorm') return 'crying'
  if (
    status === 'running' ||
    animation === 'waving' ||
    animation === 'beckoning'
  ) return 'waving'
  if (animation === 'flexing' || animation === 'posing') return 'flexing'
  if (
    weather === 'golden' ||
    animation === 'chasing-fish' ||
    animation === 'juggling-shells' ||
    animation === 'collecting-pearls'
  ) return 'excited'
  if (
    animation === 'flirty' ||
    animation === 'singing' ||
    animation === 'preening'
  ) return 'laughing'
  if (
    animation === 'thinking' ||
    animation === 'examining-scroll' ||
    animation === 'meditating' ||
    animation === 'gazing'
  ) return 'thinking'
  return 'smug'
}
