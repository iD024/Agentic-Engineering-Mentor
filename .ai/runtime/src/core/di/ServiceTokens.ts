import type { ServiceToken, IServiceContainer } from '../../interfaces/IServiceContainer.js';
import type { ILogger, ILoggerFactory } from '../../interfaces/ILogger.js';
import type { IConfigProvider } from '../../interfaces/IConfigProvider.js';
import type { ILifecycleManager, ILifecycle } from '../../interfaces/ILifecycle.js';
import type { IHealthMonitor } from '../../interfaces/IHealthCheck.js';
import type { IKernel } from '../../interfaces/IKernel.js';

/**
 * Creates a strongly typed service token.
 *
 * @param name - Human-readable name for error messages and debugging.
 * @returns A ServiceToken carrying the phantom type parameter.
 */
function createToken<T>(name: string): ServiceToken<T> {
  return { id: Symbol(name), name };
}

/**
 * Well-known service tokens for the dependency injection container.
 *
 * Use these tokens with `container.resolve(TOKENS.X)` for type-safe
 * service resolution throughout the application.
 */
export const TOKENS = {
  Config: createToken<IConfigProvider>('Config'),
  Logger: createToken<ILogger>('Logger'),
  LoggerFactory: createToken<ILoggerFactory>('LoggerFactory'),
  Lifecycle: createToken<ILifecycleManager>('Lifecycle'),
  Container: createToken<IServiceContainer>('Container'),
  HealthMonitor: createToken<IHealthMonitor>('HealthMonitor'),
  Kernel: createToken<IKernel>('Kernel'),
  Runtime: createToken<ILifecycle>('Runtime'),
} as const;

