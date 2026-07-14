import type { ILifecycle } from '../interfaces/ILifecycle.js';
import type { RuntimeContext } from '../types/RuntimeContext.js';
import type { ILogger } from '../interfaces/ILogger.js';
import { WorkspaceImporter } from '../importer/WorkspaceImporter.js';
import { WorkspaceExporter } from '../exporter/WorkspaceExporter.js';
import { WorkspaceRepository } from '../repositories/WorkspaceRepository.js';
import type { Database } from '../database/Database.js';

/**
 * The running application.
 *
 * Receives all dependencies via constructor injection through RuntimeContext.
 * Contains no construction logic. Implements ILifecycle so the Kernel can
 * manage it via the LifecycleManager.
 *
 * Stage 2 additions:
 *   - start() runs WorkspaceImporter to seed SQLite from v1 workspace files
 *   - stop() runs WorkspaceExporter to write the canonical workspace.json
 *     and flushes the StateManager cache
 */
export class Runtime implements ILifecycle {
  private readonly logger: ILogger;
  private readonly context: RuntimeContext;
  private readonly importer: WorkspaceImporter;
  private readonly exporter: WorkspaceExporter;

  constructor(context: RuntimeContext, db: Database) {
    this.context = context;
    this.logger = context.loggerFactory.createLogger('Runtime');
    this.importer = new WorkspaceImporter(context.stateManager);
    this.exporter = new WorkspaceExporter(
      context.stateManager,
      new WorkspaceRepository(db),
    );
  }

  /**
   * Starts the runtime application.
   *
   * Stage 2: imports the legacy v1 workspace into SQLite.
   * Called by the LifecycleManager during the Kernel boot sequence.
   */
  async start(): Promise<void> {
    this.logger.info('Runtime starting', { workspaceRoot: this.context.workspaceRoot });

    const importResult = await this.importer.import(this.context.workspaceRoot);
    if (importResult.success) {
      this.logger.info('Workspace imported', {
        workspaceId: importResult.workspaceId,
        warnings: importResult.warnings.length,
      });

      // Wire the WorkspaceSaved event to trigger automatic export.
      this.context.stateManager.events.on('WorkspaceSaved', ({ workspace }) => {
        void this.exporter.export(this.context.workspaceRoot, workspace.id).then(result => {
          if (!result.success) {
            this.logger.warn('Workspace export failed', { error: result.error });
          }
        });
      });
    } else {
      this.logger.warn('Workspace import failed — continuing with empty state', {
        error: importResult.error,
      });
    }

    this.logger.info('Runtime started', { state: this.context.getState() });
  }

  /**
   * Stops the runtime application.
   *
   * Stage 2: flushes cache and writes a final workspace.json export.
   * Called by the LifecycleManager during graceful shutdown.
   */
  async stop(): Promise<void> {
    this.logger.info('Runtime stopping — flushing state...');

    const workspaceId = this.context.stateManager.getSetting('workspace.primaryId');
    if (workspaceId) {
      const result = await this.exporter.export(this.context.workspaceRoot, workspaceId);
      if (result.success) {
        this.logger.info('Final workspace export complete', { path: result.outputPath });
      } else {
        this.logger.warn('Final workspace export failed', { error: result.error });
      }
    }

    this.context.stateManager.flushCache();
    this.logger.info('Runtime stopped');
  }
}
