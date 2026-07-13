import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Extracts structured data from legacy Markdown files in `.ai/core/`.
 *
 * Why this exists: The v1 workspace stores human-readable state in Markdown
 * files. The importer's job is to read those files and return plain data
 * that WorkspaceImporter can persist via StateManager. MarkdownImporter
 * is intentionally simple — it reads, it parses, it returns. No database.
 *
 * Why a separate class: WorkspaceImporter handles the orchestration and
 * StateManager interaction. MarkdownImporter handles only the parsing of
 * Markdown-based legacy files. Splitting them means the Markdown parsing
 * logic can be tested without any database, and WorkspaceImporter can
 * be tested without any file system parsing.
 *
 * Extensibility: future importers for other formats (YAML, TOML) follow
 * the same pattern — a focused parser class + integration into WorkspaceImporter.
 */
export class MarkdownImporter {
  /**
   * Reads a Markdown file from the legacy workspace and returns its content.
   *
   * @param root - Absolute path to the workspace root.
   * @param relativePath - Path relative to root.
   * @returns The file content, or null if the file does not exist.
   */
  readFile(root: string, relativePath: string): string | null {
    const fullPath = join(root, relativePath);
    if (!existsSync(fullPath)) return null;
    return readFileSync(fullPath, 'utf-8');
  }

  /**
   * Extracts the first H1 title from a Markdown document.
   *
   * @param content - Markdown content string.
   * @returns The title text, or null if no H1 found.
   */
  extractTitle(content: string): string | null {
    const match = /^#\s+(.+)$/m.exec(content);
    return match?.[1]?.trim() ?? null;
  }
}
