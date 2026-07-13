import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LifecycleManager } from '../../../src/core/lifecycle/LifecycleManager.js';
import type { ILifecycle } from '../../../src/interfaces/ILifecycle.js';
import type { ILogger } from '../../../src/interfaces/ILogger.js';

function createMockLogger(): ILogger {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

function createMockService(overrides?: Partial<ILifecycle>): ILifecycle {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('LifecycleManager', () => {
  let logger: ILogger;
  let manager: LifecycleManager;

  beforeEach(() => {
    logger = createMockLogger();
    manager = new LifecycleManager(logger);
  });

  it('starts services in registration order', async () => {
    const order: string[] = [];
    const svcA = createMockService({
      start: vi.fn(async () => { order.push('A'); }),
    });
    const svcB = createMockService({
      start: vi.fn(async () => { order.push('B'); }),
    });
    const svcC = createMockService({
      start: vi.fn(async () => { order.push('C'); }),
    });

    manager.register('A', svcA);
    manager.register('B', svcB);
    manager.register('C', svcC);

    await manager.startAll();

    expect(order).toEqual(['A', 'B', 'C']);
  });

  it('stops services in reverse registration order', async () => {
    const order: string[] = [];
    const svcA = createMockService({
      stop: vi.fn(async () => { order.push('A'); }),
    });
    const svcB = createMockService({
      stop: vi.fn(async () => { order.push('B'); }),
    });
    const svcC = createMockService({
      stop: vi.fn(async () => { order.push('C'); }),
    });

    manager.register('A', svcA);
    manager.register('B', svcB);
    manager.register('C', svcC);

    await manager.stopAll();

    expect(order).toEqual(['C', 'B', 'A']);
  });

  it('throws when a service fails to start', async () => {
    const failing = createMockService({
      start: vi.fn().mockRejectedValue(new Error('start failed')),
    });

    manager.register('Failing', failing);

    await expect(manager.startAll()).rejects.toThrow('start failed');
  });

  it('continues stopping remaining services when one fails', async () => {
    const order: string[] = [];
    const svcA = createMockService({
      stop: vi.fn(async () => { order.push('A'); }),
    });
    const svcB = createMockService({
      stop: vi.fn().mockRejectedValue(new Error('stop failed')),
    });
    const svcC = createMockService({
      stop: vi.fn(async () => { order.push('C'); }),
    });

    manager.register('A', svcA);
    manager.register('B', svcB);
    manager.register('C', svcC);

    await manager.stopAll();

    // C stops first (reverse), B fails, A still stops
    expect(order).toEqual(['C', 'A']);
    expect(logger.error).toHaveBeenCalled();
  });

  it('logs service names during start and stop', async () => {
    const svc = createMockService();
    manager.register('TestService', svc);

    await manager.startAll();
    await manager.stopAll();

    const infoCalls = (logger.info as ReturnType<typeof vi.fn>).mock.calls.map(
      (call: unknown[]) => call[0],
    );
    expect(infoCalls).toContain('Starting service: TestService');
    expect(infoCalls).toContain('Service started: TestService');
    expect(infoCalls).toContain('Stopping service: TestService');
    expect(infoCalls).toContain('Service stopped: TestService');
  });
});
