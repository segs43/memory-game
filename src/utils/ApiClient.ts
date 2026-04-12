// src/utils/ApiClient.ts
// ─────────────────────────────────────────────────────────────
// Typed HTTP client for communicating with the Express backend.
// All API calls go through here — no fetch() scattered in systems.
// ─────────────────────────────────────────────────────────────

import type { SaveData } from '@core/types.js';

const BASE = '/api';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API GET ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API PATCH ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const ApiClient = {
  async saveSession(data: SaveData): Promise<void> {
    try {
      await post('/save', data);
    } catch (e) {
      console.warn('[ApiClient] saveSession failed (offline?)', e);
    }
  },

  async loadSession(sessionId: string): Promise<SaveData | null> {
    try {
      const res = await get<{ success: boolean; record: SaveData }>(`/save/${sessionId}`);
      return res.record;
    } catch {
      return null;
    }
  },

  async getLeaderboard(limit = 20): Promise<SaveData[]> {
    try {
      const res = await get<{ entries: SaveData[] }>(`/leaderboard?limit=${limit}`);
      return res.entries;
    } catch {
      return [];
    }
  },

  async updateProgress(sessionId: string, memoriesStolen: number): Promise<void> {
    try {
      await patch(`/progress/${sessionId}`, { memoriesStolen });
    } catch {
      // Non-critical — fail silently
    }
  },
};
