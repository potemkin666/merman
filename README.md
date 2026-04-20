# OpenClaw Harbor 🔱

> *An offline desktop companion for OpenClaw — elegant, oceanic, and built for non-technical users.*

![Harbor Dashboard](docs/screenshots/placeholder-harbor.png)

---

## What is this?

**OpenClaw Harbor** is an offline desktop companion app that gives non-technical users a friendly, polished way to install, configure, launch, monitor, and use [OpenClaw](https://github.com/openclaw) agents locally.

It wraps and orchestrates your existing OpenClaw install rather than replacing it, presenting everything through a merman-themed command interface: you issue orders, a handsome emissary is dispatched into the depths, and the results surface back to shore.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | [Electron](https://www.electronjs.org/) 41 |
| Build system | [electron-vite](https://electron-vite.org/) 5 |
| UI | [React](https://react.dev/) 18 + TypeScript |
| Bundler | [Vite](https://vitejs.dev/) 6 |
| Persistence | File-system JSON (via `app.getPath('userData')`) |

---

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm 8 or later
- A local OpenClaw install (optional — the app will guide you through setup)

### Clone and run

```bash
git clone https://github.com/potemkin666/merman.git
cd merman
npm install
npm run dev
```

### Build for production

```bash
npm run build
```

The compiled output lands in `out/`.

---

## How it connects to OpenClaw

1. Open **Deep Config** and set the path to your local OpenClaw folder.
2. Open **Setup** to run `npm install` inside that folder and verify prerequisites.
3. Return to **The Harbor** and press **Summon** to start the OpenClaw service (`node index.js`).
4. Use **The Dispatch Chamber** to send tasks/prompts directly to the running agent.

The app spawns OpenClaw as a child process, captures its stdout/stderr, translates output into readable log entries in **Tide Log**, and surfaces errors with plain-English explanations.

---

## Screens

| Screen | Purpose |
|--------|---------|
| **The Harbor** | Main dashboard: status, quick actions, recent dispatches |
| **Setup Wizard** | Guided onboarding: check prerequisites, locate install, run setup |
| **Dispatch Chamber** | Send a task to the agent; watch it execute; view results |
| **Tide Log** | Filterable log panel with simplified and raw views |
| **Deep Config** | Form-based settings: paths, model, provider, API key, presets |

---

## What works in MVP

- [x] Electron + React + Vite + TypeScript scaffold
- [x] Dark underwater theme (CSS custom properties)
- [x] Sidebar navigation
- [x] Harbor dashboard with status card, environment health, and recent dispatches
- [x] Setup Wizard with real environment checks (Node, npm, git, OpenClaw dir, config files)
- [x] Start / stop / restart OpenClaw service with real process tracking
- [x] Dispatch screen with prompt entry, mode selection, output panel
- [x] Tide Log with severity filters and raw/simplified toggle
- [x] Deep Config with path fields, model settings, preset management
- [x] Error translation with plain-English explanations and retry buttons
- [x] Saved presets (Quick Chat, Starter Mode, Coding Helper, Local Researcher, Advanced Custom)
- [x] IPC layer between main and renderer
- [x] Persistent config stored in `userData/config.json`
- [x] Local task history in browser localStorage

## Limitations

- The app does not rebuild or replace OpenClaw internals
- No packaged installers yet (must run from source)
- No cloud features, sync, or multi-user support
- Log parsing is basic — more patterns can be added
- Visual theme uses emoji icons; SVG/custom icons are a future improvement

---

## Planned (not MVP)

- Richer animated underwater UI
- Visual agent portraits
- Better log parsing rules
- Task templates
- Packaged builds (.dmg, .exe, AppImage)
- Optional "advanced mode" for technical users
- Health diagnostics panel

---

## Architecture

```
src/
├── main/                  # Electron main process
│   ├── index.ts           # Window creation + IPC handlers
│   ├── preload.ts         # contextBridge exposure
│   └── services/
│       ├── envChecker.ts  # Detect Node, npm, git, OpenClaw
│       ├── processRunner.ts  # Spawn child processes, stream output
│       ├── configService.ts  # Read/write JSON config
│       └── logService.ts     # In-memory log buffer + persistence
├── renderer/              # React UI
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── components/    # StatusCard, NavSidebar, LogPanel, Modal
│       ├── screens/       # Harbor, SetupWizard, Dispatch, TideLog, DeepConfig
│       ├── hooks/         # useAppState, useIpc
│       └── theme/         # Design tokens reference
└── shared/
    ├── types.ts           # Shared TypeScript interfaces
    └── ipc.ts             # IPC channel name constants
```

---

## License

MIT
