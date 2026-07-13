import { describe, it, expect, vi } from 'vitest';
import { IgnoreManager } from '../../src/repository/IgnoreManager.js';
import fs from 'node:fs';

vi.mock('node:fs');

describe('IgnoreManager', () => {
  it('should ignore default directories', () => {
    const manager = new IgnoreManager('/root');
    expect(manager.isIgnored('/root/node_modules/index.js')).toBe(true);
    expect(manager.isIgnored('/root/src/index.js')).toBe(false);
  });
});
