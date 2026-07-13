import type { RepositorySnapshot } from './RepositorySnapshot.js';

export class FileChangeDetector {
  detect(current: RepositorySnapshot, previous: RepositorySnapshot) {
    return current.diff(previous);
  }
}
