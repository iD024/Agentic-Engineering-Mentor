import { describe, it, expect } from 'vitest';
import { ConfigValidator } from '../../../src/core/config/ConfigValidator.js';
import { LogLevel } from '../../../src/types/LogLevel.js';

describe('ConfigValidator', () => {
  const validEnv = {
    NODE_ENV: 'development',
    LOG_LEVEL: 'info',
    WORKSPACE_ROOT: '/tmp/test-workspace',
    SHUTDOWN_TIMEOUT_MS: '5000',
  };

  it('returns a typed RuntimeConfig for valid environment', () => {
    const config = ConfigValidator.validate(validEnv);
    expect(config.nodeEnv).toBe('development');
    expect(config.logLevel).toBe(LogLevel.INFO);
    expect(config.workspaceRoot).toContain('test-workspace');
    expect(config.shutdownTimeoutMs).toBe(5000);
  });

  it('applies default values when optional vars are missing', () => {
    const config = ConfigValidator.validate({});
    expect(config.nodeEnv).toBe('development');
    expect(config.logLevel).toBe(LogLevel.INFO);
    expect(config.shutdownTimeoutMs).toBe(10_000);
  });

  it('maps all log level strings to LogLevel enum', () => {
    expect(ConfigValidator.validate({ ...validEnv, LOG_LEVEL: 'debug' }).logLevel).toBe(
      LogLevel.DEBUG,
    );
    expect(ConfigValidator.validate({ ...validEnv, LOG_LEVEL: 'info' }).logLevel).toBe(
      LogLevel.INFO,
    );
    expect(ConfigValidator.validate({ ...validEnv, LOG_LEVEL: 'warn' }).logLevel).toBe(
      LogLevel.WARN,
    );
    expect(ConfigValidator.validate({ ...validEnv, LOG_LEVEL: 'error' }).logLevel).toBe(
      LogLevel.ERROR,
    );
  });

  it('throws descriptive error for invalid NODE_ENV', () => {
    expect(() =>
      ConfigValidator.validate({ ...validEnv, NODE_ENV: 'staging' }),
    ).toThrow('Configuration validation failed');
  });

  it('throws descriptive error for invalid LOG_LEVEL', () => {
    expect(() =>
      ConfigValidator.validate({ ...validEnv, LOG_LEVEL: 'verbose' }),
    ).toThrow('Configuration validation failed');
  });

  it('throws for invalid SHUTDOWN_TIMEOUT_MS', () => {
    expect(() =>
      ConfigValidator.validate({ ...validEnv, SHUTDOWN_TIMEOUT_MS: '-100' }),
    ).toThrow('Configuration validation failed');
  });

  it('coerces SHUTDOWN_TIMEOUT_MS from string to number', () => {
    const config = ConfigValidator.validate({ ...validEnv, SHUTDOWN_TIMEOUT_MS: '3000' });
    expect(config.shutdownTimeoutMs).toBe(3000);
    expect(typeof config.shutdownTimeoutMs).toBe('number');
  });

  it('resolves WORKSPACE_ROOT to an absolute path', () => {
    const config = ConfigValidator.validate({ ...validEnv, WORKSPACE_ROOT: '.' });
    expect(config.workspaceRoot).toMatch(/^\//);
  });
});
