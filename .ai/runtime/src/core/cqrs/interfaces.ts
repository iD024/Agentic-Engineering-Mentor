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
