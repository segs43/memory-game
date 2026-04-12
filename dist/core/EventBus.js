// src/core/EventBus.ts
// ─────────────────────────────────────────────────────────────
// Type-safe publish/subscribe event bus.
// All inter-system communication goes through here.
// Systems never import each other — they emit and listen.
// ─────────────────────────────────────────────────────────────
class EventBus {
    listeners = new Map();
    on(event, listener) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        const set = this.listeners.get(event);
        set.add(listener);
        // Return unsubscribe function
        return () => {
            set.delete(listener);
        };
    }
    emit(event, payload) {
        const set = this.listeners.get(event);
        if (!set)
            return;
        for (const listener of set) {
            listener(payload);
        }
    }
    off(event, listener) {
        this.listeners.get(event)?.delete(listener);
    }
    clear() {
        this.listeners.clear();
    }
}
// Singleton — imported everywhere
export const bus = new EventBus();
