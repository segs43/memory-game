# 🧠 Memory Thief

> *A browser-based indie horror game about stealing memories — and losing yourself in the process.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## Table of Contents

1. [Overview](#overview)
2. [Gameplay](#gameplay)
3. [Quick Start](#quick-start)
4. [Project Structure](#project-structure)
5. [Architecture](#architecture)
6. [Systems Reference](#systems-reference)
7. [Configuration & Ports](#configuration--ports)
8. [API Reference](#api-reference)
9. [Controls](#controls)
10. [Endings Guide](#endings-guide)
11. [Development Notes](#development-notes)

---

## Overview

Memory Thief is a top-down horror game built as a **production-grade, modular TypeScript + React application**. You navigate a darkened maze, stealing memories from NPCs. Each memory you take increases your own corruption — inverting your controls, shrinking your vision, distorting the world around you, and ultimately consuming you.

The codebase is designed as a real indie game engine foundation:

- **Clean architecture** — 5 distinct layers (Engine, Systems, State, UI, Backend)
- **Fully typed** — TypeScript strict mode, zero `any`
- **Decoupled** — systems communicate via a typed event bus, not direct calls
- **Performant** — delta-time game loop, object pooling, `{ alpha: false }` canvas context, offscreen chromatic aberration pass
- **Mobile-first** — virtual joystick, responsive layout, touch-optimized

---

## Gameplay

You are the Memory Thief. You move through a fog-shrouded maze populated by glowing NPCs. Each NPC carries a **memory fragment** — a haunting piece of a story. Walk up to an NPC and steal their memory. But every theft corrupts you further:

| Corruption | Effect |
|---|---|
| 0–20% | STABLE — no penalties |
| 20–40% | COMPROMISED — controls briefly invert after each steal |
| 40–60% | UNSTABLE — vision radius shrinks, glitches begin |
| 60–80% | SEVERE — chromatic aberration, heavy screen glitch, audio distorts |
| 80–100% | VOID — purple screen tint, erratic glitch, near-blindness |

NPCs are aware of you:
- **Idle** — wander slowly through the maze
- **Alert** — freeze and face you when you come within range (linger 2.5s after you leave)
- **Flee** — back away when you're very close
- **Stolen** — become hollow cracked shells

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Install & Run

```bash
# 1. Clone or extract the project
cd memory-thief

# 2. Install all dependencies
npm install

# 3a. Frontend only (game runs standalone)
npm run dev
# → http://localhost:8900

# 3b. Frontend + Backend together
npm run dev:full
# → Frontend: http://localhost:8900
# → Backend:  http://localhost:9800

# 4. Production build
npm run build
npm run preview
```

### Run the Backend Separately

```bash
npm run server
# → http://localhost:9800/api/health
```

---

## Project Structure

```
memory-thief/
├── index.html                      # HTML entry point
├── vite.config.ts                  # Vite config (ports, aliases)
├── tsconfig.json                   # TypeScript strict config
├── package.json
│
├── src/
│   ├── main.tsx                    # React entry point
│   ├── App.tsx                     # Root component / screen router
│   │
│   ├── types/
│   │   └── game.ts                 # All shared TypeScript interfaces & types
│   │
│   ├── utils/
│   │   └── vec2.ts                 # 2D vector math library
│   │
│   ├── data/
│   │   ├── npcData.ts              # NPC spawn positions & memory content
│   │   └── endingData.ts           # Ending definitions & resolution logic
│   │
│   ├── state/
│   │   └── gameStore.ts            # Zustand global state store
│   │
│   ├── engine/
│   │   ├── core/
│   │   │   ├── GameLoop.ts         # Delta-time RAF loop
│   │   │   ├── Camera.ts           # Smooth follow + camera shake
│   │   │   ├── EventBus.ts         # Typed pub/sub event bus
│   │   │   ├── WorldMap.ts         # Wall definitions + collision resolution
│   │   │   └── GameController.ts   # Master orchestrator — owns all systems
│   │   │
│   │   ├── entities/
│   │   │   └── EntityFactory.ts    # Player & NPC factory functions
│   │   │
│   │   └── systems/
│   │       ├── RenderSystem.ts     # Full canvas renderer + chromatic aberration
│   │       ├── InputSystem.ts      # Keyboard + virtual joystick unified API
│   │       ├── AISystem.ts         # NPC idle / alert / flee state machine
│   │       ├── AudioSystem.ts      # Web Audio drone + reactive SFX
│   │       ├── CorruptionSystem.ts # Data-driven corruption progression
│   │       ├── DialogueSystem.ts   # Memory text + corruption distortion
│   │       ├── GlitchSystem.ts     # Block glitches + scanlines + screen tint
│   │       └── ParticleSystem.ts   # Object-pooled particle effects (200 pool)
│   │
│   └── ui/
│       ├── hooks/
│       │   └── useGameCanvas.ts    # Canvas lifecycle + GameController hook
│       └── components/
│           ├── HUD.tsx             # Memory counter + corruption bar
│           ├── DialogueOverlay.tsx # Typewriter + flicker + speaker tag
│           ├── VirtualJoystick.tsx # Smooth touch joystick
│           ├── MobileControls.tsx  # Joystick + steal button layout
│           ├── MainMenu.tsx        # Glitch title + start screen
│           └── EndingScreen.tsx    # All 3 endings with unique accent colors
│
└── server/
    ├── index.js                    # Express app entry (port 9800)
    ├── middleware/
    │   └── logger.js               # Colored request logger with timing
    └── routes/
        ├── save.js                 # POST/GET/DELETE save data
        └── leaderboard.js          # POST/GET leaderboard
```

---

## Architecture

The project is divided into five strict layers. **Data flows one direction — engine → state → UI.** The UI never calls engine functions directly.

```
┌────────────────────────────────────────────────────────────┐
│  React UI Layer                                            │
│  HUD · Menus · Dialogue · MobileControls · VirtualJoystick │
│  (reads Zustand store — NO game logic)                     │
└──────────────────────────┬─────────────────────────────────┘
                           │ reads
┌──────────────────────────▼─────────────────────────────────┐
│  Zustand State Layer                                       │
│  gameStore.ts — phase, corruption, dialogue, progression   │
└──────────────────────────┬─────────────────────────────────┘
                           │ writes
┌──────────────────────────▼─────────────────────────────────┐
│  Engine Core                                               │
│  GameController → GameLoop → Camera → EventBus             │
│                                                            │
│  Systems (decoupled, orchestrated by GameController):      │
│  RenderSystem · InputSystem · AISystem · AudioSystem       │
│  CorruptionSystem · DialogueSystem · GlitchSystem          │
│  ParticleSystem                                            │
└──────────────────────────┬─────────────────────────────────┘
                           │ HTTP /api/*
┌──────────────────────────▼─────────────────────────────────┐
│  Express Backend (port 9800)                               │
│  /api/save · /api/leaderboard · /api/health                │
└────────────────────────────────────────────────────────────┘
```

### Event Bus

Systems communicate without tight coupling via the typed `EventBus`:

```typescript
// Emit from anywhere in the engine
eventBus.emit('MEMORY_STOLEN', { npcId: 'entity_3', count: 2 });

// Subscribe from anywhere — returns cleanup function
const unsub = eventBus.on('CORRUPTION_CHANGED', (e) => {
  console.log(e.payload); // CorruptionState
});
unsub(); // cleanup
```

### State Flow

```
User presses E / Steal button
        ↓
InputSystem.consumeInteract()
        ↓
GameController.stealMemory(index)
        ↓
  NPCEntity.state = 'stolen'
  store.incrementMemories()           ← Zustand update → React re-renders HUD
  CorruptionSystem.applyMemorySteal() ← new CorruptionState
  AudioSystem.playMemorySteal()
  ParticleSystem.burst()
  Camera.triggerShake()
  DialogueSystem.open()               ← store.openDialogue() → React shows overlay
        ↓
User dismisses dialogue
        ↓
DialogueSystem.onClose callback
  store.closeDialogue()
  GameController.checkEndCondition()  ← resolveEnding() → store.triggerEnding()
```

---

## Systems Reference

### GameLoop
Delta-time based RAF loop. Caps `dt` at 50ms to prevent spiral of death on tab-blur.

```typescript
const loop = new GameLoop(
  (dt, elapsed) => update(dt, elapsed),
  () => render()
);
loop.start();
loop.stop();
loop.reset(); // resets elapsed without stopping
```

### Camera
Smooth lerp follow with world-boundary clamping and trauma-based shake.

```typescript
camera.follow(player.position);       // set follow target
camera.triggerShake(magnitude, duration); // e.g. (8, 0.3)
camera.worldToScreen(worldPos, W, H); // for screen-space UI
camera.applyTransform(ctx, W, H);     // call inside ctx.save/restore
```

### CorruptionSystem
Pure functions — no side effects except the EventBus emit.

```typescript
buildCorruptionState(memoriesStolen)           // → CorruptionState
applyMemorySteal(current, newCount)            // → CorruptionState (emits event)
updateCorruptionTimers(current, dt)            // → CorruptionState (handles invert timer)
```

### ParticleSystem
Object-pool of 200 particles. `acquire()`/`release()` — zero GC pressure during gameplay.

```typescript
particles.burst(origin, count, color);  // explosion on memory steal
particles.ambient(npcPosition);         // gentle float (10% chance per frame per NPC)
particles.update(dt);
particles.getActive();                  // readonly Particle[]
```

### InputSystem
Keyboard and virtual joystick share one unified `InputState`. Joystick takes priority when active.

```typescript
input.setJoystick({ x, y });         // called by VirtualJoystick component
input.setInteract(pressed);           // called by Steal button
input.consumeInteract();              // returns true once, clears flag
input.getState();                     // → InputState (joystick, up/down/left/right, interact)
```

---

## Configuration & Ports

| Service | Port | Env Override |
|---|---|---|
| Frontend (Vite) | `8900` | Not configurable via env |
| Backend (Express) | `9800` | `PORT=xxxx npm run server` |

To change ports permanently:
- **Frontend:** Edit `server.port` in `vite.config.ts`
- **Backend:** Edit the fallback in `server/index.js` or set `PORT` env var
- **CORS:** Update the `origin` array in `server/index.js` to match new frontend port

```bash
# Custom backend port example
PORT=5000 npm run server
```

---

## API Reference

All endpoints are prefixed `/api/`. The backend runs on `http://localhost:9800`.

### Health

```
GET /api/health
→ { status: "ok", timestamp: "...", uptime: 42.3 }
```

### Save

```
POST /api/save
Body: { playerId: string, memoriesStolen: number, ending: string | null }
→ { success: true, save: { playerId, memoriesStolen, ending, savedAt } }

GET /api/save/:playerId
→ { playerId, memoriesStolen, ending, savedAt }
→ 404 if not found

DELETE /api/save/:playerId
→ { success: true }
```

### Leaderboard

```
POST /api/leaderboard
Body: { playerName: string, memoriesStolen: number, ending: string, timeMs: number }
→ { success: true, rank: 3 }

GET /api/leaderboard?limit=10
→ { leaderboard: [ { id, playerName, memoriesStolen, ending, timeMs, submittedAt }, ... ] }
```

> **Note:** The current backend uses in-memory storage. Data resets when the server restarts.
> To persist data, replace the `Map`/`Array` stores in `server/routes/` with a database (SQLite, MongoDB, PostgreSQL, etc.).

---

## Controls

### Desktop

| Key | Action |
|---|---|
| `W` / `↑` | Move up |
| `S` / `↓` | Move down |
| `A` / `←` | Move left |
| `D` / `→` | Move right |
| `E` or `Space` | Steal memory (when near NPC) |
| `Click` | Dismiss dialogue |

### Mobile

| Control | Action |
|---|---|
| Left joystick | Move in any direction |
| `STEAL` button | Steal memory |
| Tap anywhere | Dismiss dialogue |

---

## Endings Guide

There are **3 distinct endings** based on how many memories you steal:

| Ending | Condition | Title |
|---|---|---|
| **True Ending** | Steal exactly 4 memories | 🪞 TRUE ENDING |
| **Dark Ending** | Steal all 5 memories | 🌑 DARK ENDING |
| **Incomplete** | Exit with fewer than 4 | 📖 INCOMPLETE TRUTH |

> The True Ending is the hardest to reach — you must leave the last memory untouched.

---

## Development Notes

### Adding New NPCs

Edit `src/data/npcData.ts`. Add an entry to `RAW_MEMORIES`:

```typescript
{
  text: '🔥 Something new and disturbing.',
  emotionTag: '🔥',
  position: { x: 300, y: 450 },
},
```

The corruption text is automatically generated at startup.

### Adding New Wall Rooms

Edit `WORLD.walls` in `src/engine/core/WorldMap.ts`:

```typescript
walls.push({ x: 250, y: 300, w: 20, h: 80 });
```

Collision is automatically applied to all entities.

### Adding New Endings

Edit `src/data/endingData.ts`:
1. Add to the `EndingType` union in `src/types/game.ts`
2. Add to `ENDINGS` record
3. Update `resolveEnding()` logic

### Extending the Event Bus

Add new event types to `GameEventType` in `src/types/game.ts`:

```typescript
export type GameEventType =
  | 'MEMORY_STOLEN'
  | 'YOUR_NEW_EVENT'  // ← add here
  | ...
```

Then emit/subscribe anywhere:
```typescript
eventBus.emit('YOUR_NEW_EVENT', { data: 'payload' });
eventBus.on('YOUR_NEW_EVENT', (e) => console.log(e.payload));
```

### Replacing In-Memory Storage with a Real DB

In `server/routes/save.js`, replace:
```javascript
const saves = new Map();
```
With your DB client (e.g. better-sqlite3, mongoose, pg). The route handler shape doesn't need to change.

---

## License

MIT — do whatever you want with it.

---

*Built with React, TypeScript, Vite, Zustand, Canvas 2D, Web Audio API, and Express.*
