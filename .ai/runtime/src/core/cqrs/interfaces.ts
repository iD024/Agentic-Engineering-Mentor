export interface IQuery<TResult = any> {
  readonly type: string;
}

export interface IQueryHandler<TQuery extends IQuery<TResult>, TResult> {
  readonly queryType: string;
  execute(query: TQuery): Promise<TResult>;
}

export interface IQueryBus {
  execute<TResult>(query: IQuery<TResult>): Promise<TResult>;
  register<TQuery extends IQuery<TResult>, TResult>(handler: IQueryHandler<TQuery, TResult>): void;
}

export interface ICommand<TResult = void> {
  readonly type: string;
}

export interface ICommandHandler<TCommand extends ICommand<TResult>, TResult> {
  readonly commandType: string;
  execute(command: TCommand): Promise<TResult>;
}

export interface ICommandBus {
  execute<TResult>(command: ICommand<TResult>): Promise<TResult>;
  register<TCommand extends ICommand<TResult>, TResult>(handler: ICommandHandler<TCommand, TResult>): void;
}
