import { IQuery, IQueryHandler, IQueryBus } from './interfaces.js';

export class QueryBus implements IQueryBus {
  private readonly handlers = new Map<string, IQueryHandler<any, any>>();

  register<TQuery extends IQuery<TResult>, TResult>(handler: IQueryHandler<TQuery, TResult>): void {
    if (this.handlers.has(handler.queryType)) {
      throw new Error(`QueryHandler for ${handler.queryType} is already registered.`);
    }
    this.handlers.set(handler.queryType, handler);
  }

  async execute<TResult>(query: IQuery<TResult>): Promise<TResult> {
    const handler = this.handlers.get(query.type);
    if (!handler) {
      throw new Error(`No QueryHandler registered for query type: ${query.type}`);
    }
    return handler.execute(query);
  }
}
