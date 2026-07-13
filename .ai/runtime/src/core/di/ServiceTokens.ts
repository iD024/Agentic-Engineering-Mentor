import type { ServiceToken, IServiceContainer } from '../../interfaces/IServiceContainer.js';
import type { ILogger, ILoggerFactory } from '../../interfaces/ILogger.js';
import type { IConfigProvider } from '../../interfaces/IConfigProvider.js';
import type { ILifecycleManager, ILifecycle } from '../../interfaces/ILifecycle.js';
import type { IHealthMonitor } from '../../interfaces/IHealthCheck.js';
import type { IKernel } from '../../interfaces/IKernel.js';
import type { Database } from '../../database/Database.js';
import type { StateManager } from '../../state/StateManager.js';
import type { EventBus } from '../../events/bus/EventBus.js';

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

  // Stage 2 tokens
  Database: createToken<Database>('Database'),
  StateManager: createToken<StateManager>('StateManager'),

  // Stage 3 tokens
  EventBus: createToken<EventBus>('EventBus'),

  // Stage 4 tokens (CQRS)
  QueryBus: createToken<import('../../core/cqrs/interfaces.js').IQueryBus>('QueryBus'),
  CommandBus: createToken<import('../../core/cqrs/interfaces.js').ICommandBus>('CommandBus'),

  // Stage 6 tokens (Gateway)
  RuntimeGateway: createToken<import('../../gateway/RuntimeGateway.js').RuntimeGateway>('RuntimeGateway'),
  ToolRegistry: createToken<import('../../tool-registry/ToolRegistry.js').ToolRegistry>('ToolRegistry'),
  SessionManager: createToken<import('../../sessions/SessionManager.js').SessionManager>('SessionManager'),
  ExecutionTracer: createToken<import('../../telemetry/ExecutionTracer.js').ExecutionTracer>('ExecutionTracer'),
  MetricsCollector: createToken<import('../../telemetry/MetricsCollector.js').MetricsCollector>('MetricsCollector'),

  // Stage 8 tokens (Agent Platform)
  AgentRegistry: createToken<import('../../agents/agent-registry/AgentRegistry.js').AgentRegistry>('AgentRegistry'),
  AgentRuntime: createToken<import('../../agents/agent-runtime/AgentRuntime.js').AgentRuntime>('AgentRuntime'),
} as const;
