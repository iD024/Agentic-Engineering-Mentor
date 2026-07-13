import type { ILogger } from '../interfaces/ILogger.js';
import type { IHealthCheck, HealthStatus } from '../interfaces/IHealthCheck.js';
import type { IConfigProvider } from '../interfaces/IConfigProvider.js';
import type { ILoggerFactory } from '../interfaces/ILogger.js';
import type { RuntimeState } from '../kernel/RuntimeState.js';
import { ConfigLoader } from '../core/config/ConfigLoader.js';
import { ConfigValidator } from '../core/config/ConfigValidator.js';
import { ConfigProvider } from '../core/config/ConfigProvider.js';
import { LoggerFactory } from '../core/logger/LoggerFactory.js';
import { ServiceContainer } from '../core/di/ServiceContainer.js';
import { TOKENS } from '../core/di/ServiceTokens.js';
import { LifecycleManager } from '../core/lifecycle/LifecycleManager.js';
import { ShutdownHandler } from '../core/lifecycle/ShutdownHandler.js';
import { RuntimeEvents } from '../core/events/RuntimeEvents.js';
import { HealthMonitor } from '../core/health/HealthMonitor.js';
import { Kernel } from '../kernel/Kernel.js';
import { Runtime } from '../runtime/Runtime.js';
import type { RuntimeContext } from '../types/RuntimeContext.js';

/**
 * Built-in health check: configuration status.
 */
class ConfigHealthCheck implements IHealthCheck {
  readonly name = 'configuration';
  private readonly config: IConfigProvider;

  constructor(config: IConfigProvider) {
    this.config = config;
  }

  async check(): Promise<HealthStatus> {
    const all = this.config.getAll();
    return {
      healthy: true,
      message: 'Configuration loaded and validated',
      details: {
        nodeEnv: all.nodeEnv,
        workspaceRoot: all.workspaceRoot,
      },
    };
  }
}

/**
 * Built-in health check: logger status.
 */
class LoggerHealthCheck implements IHealthCheck {
  readonly name = 'logger';
  private readonly factory: ILoggerFactory;

  constructor(factory: ILoggerFactory) {
    this.factory = factory;
  }

  async check(): Promise<HealthStatus> {
    return {
      healthy: true,
      message: 'Logger active',
      details: { level: this.factory.level },
    };
  }
}

/**
 * Built-in health check: runtime state.
 */
class RuntimeStateHealthCheck implements IHealthCheck {
  readonly name = 'runtimeState';
  private readonly getState: () => RuntimeState;

  constructor(getState: () => RuntimeState) {
    this.getState = getState;
  }

  async check(): Promise<HealthStatus> {
    const state = this.getState();
    return {
      healthy: state === 'READY',
      message: `Runtime state: ${state}`,
      details: { state },
    };
  }
}

/**
 * Application bootstrap.
 *
 * Static entry point that creates all core services, owns the ServiceContainer,
 * wires dependencies, and hands control to the Kernel. This is the sole
 * location of service construction in the entire application.
 */
export class Bootstrap {
  /**
   * Boots the application.
   *
   * Deterministic startup sequence:
   * 1. Load configuration from environment
   * 2. Validate configuration via Zod
   * 3. Create immutable config provider
   * 4. Create logger factory and bootstrap logger
   * 5. Create service container (Bootstrap owns this)
   * 6. Create lifecycle manager
   * 7. Create runtime events emitter
   * 8. Create Kernel (receives deps via constructor)
   * 9. Create shutdown handler and install signal hooks
   * 10. Build RuntimeContext
   * 11. Create Runtime (receives context via constructor)
   * 12. Register Runtime with lifecycle manager
   * 13. Create and register health checks
   * 14. Register all services in container
   * 15. Boot the Kernel
   */
  static async run(): Promise<void> {
    let logger: ILogger | undefined;

    try {
      // 1-3: Configuration pipeline
      const rawEnv = ConfigLoader.load();
      const config = ConfigValidator.validate(rawEnv);
      const configProvider = ConfigProvider.create(config);

      // 4: Logger
      const loggerFactory = new LoggerFactory(config.logLevel);
      logger = loggerFactory.createLogger('Bootstrap');
      logger.info('Bootstrap starting...');

      // 5: Service container
      const container = new ServiceContainer();

      // 6: Lifecycle manager
      const lifecycleLogger = loggerFactory.createLogger('Lifecycle');
      const lifecycle = new LifecycleManager(lifecycleLogger);

      // 7: Runtime events
      const events = new RuntimeEvents();

      // 8: Kernel
      const kernelLogger = loggerFactory.createLogger('Kernel');
      const kernel = new Kernel(lifecycle, events, kernelLogger);

      // 9: Shutdown handler
      const shutdownLogger = loggerFactory.createLogger('Shutdown');
      const shutdownHandler = new ShutdownHandler(kernel, config.shutdownTimeoutMs, shutdownLogger);
      shutdownHandler.install();

      // 10: RuntimeContext
      const context: RuntimeContext = {
        logger: loggerFactory.createLogger('App'),
        loggerFactory,
        config: configProvider,
        container,
        getState: () => kernel.state,
        workspaceRoot: config.workspaceRoot,
      };

      // 11-12: Runtime
      const runtime = new Runtime(context);
      lifecycle.register('Runtime', runtime);

      // 13: Health monitor with built-in checks
      const healthMonitor = new HealthMonitor();
      healthMonitor.register(new ConfigHealthCheck(configProvider));
      healthMonitor.register(new LoggerHealthCheck(loggerFactory));
      healthMonitor.register(new RuntimeStateHealthCheck(() => kernel.state));

      // 14: Register all services in container
      container.registerInstance(TOKENS.Config, configProvider);
      container.registerInstance(TOKENS.Logger, logger);
      container.registerInstance(TOKENS.LoggerFactory, loggerFactory);
      container.registerInstance(TOKENS.Lifecycle, lifecycle);
      container.registerInstance(TOKENS.Container, container);
      container.registerInstance(TOKENS.HealthMonitor, healthMonitor);
      container.registerInstance(TOKENS.Kernel, kernel);
      container.registerInstance(TOKENS.Runtime, runtime);

      // 15: Boot
      logger.info('All services wired, booting kernel...');
      await kernel.boot();

      // Post-boot health check
      const report = await healthMonitor.checkAll();
      logger.info('Health check complete', {
        overall: report.overall,
        checks: Object.keys(report.checks).length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (logger) {
        logger.error(`Fatal bootstrap error: ${message}`);
      } else {
        process.stderr.write(`Fatal bootstrap error: ${message}\n`);
      }
      process.exit(1);
    }
  }
}
