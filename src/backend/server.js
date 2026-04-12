// src/backend/server.js
// ─────────────────────────────────────────────────────────────
// Node.js + Express backend for Memory Thief.
// Provides clean modular REST API for saves, leaderboard,
// and session progress. Ready for multiplayer expansion.
// ─────────────────────────────────────────────────────────────

import express from 'express';
import cors from 'cors';
import { router as saveRouter } from './routes/save.js';
import { router as leaderboardRouter } from './routes/leaderboard.js';
import { router as progressRouter } from './routes/progress.js';

const app  = express();
const PORT = process.env.PORT ?? 3001;

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (dev only)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/save',        saveRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/progress',    progressRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'memory-thief-backend', timestamp: Date.now() });
});

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('[Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🧠 Memory Thief backend running → http://localhost:${PORT}`);
});

export { app };
