import type { IServiceContainer, ServiceToken } from '../../interfaces/IServiceContainer.js';

/**
 * Lightweight dependency injection container.
 *
 * Manages service registration, resolution, and singleton caching.
 * Acts as the application's service registry — no separate registry needed.
 * Supports both lazy factory-based registration and eager instance registration.
 */
export class ServiceContainer implements IServiceContainer {
  private readonly factories = new Map<symbol, () => unknown>();
  private readonly instances = new Map<symbol, unknown>();

  /**
   * Registers a factory function for lazy singleton construction.
   *
   * The factory is invoked at most once on the first `resolve()` call.
   * Subsequent resolves return the cached instance.
   *
   * @param token - A typed service token.
   * @param factory - A function that produces the service instance.
   */
  register<T>(token: ServiceToken<T>, factory: () => T): void {
    this.factories.set(token.id, factory);
    this.instances.delete(token.id);
  }

  /**
   * Registers a pre-constructed instance directly.
   *
   * @param token - A typed service token.
   * @param instance - The service instance.
   */
  registerInstance<T>(token: ServiceToken<T>, instance: T): void {
    this.instances.set(token.id, instance);
    this.factories.delete(token.id);
  }

  /**
   * Resolves a service by token.
   *
   * If a factory is registered and the instance has not been created yet,
   * the factory is called and the result is cached for future resolves.
   *
   * @param token - A typed service token.
   * @returns The resolved service instance.
   * @throws Error if the token has not been registered.
   */
  resolve<T>(token: ServiceToken<T>): T {
    if (this.instances.has(token.id)) {
      return this.instances.get(token.id) as T;
    }

    const factory = this.factories.get(token.id);
    if (!factory) {
      throw new Error(`Service not registered: ${token.name}`);
    }

    const instance = factory() as T;
    this.instances.set(token.id, instance);
    this.factories.delete(token.id);

    return instance;
  }

  /**
   * Checks whether a service token has been registered.
   *
   * @param token - A typed service token.
   * @returns `true` if the token is registered (as factory or instance).
   */
  has<T>(token: ServiceToken<T>): boolean {
    return this.instances.has(token.id) || this.factories.has(token.id);
  }
}
