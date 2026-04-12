// src/backend/store/memoryStore.js
// ─────────────────────────────────────────────────────────────
// In-memory data store for the backend.
// In production, swap this for a real database (PostgreSQL, Redis).
// ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} SaveRecord
 * @property {string} sessionId
 * @property {number} memoriesStolen
 * @property {string|null} ending
 * @property {number} timeSurvived
 * @property {number} timestamp
 */

/** @type {Map<string, SaveRecord>} */
const saves = new Map();

/** @type {SaveRecord[]} */
let leaderboard = [];

const MAX_LEADERBOARD = 100;

export const memoryStore = {
  // ── Save ──────────────────────────────────────────────────────
  save(record) {
    saves.set(record.sessionId, { ...record });
    this.updateLeaderboard(record);
    return record;
  },

  getSave(sessionId) {
    return saves.get(sessionId) ?? null;
  },

  // ── Leaderboard ───────────────────────────────────────────────
  updateLeaderboard(record) {
    if (!record.ending) return; // Only completed sessions

    // Remove existing entry for this session
    leaderboard = leaderboard.filter(r => r.sessionId !== record.sessionId);

    // Add new entry
    leaderboard.push({ ...record });

    // Sort by memoriesStolen desc, then timeSurvived asc
    leaderboard.sort((a, b) => {
      if (b.memoriesStolen !== a.memoriesStolen) return b.memoriesStolen - a.memoriesStolen;
      return a.timeSurvived - b.timeSurvived;
    });

    // Cap size
    if (leaderboard.length > MAX_LEADERBOARD) {
      leaderboard = leaderboard.slice(0, MAX_LEADERBOARD);
    }
  },

  getLeaderboard(limit = 20) {
    return leaderboard.slice(0, Math.min(limit, MAX_LEADERBOARD));
  },

  // ── Progress (running session) ─────────────────────────────────
  /** @type {Map<string, {memoriesStolen: number, timestamp: number}>} */
  _progress: new Map(),

  updateProgress(sessionId, memoriesStolen) {
    this._progress.set(sessionId, { memoriesStolen, timestamp: Date.now() });
  },

  getProgress(sessionId) {
    return this._progress.get(sessionId) ?? null;
  },
};
