// src/backend/routes/save.js
import { Router } from 'express';
import { memoryStore } from '../store/memoryStore.js';

export const router = Router();

// POST /api/save — Create or update a save
router.post('/', (req, res) => {
  const { sessionId, memoriesStolen, ending, timeSurvived } = req.body;

  if (!sessionId || typeof memoriesStolen !== 'number') {
    return res.status(400).json({ error: 'Missing required fields: sessionId, memoriesStolen' });
  }

  const record = memoryStore.save({
    sessionId,
    memoriesStolen,
    ending: ending ?? null,
    timeSurvived: timeSurvived ?? 0,
    timestamp: Date.now(),
  });

  return res.status(201).json({ success: true, record });
});

// GET /api/save/:sessionId — Load a save
router.get('/:sessionId', (req, res) => {
  const record = memoryStore.getSave(req.params.sessionId);
  if (!record) {
    return res.status(404).json({ error: 'Save not found' });
  }
  return res.json({ success: true, record });
});
