import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Kernel } from '../../src/kernel/Kernel.js';
import { RuntimeState } from '../../src/kernel/RuntimeState.js';
import { RuntimeEvents } from '../../src/core/events/RuntimeEvents.js';
import type { ILifecycleManager } from '../../src/interfaces/ILifecycle.js';
import type { ILogger } from '../../src/interfaces/ILogger.js';

function createMockLogger(): ILogger {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

function createMockLifecycle(overrides?: Partial<ILifecycleManager>): ILifecycleManager {
  return {
    register: vi.fn(),
    startAll: vi.fn().mockResolvedValue(undefined),
    stopAll: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('Kernel', () => {
  let logger: ILogger;
  let lifecycle: ILifecycleManager;
  let events: RuntimeEvents;
  let kernel: Kernel;

  beforeEach(() => {
    logger = createMockLogger();
    lifecycle = createMockLifecycle();
    events = new RuntimeEvents();
    kernel = new Kernel(lifecycle, events, logger);
  });

  describe('initial state', () => {
    it('starts in CREATED state', () => {
      expect(kernel.state).toBe(RuntimeState.CREATED);
    });
  });

  describe('boot()', () => {
    it('transitions CREATED → BOOTING → READY on success', async () => {
      const states: RuntimeState[] = [];

      // Capture state during startAll
      (lifecycle.startAll as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        states.push(kernel.state);
      });

      await kernel.boot();

      expect(states).toEqual([RuntimeState.BOOTING]);
      expect(kernel.state).toBe(RuntimeState.READY);
    });

    it('emits RuntimeStarted on successful boot', async () => {
      const listener = vi.fn();
      events.on('RuntimeStarted', listener);

      await kernel.boot();

      expect(listener).toHaveBeenCalledOnce();
    });

    it('transitions to FAILED on boot error', async () => {
      (lifecycle.startAll as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('boot failure'),
      );

      await expect(kernel.boot()).rejects.toThrow('boot failure');
      expect(kernel.state).toBe(RuntimeState.FAILED);
    });

    it('emits FatalError on boot error', async () => {
      const listener = vi.fn();
      events.on('FatalError', listener);
      const error = new Error('boot failure');
      (lifecycle.startAll as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      await expect(kernel.boot()).rejects.toThrow();
      expect(listener).toHaveBeenCalledWith(error);
    });
  });

  describe('shutdown()', () => {
    it('transitions READY → STOPPING → STOPPED on success', async () => {
      await kernel.boot();

      const states: RuntimeState[] = [];
      (lifecycle.stopAll as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        states.push(kernel.state);
      });

      await kernel.shutdown();

      expect(states).toEqual([RuntimeState.STOPPING]);
      expect(kernel.state).toBe(RuntimeState.STOPPED);
    });

    it('emits RuntimeStopping and RuntimeStopped', async () => {
      await kernel.boot();

      const stoppingListener = vi.fn();
      const stoppedListener = vi.fn();
      events.on('RuntimeStopping', stoppingListener);
      events.on('RuntimeStopped', stoppedListener);

      await kernel.shutdown();

      expect(stoppingListener).toHaveBeenCalledOnce();
      expect(stoppedListener).toHaveBeenCalledOnce();
    });

    it('transitions to FAILED on shutdown error', async () => {
      await kernel.boot();
      (lifecycle.stopAll as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('shutdown failure'),
      );

      await expect(kernel.shutdown()).rejects.toThrow('shutdown failure');
      expect(kernel.state).toBe(RuntimeState.FAILED);
    });

    it('is idempotent — duplicate shutdown is a no-op', async () => {
      await kernel.boot();
      await kernel.shutdown();
      await kernel.shutdown(); // should not throw

      expect(lifecycle.stopAll).toHaveBeenCalledOnce();
    });
  });
});
