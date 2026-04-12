# 🧠 Memory Thief v2.0

> *Every stolen memory steals a piece of you.*

**Made by [TawsiN](https://github.com/TawsiN)**

A professional-grade browser horror game — rebuilt from a single-file prototype into a modular, extensible indie game platform with WebGL rendering, ECS architecture, real-time corruption effects, and a full Node.js backend.

---

## ✨ What's New in v2.0

| Feature | v1 (original) | v2 (this) |
|---|---|---|
| Architecture | Monolithic `<script>` block | ECS-inspired modular systems |
| Rendering | Canvas 2D | PixiJS v8 WebGL + Canvas 2D post-FX |
| Movement | Frame-dependent | Fixed-timestep + delta-time |
| Collision | AABB only, clipping | MTV circle-vs-AABB + multi-pass resolution |
| NPC AI | Static positions | Patrol / wander / flee behaviors |
| Corruption | 5 hardcoded steps | Data-driven tier system with shader FX |
| Endings | 2 endings | 3 endings (dark, incomplete, **true** ending) |
| Mobile input | D-pad buttons | Advanced virtual joystick + haptic feedback |
| Audio | Inline oscillators | Modular AudioSystem, procedural synthesis |
| State | Global `let` variables | Zustand type-safe centralized store |
| Backend | None | Express REST API (save/leaderboard/progress) |
| Types | None | TypeScript strict mode throughout |

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (client + backend simultaneously)
npm run dev
```

Open `http://localhost:5173` in your browser.

> **Mobile:** Scan the LAN URL shown by Vite (e.g. `http://192.168.x.x:5173`) on your phone for full mobile controls.

### Other scripts

```bash
npm run dev:client   # Vite only (no backend)
npm run dev:server   # Express backend only
npm run build        # Production build → dist/
npm run preview      # Preview production build
npm run typecheck    # TypeScript check without emit
```

---

## 🏗️ Architecture Overview

```
src/
├── core/                   # Engine foundation
│   ├── types.ts            # All shared TypeScript interfaces
│   ├── GameConfig.ts       # Centralized tunable constants
│   ├── GameState.ts        # Zustand store (single source of truth)
│   ├── EventBus.ts         # Type-safe pub/sub (inter-system comms)
│   ├── GameLoop.ts         # Fixed-timestep + delta-time loop
│   └── World.ts            # Entity orchestrator — wires all systems
│
├── entities/
│   └── EntityFactory.ts    # Creates typed Player/NPC entities
│
├── systems/                # Fully decoupled system modules
│   ├── RenderSystem.ts     # PixiJS WebGL + post-FX overlay
│   ├── InputSystem.ts      # Keyboard + virtual joystick
│   ├── PhysicsSystem.ts    # MTV collision, movement, separation
│   ├── AISystem.ts         # NPC patrol / wander / flee
│   ├── CorruptionSystem.ts # Tier-based progressive effects
│   ├── DialogueSystem.ts   # Corruption-aware text display
│   ├── EffectSystem.ts     # Camera shake, particles, FX state
│   ├── AudioSystem.ts      # Procedural Web Audio synthesis
│   └── InteractionSystem.ts # Memory steal + NPC proximity
│
├── ui/
│   └── UIManager.ts        # All DOM UI (menus, HUD, mobile controls)
│
├── data/
│   └── WorldData.ts        # Map geometry, NPC seeds, ending data
│
├── utils/
│   ├── ApiClient.ts        # Typed backend HTTP client
│   └── math.ts             # Vec2 helpers, lerp, clamp, etc.
│
├── backend/                # Node.js Express server
│   ├── server.js           # Entry point, middleware
│   ├── store/memoryStore.js # In-memory data store
│   └── routes/
│       ├── save.js         # POST/GET /api/save
│       ├── leaderboard.js  # GET /api/leaderboard
│       └── progress.js     # PATCH/GET /api/progress
│
└── main.ts                 # Bootstrap — wires World + UI together
```

### Communication Pattern

Systems **never import each other directly**. All cross-system communication flows through the `EventBus`:

```
InputSystem ──emit('memory:steal')──► InteractionSystem
CorruptionSystem ──emit('effect:shake')──► EffectSystem
CorruptionSystem ──emit('ui:showEnding')──► UIManager
```

This makes every system independently testable and replaceable.

---

## 🎮 Gameplay Systems

### Corruption Tiers

| Tier | Memories | Vision | Chromatic | Glitch Rate |
|------|----------|--------|-----------|-------------|
| `stable` | 0 | 280px | 0% | 0% |
| `compromised` | 1–2 | 240px | 2% | 5% |
| `unstable` | 3–4 | 190px | 5% | 15% |
| `severe` | 5 | 140px | 9% | 25% |
| `terminal` | 6+ | 90px | 14% | 50% |

### Three Endings

| Ending | Condition |
|--------|-----------|
| **Dark** | Steal 6 memories — the void consumes you |
| **Incomplete Truth** | Exhaust all NPCs with fewer than 6 stolen |
| **True Ending** 🔮 | Steal exactly 5 memories, including the **hidden NPC** (top-right area) |

---

## 🧩 How to Extend

### Adding a New NPC

Edit `src/data/WorldData.ts` — add an entry to `NPC_SEEDS`:

```typescript
{
  id: 'npc-new',
  spawnPosition: { x: 300, y: 200 },
  memory: "💀 A new haunting memory...",
  corruptedMemory: "💀 A new h██nting mem██y...",
  uniqueColor: 0xffaa00,       // NPC glow color (hex)
  patrolPath: [                 // empty = wander AI
    { x: 300, y: 200 },
    { x: 350, y: 220 },
  ],
  speed: 40,
  fleeRadius: 80,
}
```

No other files need to change. The entity factory, AI, renderer, and interaction system all pick it up automatically.

### Adding a New Ending

1. Add the ending type to `EndingType` in `src/core/types.ts`:
   ```typescript
   export type EndingType = 'dark' | 'incomplete' | 'true' | 'your-new-ending';
   ```

2. Add ending data to `ENDING_DATA` in `src/data/WorldData.ts`:
   ```typescript
   'your-new-ending': {
     title: '🌀 YOUR TITLE',
     description: 'Your ending description.',
     unlockCondition: 'How to unlock it',
   }
   ```

3. Add the trigger logic in `CorruptionSystem.ts → checkEnding()`.

### Adding a New Room / Wall

Edit `MAP_WALLS` in `src/data/WorldData.ts`:

```typescript
{ x: 100, y: 200, w: 20, h: 80 },  // x, y, width, height
```

### Adding a Visual Shader Effect

`EffectSystem` already manages chromatic aberration, scanlines, and glitch bands. To add a new post-FX:

1. Add a field to `EffectState` in `EffectSystem.ts`
2. Emit a new event type in `EventBus.ts`
3. Render the effect in `RenderSystem.ts → renderPostFX()`

### Replacing the Renderer

The `RenderSystem` is the only file that touches PixiJS. To swap to Three.js or custom WebGL:
1. Implement the same `init()`, `initNpcs()`, `render()`, `destroy()` interface
2. Drop the replacement into `src/systems/RenderSystem.ts`
3. No other files change

### Enabling a Real Database

Replace `src/backend/store/memoryStore.js` with a PostgreSQL/Redis adapter. All routes import only from the store — the API surface stays identical.

---

## 🔧 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Renderer | **PixiJS v8** | Best-in-class 2D WebGL, mature filter pipeline |
| Language | **TypeScript 5 strict** | Type safety, catch bugs at compile time |
| Build | **Vite 5** | Instant HMR, native ESM, fastest builds |
| State | **Zustand (vanilla)** | Tiny, type-safe, no React dependency |
| Audio | **Web Audio API** | Zero dependency, full procedural synthesis |
| Backend | **Express 4** | Lightweight, clean middleware model |
| Concurrency | **concurrently** | Single `npm run dev` starts both servers |

---

## 🗺️ Roadmap (Future DLC-style Expansions)

- [ ] **Multiplayer** — Add Socket.IO to backend, sync player positions
- [ ] **Procedural map generation** — Replace static `MAP_WALLS` with dungeon generator
- [ ] **NPC memory trees** — Multi-step branching dialogue per NPC
- [ ] **WebGL shader pipeline** — Full PixiJS filter chain for chromatic/scanline
- [ ] **Save slots** — LocalStorage + backend persistence layer
- [ ] **Global leaderboard UI** — In-game leaderboard screen consuming `/api/leaderboard`
- [ ] **Mobile haptics** — `navigator.vibrate()` on memory steal

---

## 📁 Production Build

```bash
npm run build
# Output → dist/
# Serve with any static host (Netlify, Vercel, Cloudflare Pages)
```

For the backend in production, deploy `src/backend/` as a separate Node.js service (Railway, Render, Fly.io) and update the Vite proxy in `vite.config.ts`.

---

## 📝 License

MIT © TawsiN

---

*"The full truth remains buried. Try again."*
