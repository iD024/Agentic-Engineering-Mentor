import type { ILogger, ILoggerFactory } from '../interfaces/ILogger.js';
import type { IConfigProvider } from '../interfaces/IConfigProvider.js';
import type { IServiceContainer } from '../interfaces/IServiceContainer.js';
import type { RuntimeState } from '../kernel/RuntimeState.js';

/**
 * Core runtime context bundling essential dependencies.
 *
 * Injected into constructors instead of passing Logger, Config, Container,
 * and other core services individually. This enables future stages to extend
 * the context (SQLite, MCP, AgentRegistry, EventBus) without changing
 * constructor signatures.
 */
export interface RuntimeContext {
  /** Primary logger for the component receiving this context. */
  readonly logger: ILogger;

  /** Logger factory for creating scoped child loggers. */
  readonly loggerFactory: ILoggerFactory;

  /** Immutable configuration provider. */
  readonly config: IConfigProvider;

  /** Service container for resolving dependencies. */
  readonly container: IServiceContainer;

  /** Current runtime state (read-only snapshot accessor). */
  readonly getState: () => RuntimeState;

  /** Absolute path to the workspace root. */
  readonly workspaceRoot: string;
}
