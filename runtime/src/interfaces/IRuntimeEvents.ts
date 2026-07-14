import type { RuntimeEventType } from '../core/events/RuntimeEvents.js';

/**
 * Runtime events contract.
 *
 * Allows components that need to observe lifecycle events to depend on
 * this abstraction rather than the concrete RuntimeEvents implementation.
 */
export interface IRuntimeEvents {
  /**
   * Subscribes a listener to a runtime event.
   *
   * @param event - The event type to listen for.
   * @param listener - Callback invoked synchronously when the event fires.
   */
  on(event: RuntimeEventType, listener: (data?: unknown) => void): void;

  /**
   * Emits a runtime event, invoking all registered listeners synchronously.
   *
   * @param event - The event type to emit.
   * @param data - Optional data payload.
   */
  emit(event: RuntimeEventType, data?: unknown): void;
}
