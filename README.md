# 🧠 Memory Thief

**Made by TawsiN**

A browser horror game. Steal memories from NPCs — but every one you take corrupts you further.

## Run

```bash
npm install
npm start
```

Open `http://localhost:3000` — that's it. No build step, no TypeScript, no API nonsense.

## Controls

| Input | Action |
|---|---|
| WASD / Arrow Keys | Move |
| E / Space / Enter | Steal memory / dismiss dialogue |
| Mobile D-pad | Move |
| STEAL button | Steal / dismiss |

## Endings

- **🌑 Dark** — steal 6 memories (the void takes you)
- **📖 Incomplete** — exhaust all NPCs without hitting 6
- **🔮 True** *(secret)* — steal exactly 5, including the hidden red NPC in the top-right corner

## Files

```
memory-thief/
├── server.js          ← Node.js + Express, auto-finds free port
├── package.json
└── public/
    └── index.html     ← the entire game (HTML + CSS + JS, no dependencies)
```

Zero build tools. Zero bundlers. The game is one HTML file served by a 20-line Express server.
