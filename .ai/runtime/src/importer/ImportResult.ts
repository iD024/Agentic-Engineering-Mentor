/**
 * Result of a workspace import operation.
 *
 * Returned by any importer so callers can handle partial failures
 * without using exception flow for expected conditions.
 */
export interface ImportResult {
  /** True if the import completed without fatal errors. */
  readonly success: boolean;

  /**
   * The id of the workspace that was created or updated.
   * Only set when success is true.
   */
  readonly workspaceId?: string;

  /**
   * Human-readable error message.
   * Only set when success is false.
   */
  readonly error?: string;

  /**
   * Any non-fatal warnings encountered during import.
   */
  readonly warnings: string[];

  /** Files that were successfully processed. */
  readonly processedFiles: string[];
}
