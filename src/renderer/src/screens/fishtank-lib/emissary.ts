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
  | 'angry'
  | 'ashamed'
  | 'awaiting'
  | 'blowing-bubbles'
  | 'bored'
  | 'broody'
  | 'browsing'
  | 'cheeky-2'
  | 'cheeky-grin'
  | 'cheeky'
  | 'chortle'
  | 'chuckling'
  | 'concussion'
  | 'confident'
  | 'confused'
  | 'crying'
  | 'flirting'
  | 'giggling'
  | 'hunger'
  | 'idle-cheeky'
  | 'idle-sitting'
  | 'idle'
  | 'joy'
  | 'keen'
  | 'lonely'
  | 'romantic-interest'
  | 'romantic'
  | 'sad-1'
  | 'sad-2'
  | 'searching'
  | 'secretive'
  | 'shock'
  | 'smiling'
  | 'smirks'
  | 'speed'
  | 'super-playful'
  | 'swimming'
  | 'teasing'
  | 'very-confused'
  | 'waving-hello'
  | 'yearning'

/**
 * Derives which portrait image to display based on the current animation,
 * service status, and weather state.
 *
 * Priority (highest → lowest):
 *   1. Error status          → shock
 *   2. Thunderstorm weather  → shock
 *   3. Running status        → keen
 *   4. Golden weather        → joy
 *   5. Animation-specific portrait
 *   6. Default               → idle
 */
export function getEmissaryEmotion(
  animation: EmissaryAnimation,
  status: ServiceStatus,
  weather: Weather,
): EmissaryEmotion {
  if (status === 'error') return 'shock'
  if (weather === 'thunderstorm') return 'shock'
  if (status === 'running') return 'keen'
  if (weather === 'golden') return 'joy'

  const map: Record<EmissaryAnimation, EmissaryEmotion> = {
    floating:           'idle',
    swimming:           'swimming',
    thinking:           'broody',
    'examining-scroll': 'searching',
    waving:             'waving-hello',
    stretching:         'idle-sitting',
    gazing:             'yearning',
    flirty:             'flirting',
    fearful:            'shock',
    preening:           'smirks',
    'collecting-pearls':'keen',
    'chasing-fish':     'super-playful',
    flexing:            'confident',
    singing:            'chortle',
    napping:            'idle-sitting',
    beckoning:          'romantic',
    meditating:         'awaiting',
    'juggling-shells':  'cheeky',
    posing:             'smirks',
  }
  return map[animation] ?? 'idle'
}
