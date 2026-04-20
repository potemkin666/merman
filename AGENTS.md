# AGENTS.md

## Project

Build an offline desktop companion app for OpenClaw that makes local setup, launch, configuration, and basic task use much easier for non-technical users.

This app is not a replacement for OpenClaw itself. It is a friendly local control layer around OpenClaw.

## Core fantasy

The UI theme is merman-themed.

The user is not part of a crew or team.

The fantasy is:

- the user gives commands
- the agent is a handsome merman emissary
- the user dispatches the emissary to do their bidding
- the emissary returns with results

This theme should shape naming, visuals, and tone, but must never reduce usability.

Avoid team/collaboration language such as:

- crew
- squad
- party
- members
- operators

Prefer language such as:

- emissary
- dispatch
- harbor
- tide log
- deep config
- currents
- pearls
- return to shore

## Product goal

A non-technical user should be able to:

- connect the app to a local OpenClaw installation
- check whether their local environment is ready
- run setup steps without using a terminal directly
- configure basic settings through a UI
- start and stop OpenClaw services
- dispatch an agent task from a clean screen
- read logs in simple language
- recover from common setup/runtime failures

## Technical constraints

- desktop app
- offline-first
- local-first
- no cloud dependency required for the UI
- do not rebuild OpenClaw internals
- orchestrate existing local OpenClaw commands/processes
- keep the project runnable after clone with straightforward setup steps

## Required stack

Use:

- Electron
- React
- Vite
- TypeScript

## Architecture

Use this structure:

- `src/main` for Electron main process
- `src/renderer` for React UI
- `src/shared` for shared types and IPC contracts
- `src/main/services` for:
  - process execution
  - environment checks
  - config file handling
  - local persistence
  - log capture/parsing
- `src/renderer/components` for reusable UI components
- `src/renderer/screens` for screen-level views
- `src/renderer/theme` for colors, spacing, typography, tokens

### Rules

- Electron main process handles OS/process/file access
- React renderer handles UI only
- use typed IPC between renderer and main
- do not put shell/process logic in the renderer
- avoid giant files
- keep state models explicit and typed

## MVP features

Build only these features first:

1. Harbor dashboard
2. Setup Wizard
3. Start/stop OpenClaw controls
4. Dispatch screen
5. Tide Log screen
6. Deep Config screen
7. Saved presets
8. Local persistence

Do not build these in MVP:

- accounts
- sync
- collaboration
- plugins
- cloud hosting
- multi-user features
- analytics dashboards
- advanced theme editor
- complicated animation systems

## Priority rule

If there is ever a conflict between:

- theme
- usability

choose usability.

The merman theme should enhance clarity, not get in the way.
