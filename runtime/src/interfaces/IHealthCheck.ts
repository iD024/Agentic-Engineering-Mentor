/**
 * Status reported by an individual health check.
 */
export interface HealthStatus {
  readonly healthy: boolean;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Aggregated health report from all registered checks.
 */
export interface HealthReport {
  /** `true` only if every registered check is healthy. */
  readonly overall: boolean;
  /** Per-check results keyed by check name. */
  readonly checks: Record<string, HealthStatus>;
  /** ISO-8601 timestamp of when the report was generated. */
  readonly timestamp: string;
}

/**
 * Individual health check contract.
 *
 * Implementations report the health of a single subsystem (e.g., configuration,
 * logger, database). New checks are registered with the HealthMonitor without
 * modifying existing code.
 */
export interface IHealthCheck {
  /** Human-readable name identifying this check. */
  readonly name: string;

  /** Runs the health check and returns the current status. */
  check(): Promise<HealthStatus>;
}

/**
 * Health monitor contract.
 *
 * Aggregates individual health checks into a unified health report.
 * Extensible — new checks are added via `register()` without modifying
 * the monitor implementation.
 */
export interface IHealthMonitor {
  /**
   * Registers a health check.
   *
   * @param check - An IHealthCheck implementation.
   */
  register(check: IHealthCheck): void;

  /**
   * Runs all registered checks and returns an aggregated report.
   *
   * Individual check failures do not prevent other checks from running.
   */
  checkAll(): Promise<HealthReport>;
}
