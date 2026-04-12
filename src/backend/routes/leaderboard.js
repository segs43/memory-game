// src/backend/routes/leaderboard.js
import { Router } from 'express';
import { memoryStore } from '../store/memoryStore.js';

export const router = Router();

// GET /api/leaderboard?limit=20
router.get('/', (req, res) => {
  const limit = Math.min(parseInt(String(req.query['limit'] ?? '20'), 10) || 20, 100);
  const entries = memoryStore.getLeaderboard(limit);
  return res.json({ success: true, entries, total: entries.length });
});
