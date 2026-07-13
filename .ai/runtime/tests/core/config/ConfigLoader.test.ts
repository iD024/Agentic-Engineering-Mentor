import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigLoader } from '../../../src/core/config/ConfigLoader.js';

describe('ConfigLoader', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns raw key-value pairs from process.env', () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv, TEST_VAR: 'test_value' };

    try {
      const raw = ConfigLoader.load();
      expect(raw).toHaveProperty('TEST_VAR', 'test_value');
    } finally {
      process.env = originalEnv;
    }
  });

  it('returns a plain object copy of process.env', () => {
    const raw = ConfigLoader.load();
    expect(typeof raw).toBe('object');
    expect(raw).not.toBe(process.env);
  });

  it('includes existing environment variables', () => {
    const raw = ConfigLoader.load();
    expect(raw).toHaveProperty('PATH');
  });
});
