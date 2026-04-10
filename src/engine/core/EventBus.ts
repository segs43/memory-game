import type { GameEventType, GameEvent } from '@types-game/game';

type Handler<T = unknown> = (event: GameEvent<T>) => void;

class EventBus {
  private listeners: Map<GameEventType, Set<Handler<unknown>>> = new Map();

  on<T>(type: GameEventType, handler: Handler<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler as Handler<unknown>);
    return () => this.off(type, handler);
  }

  off<T>(type: GameEventType, handler: Handler<T>): void {
    this.listeners.get(type)?.delete(handler as Handler<unknown>);
  }

  emit<T>(type: GameEventType, payload: T): void {
    const event: GameEvent<T> = { type, payload };
    this.listeners.get(type)?.forEach(handler => handler(event as GameEvent<unknown>));
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
