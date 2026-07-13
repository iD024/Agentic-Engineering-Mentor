import { Event } from '../contracts/Event.js';
import { EventHandler } from '../contracts/EventHandler.js';
import { EventSubscriber } from '../contracts/EventSubscriber.js';

export class MetricsSubscriber implements EventSubscriber {
  public readonly supportedEvents = [
    'SessionStarted',
    'SessionEnded',
    'WorkspaceLoaded',
    'LearningProgressUpdated'
  ];

  getHandler(eventType: string): EventHandler<Event> | undefined {
    if (this.supportedEvents.includes(eventType)) {
      return {
        handle: async (_event: Event): Promise<void> => {
          // Send to a telemetry/metrics system
          // console.log(`[MetricsSubscriber] Recording metric for ${event.type}`);
        }
      };
    }
    return undefined;
  }
}
