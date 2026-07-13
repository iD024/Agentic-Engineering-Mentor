import { Event } from '../contracts/Event.js';
import { EventHandler } from '../contracts/EventHandler.js';
import { EventSubscriber } from '../contracts/EventSubscriber.js';

export class HealthMonitorSubscriber implements EventSubscriber {
  public readonly supportedEvents = [
    'DatabaseConnected',
    'DatabaseDisconnected',
    'RuntimeReady',
    'RuntimeStopping'
  ];

  getHandler(eventType: string): EventHandler<Event> | undefined {
    if (this.supportedEvents.includes(eventType)) {
      return {
        handle: async (event: Event) => {
          if (event.type === 'DatabaseDisconnected' || event.type === 'RuntimeStopping') {
            console.warn(`[HealthMonitorSubscriber] Warning: System component degraded - ${event.type}`);
            // Could trigger alerts here
          }
        }
      };
    }
    return undefined;
  }
}
