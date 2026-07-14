import { describe, it, expect, vi } from 'vitest';
import { HealthMonitor } from '../../../src/core/health/HealthMonitor.js';
import type { IHealthCheck, HealthStatus } from '../../../src/interfaces/IHealthCheck.js';

function createMockCheck(
  name: string,
  result: HealthStatus,
): IHealthCheck {
  return {
    name,
    check: vi.fn().mockResolvedValue(result),
  };
}

describe('HealthMonitor', () => {
  it('returns an overall healthy report when all checks pass', async () => {
    const monitor = new HealthMonitor();
    monitor.register(createMockCheck('check1', { healthy: true, message: 'OK' }));
    monitor.register(createMockCheck('check2', { healthy: true, message: 'OK' }));

    const report = await monitor.checkAll();

    expect(report.overall).toBe(true);
    expect(Object.keys(report.checks)).toHaveLength(2);
    expect(report.checks['check1']!.healthy).toBe(true);
    expect(report.checks['check2']!.healthy).toBe(true);
    expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('returns overall unhealthy when any check fails', async () => {
    const monitor = new HealthMonitor();
    monitor.register(createMockCheck('healthy', { healthy: true, message: 'OK' }));
    monitor.register(createMockCheck('unhealthy', { healthy: false, message: 'Down' }));

    const report = await monitor.checkAll();

    expect(report.overall).toBe(false);
    expect(report.checks['healthy']!.healthy).toBe(true);
    expect(report.checks['unhealthy']!.healthy).toBe(false);
  });

  it('handles throwing checks without aborting others', async () => {
    const monitor = new HealthMonitor();
    monitor.register(createMockCheck('good', { healthy: true, message: 'OK' }));
    monitor.register({
      name: 'throwing',
      check: vi.fn().mockRejectedValue(new Error('check exploded')),
    });
    monitor.register(createMockCheck('also-good', { healthy: true, message: 'OK' }));

    const report = await monitor.checkAll();

    expect(report.overall).toBe(false);
    expect(report.checks['throwing']!.healthy).toBe(false);
    expect(report.checks['throwing']!.message).toBe('check exploded');
    expect(report.checks['good']!.healthy).toBe(true);
    expect(report.checks['also-good']!.healthy).toBe(true);
  });

  it('returns an empty report when no checks registered', async () => {
    const monitor = new HealthMonitor();
    const report = await monitor.checkAll();

    expect(report.overall).toBe(true);
    expect(Object.keys(report.checks)).toHaveLength(0);
  });

  it('includes details in health status when provided', async () => {
    const monitor = new HealthMonitor();
    monitor.register(
      createMockCheck('detailed', {
        healthy: true,
        message: 'All good',
        details: { version: '1.0', uptime: 100 },
      }),
    );

    const report = await monitor.checkAll();
    expect(report.checks['detailed']!.details).toEqual({ version: '1.0', uptime: 100 });
  });
});
