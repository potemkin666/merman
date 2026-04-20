# OpenClaw Harbor 🔱

> *An offline desktop companion for OpenClaw — elegant, oceanic, and built for non-technical users.*

<p align="center">
  <img src="https://github.com/user-attachments/assets/6ee9e92a-9d29-4686-ab07-7c23c0865ff5" alt="The Emissary" width="300" />
</p>

---

## What is this?

**OpenClaw Harbor** is an offline desktop companion app that gives non-technical users a friendly, polished way to install, configure, launch, monitor, and use [OpenClaw](https://github.com/openclaw) agents locally.

It wraps and orchestrates your existing OpenClaw install rather than replacing it, presenting everything through a merman-themed command interface: you issue orders, your emissary **Azurel** is dispatched into the depths, and the results surface back to shore.

> **Tip:** You can rename the emissary in **Deep Config** — but his default name is Azurel.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | [Electron](https://www.electronjs.org/) 41 |
| Build system | [electron-vite](https://electron-vite.org/) 5 |
| UI | [React](https://react.dev/) 18 + TypeScript |
| Bundler | [Vite](https://vitejs.dev/) 6 |
| Packaging | [electron-builder](https://www.electron.build/) 26 |
| Linting | [ESLint](https://eslint.org/) 9 + [@typescript-eslint](https://typescript-eslint.io/) |
| Formatting | [Prettier](https://prettier.io/) 3 |
| Persistence | File-system JSON (via `app.getPath('userData')`) |

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm 8 or later
- A local OpenClaw install (optional — the app will guide you through setup)

### Clone and run in development

```bash
git clone https://github.com/potemkin666/merman.git
cd merman
npm install          # install all dependencies
npm run rebuild      # compile native modules (node-pty) for Electron
npm run dev          # launch the app in dev mode
```

> **Why `npm run rebuild`?** The app uses `node-pty` (a native C++ addon) for the
> built-in terminal. Native addons must be compiled specifically for Electron's
> version of Node.js. Without this step the terminal may not work (the rest of the
> app still functions thanks to a built-in fallback).

### After pulling updates

When you `git pull` new changes, **`node_modules/` is not updated automatically** — it
is listed in `.gitignore` and never stored in git. If dependencies changed you need to
re-install:

```bash
git pull
npm install          # picks up any new/changed dependencies
npm run rebuild      # recompile native modules against Electron
npm run dev
```

> **Tip:** The one-click launchers (`start.sh` / `start.bat`) handle this for you
> automatically — they detect when `package.json` is newer than `node_modules` and
> re-run install + rebuild before launching.

### One-click launcher (no terminal needed!)

After cloning, you can use the included launcher shortcuts instead of the terminal:

- **Windows:** Double-click `start.bat`
- **macOS / Linux:** Double-click `start.sh` (or run `./start.sh` in terminal)

These scripts automatically:
1. Check that Node.js is installed
2. Install dependencies if missing **or** if `package.json` has changed since the last install
3. Rebuild native modules for Electron
4. Launch the app

### Build for production (unpacked)

```bash
npm run build
```

The compiled output lands in `out/`.

### Package as a distributable app

```bash
# Package for current platform
npm run dist

# Platform-specific
npm run dist:mac     # .dmg + .zip
npm run dist:win     # .exe installer + portable
npm run dist:linux   # .AppImage + .deb
```

Packaged output goes to `release/`.

---

## Code Style

The project uses **ESLint** with `@typescript-eslint` and **Prettier** so that every
contributor formats code the same way.

```bash
npm run lint          # check for lint errors/warnings
npm run lint:fix      # auto-fix what ESLint can
npm run format        # reformat all source files with Prettier
npm run format:check  # check formatting without writing (CI-friendly)
```

Configuration lives in:

- `eslint.config.js` — ESLint 9 flat config (TypeScript, React, React Hooks, Prettier compat)
- `.prettierrc` — Prettier options (no semicolons, single quotes, 120-char lines)

> **Tip for editors:** Install the ESLint and Prettier extensions for your editor
> and enable "format on save" for the smoothest experience.

---

## How it connects to OpenClaw

1. Open **Deep Config** and set the path to your local OpenClaw folder.
2. Open **Setup** to run `npm install` inside that folder and verify prerequisites.
3. Return to **The Harbor** and press **Summon** to start the OpenClaw service (`node index.js`).
4. Use **Dispatch** to send tasks/prompts directly to the running agent.
5. Open **The Fishtank** to watch Azurel work — he'll swim, think, examine scrolls, and share his thoughts while he's at it.

The app spawns OpenClaw as a child process, captures its stdout/stderr, translates output into readable log entries in **Tide Log**, and surfaces errors with plain-English explanations.

---

## Screens

| Screen | Purpose |
|--------|---------|
| **The Harbor** | Main dashboard: status, quick actions, environment health, recent dispatches |
| **Setup Wizard** | Guided onboarding: check prerequisites, locate install, run setup |
| **Dispatch** | Send a task to the emissary; select a mode/preset; view results |
| **The Fishtank** | Peer into the depths — watch Azurel's idle animations and hear his thoughts |
| **Tide Log** | Filterable log panel with simplified and raw views |
| **Deep Config** | Form-based settings: paths, model, provider, API key, emissary name, presets |

---

## The Fishtank 🐠

Click "Fishtank" in the sidebar to peer into Azurel's underwater world. You'll see:

- **Idle animations** that cycle automatically — floating, swimming, thinking, examining scrolls, waving, stretching, gazing into the abyss
- **Status-aware sayings** — Azurel says different things depending on whether he's idle, working, done, or encountering errors
- **Ambient effects** — bubbles rise, caustic light drifts, coral decorates the seabed
- **Live status** — a bottom bar shows what the emissary is currently doing

When a task is running, Azurel's animations shift to focused work behavior and his sayings reflect progress.

---

## What works in MVP

- [x] Electron + React + Vite + TypeScript scaffold
- [x] Dark underwater theme (CSS custom properties)
- [x] Sidebar navigation
- [x] Harbor dashboard with status card, environment health, and recent dispatches
- [x] Setup Wizard with real environment checks (Node, npm, git, OpenClaw dir, config files)
- [x] Start / stop / restart OpenClaw service with real process tracking
- [x] Dispatch screen with prompt entry, mode selection, output panel
- [x] Fishtank with animated emissary, cycling idle behaviors, and status-aware sayings
- [x] Customizable emissary name (default: Azurel) — set in Deep Config, used throughout the UI
- [x] Tide Log with severity filters and raw/simplified toggle
- [x] Deep Config with path fields, model settings, preset management
- [x] Error translation with plain-English explanations and retry buttons
- [x] Saved presets (Quick Chat, Starter Mode, Coding Helper, Local Researcher, Advanced Custom)
- [x] IPC layer between main and renderer
- [x] Persistent config stored in `userData/config.json`
- [x] Local task history in browser localStorage
- [x] Packaging via electron-builder (macOS, Windows, Linux)
- [x] ESLint + Prettier configured for consistent code style

## Limitations

- The app does not rebuild or replace OpenClaw internals
- No cloud features, sync, or multi-user support
- Log parsing is basic — more patterns can be added
- Visual theme uses emoji icons; SVG/custom art is a future improvement

---

## Future Roadmap

- Custom merman character art (replace emoji with illustrated sprites)
- More emissary animations and reactions tied to specific task events
- Richer log parsing and pattern matching
- Task templates and prompt library
- Optional "advanced mode" for technical users
- Health diagnostics panel
- Auto-update support

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
│       ├── screens/       # Harbor, SetupWizard, Dispatch, Fishtank, TideLog, DeepConfig
│       ├── hooks/         # useAppState, useIpc
│       └── theme/         # Design tokens reference
└── shared/
    ├── types.ts           # Shared TypeScript interfaces
    └── ipc.ts             # IPC channel name constants
```

---

## Troubleshooting

### App crashes on startup / "Cannot find module 'node-pty'"

This means native modules were not compiled for Electron. Run:

```bash
npm run rebuild
```

If that fails, delete `node_modules` and start fresh:

```bash
rm -rf node_modules   # macOS/Linux
rmdir /s /q node_modules  # Windows
npm install
npm run rebuild
npm run dev
```

### I ran `git pull` and now the app is broken

`git pull` only updates source files — it does **not** touch `node_modules/`. If
dependencies changed in the pull, run:

```bash
npm install
npm run rebuild
```

Or just use the one-click launcher (`start.sh` / `start.bat`) which detects this
automatically.

### `start.sh` says "permission denied"

Make it executable:

```bash
chmod +x start.sh
./start.sh
```

### Terminal screen says "PTY not available"

This is non-fatal. The app falls back to a basic `child_process` shell. To get full
PTY support, run `npm run rebuild` to compile `node-pty` for Electron.

---

## License

MIT
