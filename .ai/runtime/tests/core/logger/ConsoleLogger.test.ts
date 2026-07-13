import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockInstance } from 'vitest';
import { ConsoleLogger } from '../../../src/core/logger/ConsoleLogger.js';
import { LogLevel } from '../../../src/types/LogLevel.js';

describe('ConsoleLogger', () => {
  let stdoutSpy: MockInstance;
  let stderrSpy: MockInstance;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    stderrSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
  });

  it('writes info messages to stdout', () => {
    const logger = new ConsoleLogger(LogLevel.DEBUG);
    logger.info('test message');
    expect(stdoutSpy).toHaveBeenCalledOnce();
    expect(stdoutSpy.mock.calls[0]![0]).toContain('[INFO]');
    expect(stdoutSpy.mock.calls[0]![0]).toContain('test message');
  });

  it('writes error messages to stderr', () => {
    const logger = new ConsoleLogger(LogLevel.DEBUG);
    logger.error('error message');
    expect(stderrSpy).toHaveBeenCalledOnce();
    expect(stderrSpy.mock.calls[0]![0]).toContain('[ERROR]');
    expect(stderrSpy.mock.calls[0]![0]).toContain('error message');
  });

  it('filters messages below configured level', () => {
    const logger = new ConsoleLogger(LogLevel.WARN);
    logger.debug('should not appear');
    logger.info('should not appear');
    logger.warn('should appear');
    logger.error('should appear');
    expect(stdoutSpy).toHaveBeenCalledOnce(); // only warn
    expect(stderrSpy).toHaveBeenCalledOnce(); // only error
  });

  it('includes prefix in formatted output', () => {
    const logger = new ConsoleLogger(LogLevel.DEBUG, 'TestPrefix');
    logger.info('hello');
    const output = stdoutSpy.mock.calls[0]![0] as string;
    expect(output).toContain('[TestPrefix]');
  });

  it('omits prefix segment when no prefix is provided', () => {
    const logger = new ConsoleLogger(LogLevel.DEBUG);
    logger.info('hello');
    const output = stdoutSpy.mock.calls[0]![0] as string;
    expect(output).not.toContain('[]');
  });

  it('includes ISO timestamp in output', () => {
    const logger = new ConsoleLogger(LogLevel.DEBUG);
    logger.info('timestamp test');
    const output = stdoutSpy.mock.calls[0]![0] as string;
    // ISO timestamp pattern: YYYY-MM-DDTHH:mm:ss.sssZ
    expect(output).toMatch(/\[\d{4}-\d{2}-\d{2}T/);
  });

  it('includes structured context as JSON', () => {
    const logger = new ConsoleLogger(LogLevel.DEBUG);
    logger.info('with context', { key: 'value', count: 42 });
    const output = stdoutSpy.mock.calls[0]![0] as string;
    expect(output).toContain('{"key":"value","count":42}');
  });

  it('omits context segment when context is empty', () => {
    const logger = new ConsoleLogger(LogLevel.DEBUG);
    logger.info('no context', {});
    const output = stdoutSpy.mock.calls[0]![0] as string;
    expect(output).not.toContain('{}');
  });

  it('logs all levels when configured at DEBUG', () => {
    const logger = new ConsoleLogger(LogLevel.DEBUG);
    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');
    expect(stdoutSpy).toHaveBeenCalledTimes(3); // debug, info, warn
    expect(stderrSpy).toHaveBeenCalledOnce(); // error
  });

  it('produces newline-terminated output', () => {
    const logger = new ConsoleLogger(LogLevel.DEBUG);
    logger.info('newline test');
    const output = stdoutSpy.mock.calls[0]![0] as string;
    expect(output).toMatch(/\n$/);
  });
});
