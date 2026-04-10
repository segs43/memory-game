const express = require('express');
const router = express.Router();

// In-memory store (replace with DB in production)
const saves = new Map();

/**
 * POST /api/save
 * Body: { playerId: string, memoriesStolen: number, ending: string | null }
 */
router.post('/', (req, res) => {
  const { playerId, memoriesStolen, ending } = req.body;
  if (!playerId) return res.status(400).json({ error: 'playerId required' });

  const save = {
    playerId,
    memoriesStolen,
    ending: ending ?? null,
    savedAt: new Date().toISOString(),
  };
  saves.set(playerId, save);
  res.json({ success: true, save });
});

/**
 * GET /api/save/:playerId
 */
router.get('/:playerId', (req, res) => {
  const save = saves.get(req.params.playerId);
  if (!save) return res.status(404).json({ error: 'No save found' });
  res.json(save);
});

/**
 * DELETE /api/save/:playerId
 */
router.delete('/:playerId', (req, res) => {
  saves.delete(req.params.playerId);
  res.json({ success: true });
});

module.exports = router;
