const express = require('express');
const router = express.Router();

// In-memory leaderboard (replace with DB in production)
const entries = [];
const MAX_ENTRIES = 100;

/**
 * POST /api/leaderboard
 * Body: { playerName: string, memoriesStolen: number, ending: string, timeMs: number }
 */
router.post('/', (req, res) => {
  const { playerName, memoriesStolen, ending, timeMs } = req.body;
  if (!playerName) return res.status(400).json({ error: 'playerName required' });

  const entry = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    playerName: String(playerName).slice(0, 24),
    memoriesStolen: Number(memoriesStolen) || 0,
    ending: ending ?? 'incomplete',
    timeMs: Number(timeMs) || 0,
    submittedAt: new Date().toISOString(),
  };

  entries.push(entry);
  entries.sort((a, b) => b.memoriesStolen - a.memoriesStolen || a.timeMs - b.timeMs);
  if (entries.length > MAX_ENTRIES) entries.splice(MAX_ENTRIES);

  res.json({ success: true, rank: entries.indexOf(entry) + 1 });
});

/**
 * GET /api/leaderboard?limit=10
 */
router.get('/', (req, res) => {
  const limit = Math.min(50, parseInt(String(req.query.limit ?? '10'), 10));
  res.json({ leaderboard: entries.slice(0, limit) });
});

module.exports = router;
