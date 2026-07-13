import type { RepositoryScanner } from './RepositoryScanner.js';
import type { RepositorySnapshot } from './RepositorySnapshot.js';
import type { EventBus } from '../events/bus/EventBus.js';
import { FileChangeDetector } from './FileChangeDetector.js';

export class IncrementalScanner {
  constructor(
    private scanner: RepositoryScanner,
    private detector: FileChangeDetector,
    private eventBus: EventBus
  ) {}

  async scan(previousSnapshot: RepositorySnapshot): Promise<RepositorySnapshot> {
    const current = await this.scanner.scanFull(); // In reality, we'd only scan the modified files based on the FS event
    const changes = this.detector.detect(current, previousSnapshot);
    
    if (changes.added.length > 0 || changes.modified.length > 0 || changes.deleted.length > 0) {
      this.eventBus.publish({ type: 'RepositoryChanged', payload: { changes } } as any);
    }

    return current;
  }
}
