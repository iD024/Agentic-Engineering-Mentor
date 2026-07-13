import { watch, FSWatcher } from 'chokidar';
import type { IncrementalScanner } from './IncrementalScanner.js';
import type { RepositorySnapshot } from './RepositorySnapshot.js';
import type { IgnoreManager } from './IgnoreManager.js';

export class RepositoryWatcher {
  private watcher?: FSWatcher;

  constructor(
    private incrementalScanner: IncrementalScanner,
    private ignoreManager: IgnoreManager,
    private workspaceRoot: string,
    private currentSnapshot: RepositorySnapshot
  ) {}

  start() {
    this.watcher = watch(this.workspaceRoot, {
      ignored: (path: string) => this.ignoreManager.isIgnored(path),
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher?.on('all', async () => {
      this.currentSnapshot = await this.incrementalScanner.scan(this.currentSnapshot);
    });
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
    }
  }
}
