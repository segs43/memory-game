// src/utils/ApiClient.ts
// ─────────────────────────────────────────────────────────────
// Typed HTTP client for communicating with the Express backend.
// All API calls go through here — no fetch() scattered in systems.
// ─────────────────────────────────────────────────────────────
const BASE = '/api';
async function post(path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok)
        throw new Error(`API ${path} → ${res.status}`);
    return res.json();
}
async function get(path) {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok)
        throw new Error(`API GET ${path} → ${res.status}`);
    return res.json();
}
async function patch(path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok)
        throw new Error(`API PATCH ${path} → ${res.status}`);
    return res.json();
}
export const ApiClient = {
    async saveSession(data) {
        try {
            await post('/save', data);
        }
        catch (e) {
            console.warn('[ApiClient] saveSession failed (offline?)', e);
        }
    },
    async loadSession(sessionId) {
        try {
            const res = await get(`/save/${sessionId}`);
            return res.record;
        }
        catch {
            return null;
        }
    },
    async getLeaderboard(limit = 20) {
        try {
            const res = await get(`/leaderboard?limit=${limit}`);
            return res.entries;
        }
        catch {
            return [];
        }
    },
    async updateProgress(sessionId, memoriesStolen) {
        try {
            await patch(`/progress/${sessionId}`, { memoriesStolen });
        }
        catch {
            // Non-critical — fail silently
        }
    },
};
