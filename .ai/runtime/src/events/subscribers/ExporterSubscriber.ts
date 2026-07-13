import { Event } from '../contracts/Event.js';
import { EventHandler } from '../contracts/EventHandler.js';
import { EventSubscriber } from '../contracts/EventSubscriber.js';

export class ExporterSubscriber implements EventSubscriber {
  public readonly supportedEvents = [
    'WorkspaceExported'
  ];

  getHandler(eventType: string): EventHandler<Event> | undefined {
    if (this.supportedEvents.includes(eventType)) {
      return {
        handle: async (event: Event) => {
          console.log(`[ExporterSubscriber] Handling export event to destination:`, (event.payload as Record<string, unknown>).destinationPath);
          // Actual export logic trigger would go here if this was hooked into an exporter service
        }
      };
    }
    return undefined;
  }
}
