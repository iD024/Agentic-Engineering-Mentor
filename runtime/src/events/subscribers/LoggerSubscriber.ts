import { Event } from '../contracts/Event.js';
import { EventHandler } from '../contracts/EventHandler.js';
import { EventSubscriber } from '../contracts/EventSubscriber.js';

export class LoggerSubscriber implements EventSubscriber {
  public readonly supportedEvents = [
    'WorkspaceLoaded',
    'SessionStarted',
    'SessionEnded',
    'RuntimeReady',
    'RuntimeStopping',
    'DatabaseConnected',
    'DatabaseDisconnected'
  ];

  getHandler(eventType: string): EventHandler<Event> | undefined {
    if (this.supportedEvents.includes(eventType)) {
      return {
        handle: async (event: Event) => {
          // Domain specific logging beyond the middleware
          process.stderr.write(`[LoggerSubscriber] Detailed log for ${event.type}: ${JSON.stringify(event.payload)}\n`);
        }
      };
    }
    return undefined;
  }
}
