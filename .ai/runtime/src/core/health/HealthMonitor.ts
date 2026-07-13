import type {
  IHealthCheck,
  IHealthMonitor,
  HealthReport,
  HealthStatus,
} from '../../interfaces/IHealthCheck.js';

/**
 * Health monitor.
 *
 * Aggregates individual health checks into a unified health report.
 * New checks are registered via `register()` without modifying the
 * monitor implementation — open for extension, closed for modification.
 *
 * Stage 1 ships with built-in checks for configuration, logger, and
 * runtime state. Future stages register Database, MCP, AgentRegistry,
 * and RepositoryPlanner checks.
 */
export class HealthMonitor implements IHealthMonitor {
  private readonly checks: IHealthCheck[] = [];

  /**
   * Registers a health check.
   *
   * @param check - An IHealthCheck implementation.
   */
  register(check: IHealthCheck): void {
    this.checks.push(check);
  }

  /**
   * Runs all registered checks and returns an aggregated report.
   *
   * Individual check failures do not prevent other checks from running.
   * A failing check is reported with `healthy: false` in the aggregated
   * report rather than throwing.
   */
  async checkAll(): Promise<HealthReport> {
    const results: Record<string, HealthStatus> = {};
    let overall = true;

    for (const check of this.checks) {
      try {
        const status = await check.check();
        results[check.name] = status;
        if (!status.healthy) {
          overall = false;
        }
      } catch (err) {
        results[check.name] = {
          healthy: false,
          message: err instanceof Error ? err.message : String(err),
        };
        overall = false;
      }
    }

    return {
      overall,
      checks: results,
      timestamp: new Date().toISOString(),
    };
  }
}
