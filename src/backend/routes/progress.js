// src/backend/routes/progress.js
import { Router } from 'express';
import { memoryStore } from '../store/memoryStore.js';

export const router = Router();

// PATCH /api/progress/:sessionId — Update live session progress
router.patch('/:sessionId', (req, res) => {
  const { memoriesStolen } = req.body;
  if (typeof memoriesStolen !== 'number') {
    return res.status(400).json({ error: 'Missing memoriesStolen' });
  }
  memoryStore.updateProgress(req.params.sessionId, memoriesStolen);
  return res.json({ success: true });
});

// GET /api/progress/:sessionId
router.get('/:sessionId', (req, res) => {
  const progress = memoryStore.getProgress(req.params.sessionId);
  if (!progress) {
    return res.status(404).json({ error: 'Session not found' });
  }
  return res.json({ success: true, progress });
});
