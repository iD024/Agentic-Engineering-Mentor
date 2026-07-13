/**
 * Version tracking for the runtime state.
 *
 * Why this exists: As the runtime evolves through multiple stages, each
 * stage may introduce incompatible schema or workspace format changes.
 * StateVersion makes the current versions of the schema, workspace format,
 * and runtime explicit — enabling future migration compatibility checks.
 *
 * In later stages, StateVersion will be compared against the database's
 * schema_version table to detect whether the running runtime is compatible
 * with the persisted data.
 */
export interface StateVersion {
  /**
   * The SQLite schema version currently applied.
   * Must match the highest migration version in schema_version.
   */
  readonly schemaVersion: number;

  /**
   * The workspace JSON format version.
   * Incremented when workspace.json schema changes.
   */
  readonly workspaceFormatVersion: string;

  /**
   * The runtime software version.
   */
  readonly runtimeVersion: string;

  /**
   * The stage of the runtime that produced this version record.
   */
  readonly stage: number;
}

/** The canonical version for Stage 2. */
export const STAGE2_VERSION: StateVersion = {
  schemaVersion: 4,
  workspaceFormatVersion: '1.0',
  runtimeVersion: '2.0.0',
  stage: 2,
};
