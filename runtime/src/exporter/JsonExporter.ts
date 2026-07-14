import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Utility for writing JSON to the file system.
 *
 * Why this exists: Separating the JSON serialization concern from the
 * WorkspaceExporter orchestration concern makes both easier to test
 * and easier to replace. JsonExporter knows HOW to write JSON. 
 * WorkspaceExporter knows WHAT to write.
 *
 * Future exporters that write YAML or TOML follow the same pattern.
 */
export class JsonExporter {
  /**
   * Serialises an object to pretty-printed JSON and writes it to disk.
   *
   * Creates parent directories if they do not exist.
   *
   * @param data - The object to serialise.
   * @param outputPath - Absolute path to write to.
   */
  write(data: unknown, outputPath: string): void {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
  }
}
