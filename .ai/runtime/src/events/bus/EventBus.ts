import { Event } from '../contracts/Event.js';
import { EventSubscriber } from '../contracts/EventSubscriber.js';
import { EventMiddleware } from '../middleware/Middleware.js';
import { EventRegistry } from '../registry/EventRegistry.js';
import { EventDispatcher } from './EventDispatcher.js';

export class EventBus {
  private registry: EventRegistry;
  private dispatcher: EventDispatcher;
  private middlewarePipeline: EventMiddleware[] = [];

  constructor() {
    this.registry = new EventRegistry();
    this.dispatcher = new EventDispatcher(this.registry);
  }

  use(middleware: EventMiddleware): void {
    this.middlewarePipeline.push(middleware);
  }

  subscribe(subscriber: EventSubscriber): void {
    this.registry.register(subscriber);
  }

  unsubscribe(subscriber: EventSubscriber): void {
    this.registry.unregister(subscriber);
  }

  async publish(event: Event): Promise<void> {
    let index = 0;

    const executeMiddleware = async (): Promise<void> => {
      if (index < this.middlewarePipeline.length) {
        const middleware = this.middlewarePipeline[index++];
        await middleware.handle(event, executeMiddleware);
      } else {
        // End of pipeline, dispatch event
        await this.dispatcher.dispatch(event);
      }
    };

    await executeMiddleware();
  }
}
