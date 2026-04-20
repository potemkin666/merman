import type { ServiceStatus, TaskResult } from '../../../../shared/types'

// --- Fun things the emissary says ---
const IDLE_SAYINGS = [
  'The depths are quiet... for now.',
  'Hmm, I wonder what lies beyond the trench.',
  "These pearls won't sort themselves.",
  '*adjusts his coral bracelet*',
  'The currents whisper of tasks yet to come.',
  'A fine day beneath the waves.',
  'I could use a good scroll to read...',
  'The moonlight filters beautifully down here.',
  '*hums a sea shanty quietly*',
  'Patience is a virtue of the deep.',
  'The tide shifts... but I remain.',
  '*examines a passing jellyfish with curiosity*',
  'Have you ever seen bioluminescence up close? Stunning.',
  'Ready when you are, commander.',
  '*polishes his trident absent-mindedly*',
  'Oh, hello there. I see you watching.',
  '*winks at the glass*',
  'Do you like what you see?',
  '*flicks his tail playfully*',
  'Ah! Was that a shadow? ...No, just kelp.',
  '*nervously glances around*',
  'I once arm-wrestled a kraken. ...I lost.',
  '*flexes casually*',
  "Not that I'm showing off, but... look at these scales.",
  '*carefully arranges a collection of shells*',
  'This pearl? Found it myself. Just saying.',
  '*chases a tiny fish in circles*',
  'Come back here, little one!',
  'La la laaaa... *notices you* Oh! I was just... warming up.',
  '*stretches magnificently*',
  'I could float here forever. But duty calls. Eventually.',
  '*meditates serenely, one eye open to check if you are impressed*',
  'Ah, the peaceful art of doing nothing.',
  '*strikes a dramatic pose against the current*',
  'Paint me like one of your French fish.',
  '*beckons mysteriously*',
  'Come, let me tell you of the deep...',
  '*juggles three shells, drops one*',
  '...I meant to do that.',
  'You know, you have very kind eyes. For a surface-dweller.',
]

const WORKING_SAYINGS = [
  'Diving deeper... the answer is close.',
  'Following the current of thought...',
  'The waters churn with possibility.',
  'Sifting through the coral data...',
  'Almost... I can feel it in the currents.',
  'The abyss yields its secrets slowly.',
  'Processing... the deep takes time.',
  'Navigating through turbulent waters.',
  "I've found a promising current. Following it now.",
  'The pressure is immense, but I press on.',
  '*swims faster, determination in his eyes*',
  'The deep reveals what the surface cannot.',
  '*rolls up his sleeves (metaphorically — no sleeves)*',
  'I am giving this my full attention. Promise.',
  'Almost there... just a few more fathoms...',
  '*intense concentration face*',
]

const DONE_SAYINGS = [
  'Returned to shore with treasures.',
  'The depths have answered.',
  'Mission complete. The sea is calm.',
  'Surfacing now... results in hand.',
  'Another voyage concluded successfully.',
  '*emerges triumphantly from the deep*',
  'Ta-da! *presents results with a flourish*',
  'I told you I was good at this.',
]

const ERROR_SAYINGS = [
  'The waters are troubled...',
  'A storm in the deep. We must regroup.',
  'The currents turned hostile.',
  'I was pushed back. We should try again.',
  '*surfaces looking concerned*',
  "Don't worry — I've faced worse. Let me try again.",
  '*shakes water from his hair nervously*',
]

export function getSayings(status: ServiceStatus): string[] {
  switch (status) {
    case 'running': return WORKING_SAYINGS
    case 'error': return ERROR_SAYINGS
    case 'stopped': return DONE_SAYINGS
    default: return IDLE_SAYINGS
  }
}

export function getStatusText(status: ServiceStatus): string {
  switch (status) {
    case 'running': return 'working in the depths'
    case 'error': return 'troubled waters'
    case 'stopped': return 'resting at shore'
    default: return 'awaiting command'
  }
}

// --- Contextual click responses ---
// The emissary reacts differently based on status and history

export function getClickResponse(status: ServiceStatus, recentTasks: TaskResult[], clickCount: number): string {
  const lastTask = recentTasks[0]
  const errorCount = recentTasks.filter(t => t.status === 'error').length
  const totalDone = recentTasks.filter(t => t.status === 'done').length

  // Dramatic refusal pool (rare)
  if (clickCount > 5) {
    const annoyed = [
      'You keep poking the glass. I am trying to concentrate.',
      '*sighs dramatically* Yes? Again?',
      'If you click me one more time I am going back to the Mariana Trench.',
      'I am a professional emissary, not a stress ball.',
      '*gives you The Look*',
      'Into the Mariana Trench? Again? I just got my scales polished...',
    ]
    return annoyed[Math.floor(Math.random() * annoyed.length)]
  }

  // Status-aware responses
  if (status === 'running') {
    const busy = [
      'I am working! Give me a moment...',
      '*holds up a fin* Almost there...',
      'Patience. The deep does not yield quickly.',
      'The currents are strong but I am stronger. Almost done.',
      'Do not rush the deep. Good things take time.',
    ]
    return busy[Math.floor(Math.random() * busy.length)]
  }

  if (status === 'error') {
    const troubled = [
      'Things got rough down there. Check the Tide Log for clues.',
      'I tried my best, truly. The sea was not kind this time.',
      '*looks sheepish* That... did not go as planned.',
      'Even the best emissaries have rough tides. Shall we try again?',
    ]
    return troubled[Math.floor(Math.random() * troubled.length)]
  }

  // History-aware responses
  if (lastTask && lastTask.status === 'error') {
    const afterError = [
      'Last time was rough... but I have recovered. Ready for another dive.',
      'I do not like to talk about what happened last time. Let us move forward.',
      '*nervously* So... that last task... shall we try something different?',
    ]
    return afterError[Math.floor(Math.random() * afterError.length)]
  }

  if (errorCount >= 3) {
    const manyErrors = [
      `${errorCount} failed tasks? The sea is testing us. Perhaps check the configuration?`,
      'I keep running into trouble. Maybe the Deep Config needs adjusting?',
      'The currents are hostile lately. Something might be misconfigured.',
    ]
    return manyErrors[Math.floor(Math.random() * manyErrors.length)]
  }

  if (totalDone >= 5) {
    const experienced = [
      `${totalDone} tasks completed! We make a good duo, you and I.`,
      'Another click? You must enjoy my company. The feeling is mutual.',
      'We have been through a lot together. I am proud of what we have accomplished.',
      `${totalDone} successful dives! I am getting quite fond of this arrangement.`,
    ]
    return experienced[Math.floor(Math.random() * experienced.length)]
  }

  if (totalDone === 0 && recentTasks.length === 0) {
    const fresh = [
      'Hello! I am your emissary. Click "Dispatch" in the sidebar to send me on a task!',
      'New around here? Head to Setup first, then Dispatch to give me something to do.',
      'I am ready for my first mission! Just say the word.',
      '*waves enthusiastically* A new commander! I will not disappoint.',
    ]
    return fresh[Math.floor(Math.random() * fresh.length)]
  }

  // Default click responses
  const defaultClicks = [
    'Yes? Did you need something?',
    '*looks up from his coral collection* Oh, hello!',
    'I am at your service. Head to Dispatch if you have a task.',
    'Click me again and I might just blush.',
    '*taps the glass from the inside* I see you!',
    'You know, most people just send tasks. You actually visit. I like that.',
    'The depths are calm. A perfect time to dispatch a new task.',
  ]
  return defaultClicks[Math.floor(Math.random() * defaultClicks.length)]
}
