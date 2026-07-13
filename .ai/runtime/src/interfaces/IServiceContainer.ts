/**
 * Type-safe service token for dependency injection.
 *
 * Each token carries a phantom type parameter to enable compile-time
 * type checking when resolving services from the container.
 */
export interface ServiceToken<T> {
  readonly id: symbol;
  readonly name: string;
  /** Phantom field — never assigned at runtime. Enables type inference. */
  readonly _type?: T;
}

/**
 * Service container contract.
 *
 * A lightweight dependency injection container that manages service
 * registration, resolution, and singleton caching. Acts as the
 * application's service registry — no separate registry class needed.
 */
export interface IServiceContainer {
  /**
   * Registers a factory function for lazy singleton construction.
   * The factory is called at most once; subsequent resolves return the cached instance.
   *
   * @param token - A typed service token.
   * @param factory - A function that produces the service instance.
   */
  register<T>(token: ServiceToken<T>, factory: () => T): void;

  /**
   * Registers a pre-constructed instance directly.
   *
   * @param token - A typed service token.
   * @param instance - The service instance.
   */
  registerInstance<T>(token: ServiceToken<T>, instance: T): void;

  /**
   * Resolves a service by token.
   *
   * @param token - A typed service token.
   * @returns The resolved service instance.
   * @throws If the token has not been registered.
   */
  resolve<T>(token: ServiceToken<T>): T;

  /**
   * Checks whether a service token has been registered.
   *
   * @param token - A typed service token.
   * @returns `true` if the token is registered.
   */
  has<T>(token: ServiceToken<T>): boolean;
}
