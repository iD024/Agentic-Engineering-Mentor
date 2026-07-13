/**
 * Runtime lifecycle event types.
 *
 * These are lightweight, synchronous events for internal lifecycle observability.
 * This is NOT the async event bus planned for later stages.
 */
export type RuntimeEventType =
  | 'RuntimeStarted'
  | 'RuntimeStopping'
  | 'RuntimeStopped'
  | 'FatalError';

/** Listener callback for runtime events. */
export type RuntimeEventListener = (data?: unknown) => void;

import type { IRuntimeEvents } from '../../interfaces/IRuntimeEvents.js';

/**
 * Lightweight synchronous event emitter for runtime lifecycle events.
 *
 * Used by the Kernel to announce state transitions. Listeners are invoked
 * synchronously in registration order. This enables observability during
 * boot and shutdown without introducing asynchronous architecture prematurely.
 */
export class RuntimeEvents implements IRuntimeEvents {
  private readonly listeners = new Map<RuntimeEventType, RuntimeEventListener[]>();

  /**
   * Subscribes a listener to a runtime event.
   *
   * @param event - The event type to listen for.
   * @param listener - Callback invoked when the event fires.
   */
  on(event: RuntimeEventType, listener: RuntimeEventListener): void {
    const existing = this.listeners.get(event) ?? [];
    existing.push(listener);
    this.listeners.set(event, existing);
  }

  /**
   * Emits a runtime event, invoking all registered listeners synchronously.
   *
   * @param event - The event type to emit.
   * @param data - Optional data payload for listeners.
   */
  emit(event: RuntimeEventType, data?: unknown): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) {
      return;
    }
    for (const listener of eventListeners) {
      listener(data);
    }
  }
}
