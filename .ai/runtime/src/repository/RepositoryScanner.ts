import type { FileScanner } from './FileScanner.js';
import type { EventBus } from '../events/bus/EventBus.js';
import type { ParserFactory } from '../parser/ParserFactory.js';
import { LanguageDetector } from './LanguageDetector.js';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { RepositorySnapshot } from './RepositorySnapshot.js';

export class RepositoryScanner {
  constructor(
    private fileScanner: FileScanner,
    private parserFactory: ParserFactory,
    private eventBus: EventBus,
    private workspaceRoot: string
  ) {}

  async scanFull(): Promise<RepositorySnapshot> {
    const files = await this.fileScanner.scan(this.workspaceRoot);
    const hashes = new Map<string, string>();
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      hashes.set(file, hash);

      const lang = LanguageDetector.detect(file);
      if (lang) {
        try {
          const parser = this.parserFactory.createParser(lang);
          const ast = parser.parse(content);
          // Assuming EventBus accepts generic any type for now
          this.eventBus.publish({ type: 'FileParsed', payload: { file, ast } } as any);
        } catch (e) {
          // ignore unsupported or uninitialized parsers
        }
      }
    }

    const snapshot = new RepositorySnapshot(Date.now(), hashes, '1.0.0');
    this.eventBus.publish({ type: 'RepositoryScanned', payload: { snapshot } } as any);
    this.eventBus.publish({ type: 'RepositoryReady', payload: {} } as any);
    return snapshot;
  }
}
