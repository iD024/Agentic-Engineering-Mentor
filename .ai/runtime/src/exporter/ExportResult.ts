/**
 * Result of a workspace export operation.
 */
export interface ExportResult {
  /** True if the export completed without fatal errors. */
  readonly success: boolean;

  /**
   * Absolute path to the exported file.
   * Only set when success is true.
   */
  readonly outputPath?: string;

  /**
   * Human-readable error message.
   * Only set when success is false.
   */
  readonly error?: string;

  /** Non-fatal warnings encountered during export. */
  readonly warnings: string[];
}
