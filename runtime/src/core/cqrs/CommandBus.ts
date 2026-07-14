import { ICommand, ICommandHandler, ICommandBus } from './interfaces.js';

export class CommandBus implements ICommandBus {
  private readonly handlers = new Map<string, ICommandHandler<any, any>>();

  register<TCommand extends ICommand<TResult>, TResult>(handler: ICommandHandler<TCommand, TResult>): void {
    if (this.handlers.has(handler.commandType)) {
      throw new Error(`CommandHandler for ${handler.commandType} is already registered.`);
    }
    this.handlers.set(handler.commandType, handler);
  }

  async execute<TResult>(command: ICommand<TResult>): Promise<TResult> {
    const handler = this.handlers.get(command.type);
    if (!handler) {
      throw new Error(`No CommandHandler registered for command type: ${command.type}`);
    }
    return handler.execute(command);
  }
}
