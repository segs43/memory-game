// src/backend/server.js
// ─────────────────────────────────────────────────────────────
// Node.js + Express backend for Memory Thief.
// Auto-detects a free port if the preferred one is taken.
// ─────────────────────────────────────────────────────────────

import express from 'express';
import cors from 'cors';
import net from 'net';
import { router as saveRouter } from './routes/save.js';
import { router as leaderboardRouter } from './routes/leaderboard.js';
import { router as progressRouter } from './routes/progress.js';

const PREFERRED_PORT = parseInt(process.env.PORT ?? '3001', 10);

// ── Find a free port starting from preferred ───────────────────
function findFreePort(start) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => {
      resolve(findFreePort(start + 1));
    });
    server.listen(start, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

// ── Build Express app ──────────────────────────────────────────
const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString().slice(11,19)}] ${req.method} ${req.path}`);
    next();
  });
}

// ── Routes ────────────────────────────────────────────────────
app.use('/api/save',        saveRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/progress',    progressRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'memory-thief-backend', timestamp: Date.now() });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  console.error('[Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start with auto port fallback ─────────────────────────────
const port = await findFreePort(PREFERRED_PORT);

if (port !== PREFERRED_PORT) {
  console.warn(`⚠️  Port ${PREFERRED_PORT} busy — using :${port} instead`);
}

app.listen(port, () => {
  console.log(`🧠 Memory Thief backend → http://localhost:${port}`);
  if (port !== PREFERRED_PORT) {
    console.log(`   Vite proxy still points to :${PREFERRED_PORT} — API saves won't work`);
    console.log(`   Fix: set PORT=${port} in your shell, or kill what's on :${PREFERRED_PORT}`);
    console.log(`   Game still runs fine without the backend.`);
  }
});

export { app };
