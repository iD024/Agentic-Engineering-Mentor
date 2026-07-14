import path from 'node:path';
import type { ILogger } from '../interfaces/ILogger.js';
import type { IHealthCheck, HealthStatus } from '../interfaces/IHealthCheck.js';
import type { IConfigProvider } from '../interfaces/IConfigProvider.js';
import type { ILoggerFactory } from '../interfaces/ILogger.js';
import type { RuntimeState } from '../kernel/RuntimeState.js';
import type { RuntimeContext } from '../types/RuntimeContext.js';
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
import { Database } from '../database/Database.js';
import type { DatabaseConfig } from '../database/DatabaseConfig.js';
import { MigrationRunner } from '../database/MigrationRunner.js';
import { DatabaseHealthCheck } from '../database/DatabaseHealthCheck.js';
import { WorkspaceRepository } from '../repositories/WorkspaceRepository.js';
import { SessionRepository } from '../repositories/SessionRepository.js';
import { LearningRepository } from '../repositories/LearningRepository.js';
import { MilestoneRepository } from '../repositories/MilestoneRepository.js';
import { DependencyRepository } from '../repositories/DependencyRepository.js';
import { SettingsRepository } from '../repositories/SettingsRepository.js';
// Validation Platform
import {
  ValidationRegistry,
  ValidationRuntime,
  RubricEngine,
  GradingEngine,
  ReportGenerator,
  CodeCompilerValidator,
  CodeStaticAnalysisValidator,
  RepositoryStructureValidator,
  MilestoneValidator,
  CourseProgressValidator,
  ChangeValidator,
  DocumentValidator,
  ArchitectureValidator,
  DependencyRuleValidator,
  ValidateSubmissionHandler,
} from '../validation/index.js';
import { StateManager } from '../state/StateManager.js';
import { EventBus } from '../events/bus/EventBus.js';
import { ValidationMiddleware } from '../events/middleware/ValidationMiddleware.js';
import { LoggingMiddleware } from '../events/middleware/LoggingMiddleware.js';
import { MetricsMiddleware } from '../events/middleware/MetricsMiddleware.js';
import { LoggerSubscriber } from '../events/subscribers/LoggerSubscriber.js';
import { MetricsSubscriber } from '../events/subscribers/MetricsSubscriber.js';
import { HealthMonitorSubscriber } from '../events/subscribers/HealthMonitorSubscriber.js';
import { ExporterSubscriber } from '../events/subscribers/ExporterSubscriber.js';
import { QueryBus } from '../core/cqrs/QueryBus.js';
import { IgnoreManager, FileScanner, RepositoryScanner } from '../repository/index.js';
import { TreeSitterManager, ParserRegistry, ParserFactory } from '../parser/index.js';
import { SymbolTable } from '../symbols/index.js';
import { DependencyGraph, ImpactAnalyzer } from '../dependencies/index.js';
import { GraphBuilder } from '../graph/index.js';
import { RepositoryCache } from '../repository-cache/index.js';
import { RepositoryPlanner } from '../planner/index.js';
import * as Queries from '../repository-queries/index.js';
import * as Knowledge from '../knowledge/index.js';
import { CommandBus } from '../core/cqrs/CommandBus.js';
import * as Agents from '../agents/index.js';
import { GetWorkspaceQueryHandler, CompleteMilestoneCommandHandler, CreateWorkspaceCommandHandler, GetWorkspaceSummaryQueryHandler } from '../core/cqrs/index.js';
import { RuntimeGateway } from '../gateway/RuntimeGateway.js';
import { ToolRegistry, ToolLoader } from '../tool-registry/index.js';
import { SessionManager } from '../sessions/SessionManager.js';
import { ExecutionTracer } from '../telemetry/ExecutionTracer.js';
import { MetricsCollector } from '../telemetry/MetricsCollector.js';
import { MCPServer } from '../mcp/MCPServer.js';
// Tools are now loaded dynamically
/** Built-in health check: configuration status. */
class ConfigHealthCheck implements IHealthCheck {
  readonly name = 'configuration';
  private readonly config: IConfigProvider;
  constructor(config: IConfigProvider) { this.config = config; }
  async check(): Promise<HealthStatus> {
    const all = this.config.getAll();
    return { healthy: true, message: 'Configuration loaded and validated',
      details: { nodeEnv: all.nodeEnv, workspaceRoot: all.workspaceRoot } };
  }
}

/** Built-in health check: logger status. */
class LoggerHealthCheck implements IHealthCheck {
  readonly name = 'logger';
  private readonly factory: ILoggerFactory;
  constructor(factory: ILoggerFactory) { this.factory = factory; }
  async check(): Promise<HealthStatus> {
    return { healthy: true, message: 'Logger active', details: { level: this.factory.level } };
  }
}

/** Built-in health check: runtime state. */
class RuntimeStateHealthCheck implements IHealthCheck {
  readonly name = 'runtimeState';
  private readonly getState: () => RuntimeState;
  constructor(getState: () => RuntimeState) { this.getState = getState; }
  async check(): Promise<HealthStatus> {
    const state = this.getState();
    return { healthy: state === 'READY', message: `Runtime state: ${state}`, details: { state } };
  }
}

/**
 * Application bootstrap.
 *
 * Static entry point that creates all core services, owns the ServiceContainer,
 * wires dependencies, and hands control to the Kernel. This is the sole
 * location of service construction in the entire application.
 *
 * Stage 2 startup sequence:
 * 1.  Load configuration from environment
 * 2.  Validate configuration via Zod
 * 3.  Create immutable config provider
 * 4.  Create logger factory and bootstrap logger
 * 5.  Create service container
 * 6.  Create lifecycle manager
 * 7.  Create runtime events emitter
 * 8.  Create Kernel
 * 9.  Create shutdown handler and install signal hooks
 * 10. Build base RuntimeContext
 * 11. Open Database and run MigrationRunner
 * 12. Create repositories
 * 13. Create StateManager
 * 14. Build full RuntimeContext (with stateManager)
 * 15. Create Runtime (receives full context + database)
 * 16. Register Runtime with lifecycle manager
 * 17. Create health monitor with built-in + database checks
 * 18. Register all services in container
 * 19. Boot Kernel
 */
export class Bootstrap {
  static async run(): Promise<void> {
    let logger: ILogger | undefined;
    let database: Database | undefined;

    try {
      // 1-3: Configuration pipeline
      const rawEnv = ConfigLoader.load();
      const config = ConfigValidator.validate(rawEnv);
      const configProvider = ConfigProvider.create(config);

      // 4: Logger
      const loggerFactory = new LoggerFactory(config.logLevel);
      logger = loggerFactory.createLogger('Bootstrap');
      logger.info('Bootstrap starting (Stage 2)...');

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

      // 10: Base RuntimeContext (stateManager added after construction)
      const baseContext = {
        logger: loggerFactory.createLogger('App'),
        loggerFactory,
        config: configProvider,
        container,
        getState: () => kernel.state,
        workspaceRoot: config.workspaceRoot,
      };

      // 11: Database + Migrations
      const dbDir = path.join(config.workspaceRoot, 'runtime', 'data');
      const dbPath = path.join(dbDir, 'workspace.db');
      
      const fs = await import('node:fs');
      fs.mkdirSync(dbDir, { recursive: true });
      
      const dbConfig: DatabaseConfig = {
        path: config.nodeEnv === 'test' ? ':memory:' : dbPath,
        walMode: true,
        timeout: 5000,
        verbose: config.nodeEnv === 'development',
      };
      database = new Database(dbConfig);
      database.open();
      logger.info('Database opened', { path: dbConfig.path });

      const migrationRunner = new MigrationRunner();
      migrationRunner.run(database);
      logger.info('Migrations applied');

      // 12: Repositories
      const workspaceRepo = new WorkspaceRepository(database);
      const sessionRepo = new SessionRepository(database);
      const learningRepo = new LearningRepository(database);
      const milestoneRepo = new MilestoneRepository(database);
      const dependencyRepo = new DependencyRepository(database);
      const settingsRepo = new SettingsRepository(database);

      // 13: StateManager
      const stateManager = new StateManager(
        workspaceRepo, sessionRepo, learningRepo,
        milestoneRepo, dependencyRepo, settingsRepo,
      );
      logger.info('StateManager initialised');

      // 14: Full RuntimeContext
      const context: RuntimeContext = { ...baseContext, stateManager };

      // 15-16: Runtime
      const runtime = new Runtime(context, database);
      lifecycle.register('Runtime', runtime);

      // 17: Health monitor
      const healthMonitor = new HealthMonitor();
      healthMonitor.register(new ConfigHealthCheck(configProvider));
      healthMonitor.register(new LoggerHealthCheck(loggerFactory));
      healthMonitor.register(new RuntimeStateHealthCheck(() => kernel.state));
      healthMonitor.register(new DatabaseHealthCheck(database));

      // 17.5: EventBus & Messaging Layer
      const eventBus = new EventBus();
      eventBus.use(new ValidationMiddleware());
      eventBus.use(new LoggingMiddleware());
      eventBus.use(new MetricsMiddleware());

      eventBus.subscribe(new LoggerSubscriber());
      eventBus.subscribe(new MetricsSubscriber());
      eventBus.subscribe(new HealthMonitorSubscriber());
      eventBus.subscribe(new ExporterSubscriber());
      
      logger.info('EventBus messaging layer initialised');

      // 17.6: QueryBus (CQRS)
      const queryBus = new QueryBus();
      logger.info('QueryBus (CQRS) layer initialised');

      // 17.7: Repository Intelligence Engine (Stage 5)
      await TreeSitterManager.init();
      const parserRegistry = new ParserRegistry();
      const parserFactory = new ParserFactory(parserRegistry);
      
      const ignoreManager = new IgnoreManager(config.workspaceRoot);
      const fileScanner = new FileScanner(ignoreManager);
      
      const repoScanner = new RepositoryScanner(fileScanner, parserFactory, eventBus, config.workspaceRoot);
      const repoCache = new RepositoryCache(database);
      const symbolTable = new SymbolTable();
      const depGraph = new DependencyGraph();
      const repoGraph = GraphBuilder.build();
      const impactAnalyzer = new ImpactAnalyzer(depGraph);
      const repoPlanner = new RepositoryPlanner(impactAnalyzer, symbolTable);

      queryBus.register(new Queries.FindDefinitionQueryHandler(symbolTable));
      queryBus.register(new Queries.FindReferencesQueryHandler(symbolTable));
      queryBus.register(new Queries.RepositorySummaryQueryHandler(symbolTable, depGraph));
      queryBus.register(new Queries.ImpactAnalysisQueryHandler(repoPlanner.impact));
      queryBus.register(new Queries.FindSymbolQueryHandler(symbolTable));
      queryBus.register(new Queries.ListModulesQueryHandler(symbolTable));
      queryBus.register(new GetWorkspaceQueryHandler(stateManager));
      queryBus.register(new GetWorkspaceSummaryQueryHandler(stateManager));
      logger.info('Repository Intelligence Engine initialised');

      // 17.8: Engineering Knowledge Platform (Stage 7)
      const documentImporter = new Knowledge.DocumentImporter();
      const chunker = new Knowledge.Chunker();
      const embeddingProvider = new Knowledge.DeterministicEmbeddingProvider(384);
      const knowledgeGraph = new Knowledge.KnowledgeGraph();
      const knowledgeIndexer = new Knowledge.KnowledgeIndexer(embeddingProvider, knowledgeGraph);
      const knowledgeRetriever = new Knowledge.KnowledgeRetriever(knowledgeIndexer, embeddingProvider);
      const knowledgeRanker = new Knowledge.KnowledgeRanker();
      const citationEngine = new Knowledge.CitationEngine();
      const knowledgeCache = new Knowledge.KnowledgeCache();
      const knowledgeRepository = new Knowledge.KnowledgeRepository();

      queryBus.register(new Knowledge.SearchKnowledgeHandler(knowledgeRetriever, knowledgeRanker));
      queryBus.register(new Knowledge.FindTopicHandler(knowledgeGraph));
      queryBus.register(new Knowledge.FindCitationHandler(citationEngine));
      queryBus.register(new Knowledge.SummarizeKnowledgeHandler(knowledgeRetriever));
      queryBus.register(new Knowledge.RelatedTopicsHandler(knowledgeGraph));
      queryBus.register(new Knowledge.DocumentSummaryHandler(knowledgeIndexer));
      logger.info('Engineering Knowledge Platform (Stage 7) initialised');

      // 17.9: CommandBus
      const commandBus = new CommandBus();
      commandBus.register(new CompleteMilestoneCommandHandler(stateManager, eventBus));
      commandBus.register(new CreateWorkspaceCommandHandler(stateManager));
      logger.info('CommandBus initialised');

      // 18: Register all services in container
      container.registerInstance(TOKENS.Config, configProvider);
      container.registerInstance(TOKENS.Logger, logger);
      container.registerInstance(TOKENS.LoggerFactory, loggerFactory);
      container.registerInstance(TOKENS.Lifecycle, lifecycle);
      container.registerInstance(TOKENS.Container, container);
      container.registerInstance(TOKENS.HealthMonitor, healthMonitor);
      container.registerInstance(TOKENS.Kernel, kernel);
      container.registerInstance(TOKENS.Runtime, runtime);
      container.registerInstance(TOKENS.Database, database);
      container.registerInstance(TOKENS.StateManager, stateManager);
      container.registerInstance(TOKENS.EventBus, eventBus);
      container.registerInstance(TOKENS.QueryBus, queryBus);
      container.registerInstance(TOKENS.CommandBus, commandBus);
      
      // 17.9: Gateway (Stage 6)
      const sessionManager = new SessionManager();
      const executionTracer = new ExecutionTracer();
      const metricsCollector = new MetricsCollector();
      const toolRegistry = new ToolRegistry();

      const gateway = new RuntimeGateway({
        logger: loggerFactory.createLogger('Gateway'),
        workspaceRoot: config.workspaceRoot,
        runtimeVersion: '2.0.0',
        toolRegistry
      });
      
      const mcpServer = new MCPServer(gateway);

      // Load tools automatically
      const toolLoader = new ToolLoader(container, toolRegistry);
      await toolLoader.discoverAndLoad();

      container.registerInstance(TOKENS.RuntimeGateway, gateway);
      container.registerInstance(TOKENS.ToolRegistry, toolRegistry);
      container.registerInstance(TOKENS.SessionManager, sessionManager);
      container.registerInstance(TOKENS.ExecutionTracer, executionTracer);
      container.registerInstance(TOKENS.MetricsCollector, metricsCollector);

      logger.info('Runtime Gateway (Stage 6) initialised');

      // 17.10: Pedagogical Agent Platform (Stage 8)
      const agentRegistry = new Agents.AgentRegistry();
      const agentLoader = new Agents.AgentLoader(agentRegistry);
      
      const agentRuntime = new Agents.AgentRuntime({
        registry: agentRegistry,
        logger: loggerFactory.createLogger('AgentRuntime'),
      });

      // Load Built-in Pedagogical Agents
      agentLoader.loadPlugins([
        new Agents.PedagogicalOrchestrator(),
        new Agents.CurriculumStrategist(),
        new Agents.ImplementationCoach(),
        new Agents.CodeDependencyValidator()
      ]);

      container.registerInstance(TOKENS.AgentRegistry, agentRegistry);
      container.registerInstance(TOKENS.AgentRuntime, agentRuntime);

      logger.info('Pedagogical Agent Platform (Stage 8) initialised');

      // 17.11: Engineering Validation Platform (Stage 9)
      const validationRegistry = new ValidationRegistry();
      // Register all validators
      validationRegistry.register(new CodeCompilerValidator());
      validationRegistry.register(new CodeStaticAnalysisValidator());
      validationRegistry.register(new RepositoryStructureValidator([]));
      validationRegistry.register(new MilestoneValidator([]));
      validationRegistry.register(new CourseProgressValidator(0));
      validationRegistry.register(new ChangeValidator([]));
      validationRegistry.register(new DocumentValidator([]));
      validationRegistry.register(new ArchitectureValidator([]));
      validationRegistry.register(new DependencyRuleValidator());
      
      const rubricEngine = new RubricEngine();
      const gradingEngine = new GradingEngine(rubricEngine);
      const reportGenerator = new ReportGenerator();
      
      const validationRuntime = new ValidationRuntime(validationRegistry, gradingEngine, reportGenerator);
      container.registerInstance(TOKENS.ValidationRegistry, validationRegistry);
      container.registerInstance(TOKENS.ValidationRuntime, validationRuntime);
      
      // Register CQRS handlers
      queryBus.register(new ValidateSubmissionHandler(validationRuntime));

      logger.info('Engineering Validation Platform (Stage 9) initialised');

      // 19: Boot
      logger.info('All services wired, booting kernel...');
      await kernel.boot();

      // Post-boot health check
      const report = await healthMonitor.checkAll();
      logger.info('Health check complete', {
        overall: report.overall,
        checks: Object.keys(report.checks).length,
      });

      // Start the MCP Server to listen on stdio and keep the process alive
      await mcpServer.start();
      logger.info('MCP Server started and listening on stdio');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (logger) {
        logger.error(`Fatal bootstrap error: ${message}`);
      } else {
        process.stderr.write(`Fatal bootstrap error: ${message}\n`);
      }
      // Ensure database is closed on fatal error
      if (database?.isOpen()) {
        database.close();
      }
      process.exit(1);
    }
  }
}
