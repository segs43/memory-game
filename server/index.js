'use strict';

const express          = require('express');
const cors             = require('cors');
const saveRoutes       = require('./routes/save');
const leaderboardRoutes = require('./routes/leaderboard');
const { requestLogger } = require('./middleware/logger');

const app  = express();
const PORT = process.env.PORT || 9800;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:8900',
    'http://127.0.0.1:8900',
    ...(process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN] : []),
  ],
  methods: ['GET', 'POST', 'DELETE'],
}));
app.use(express.json({ limit: '16kb' }));
app.use(requestLogger);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/save',        saveRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`╔══════════════════════════════════╗`);
  console.log(`║   🧠  Memory Thief  — Server     ║`);
  console.log(`║   http://localhost:${PORT}         ║`);
  console.log(`╚══════════════════════════════════╝`);
});
