export class RepositorySnapshot {
  constructor(
    public readonly timestamp: number,
    public readonly fileHashes: Map<string, string>,
    public readonly version: string
  ) {}

  diff(previous: RepositorySnapshot) {
    const added: string[] = [];
    const modified: string[] = [];
    const deleted: string[] = [];

    for (const [file, hash] of this.fileHashes.entries()) {
      if (!previous.fileHashes.has(file)) {
        added.push(file);
      } else if (previous.fileHashes.get(file) !== hash) {
        modified.push(file);
      }
    }

    for (const file of previous.fileHashes.keys()) {
      if (!this.fileHashes.has(file)) {
        deleted.push(file);
      }
    }

    return { added, modified, deleted };
  }
}
