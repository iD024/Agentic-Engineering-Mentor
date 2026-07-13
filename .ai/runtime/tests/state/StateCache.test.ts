import { describe, it, expect, beforeEach } from 'vitest';
import { StateCache } from '../../src/state/StateCache.js';
import { createDefaultWorkspace } from '../../src/models/Workspace.js';

describe('StateCache', () => {
  let cache: StateCache;

  beforeEach(() => {
    cache = new StateCache();
  });

  it('returns null for empty cache', () => {
    expect(cache.getWorkspace('ws-1')).toBeNull();
  });

  it('stores and retrieves a workspace', () => {
    const ws = createDefaultWorkspace('ws-1');
    cache.setWorkspace(ws);
    const result = cache.getWorkspace('ws-1');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('ws-1');
  });

  it('invalidate() removes the workspace from cache', () => {
    cache.setWorkspace(createDefaultWorkspace('ws-1'));
    cache.invalidateWorkspace('ws-1');
    expect(cache.getWorkspace('ws-1')).toBeNull();
  });

  it('clear() removes all cached entries', () => {
    cache.setWorkspace(createDefaultWorkspace('ws-1'));
    cache.setWorkspace(createDefaultWorkspace('ws-2'));
    cache.clear();
    expect(cache.getWorkspace('ws-1')).toBeNull();
    expect(cache.getWorkspace('ws-2')).toBeNull();
  });

  it('returns a frozen (readonly) copy', () => {
    const ws = createDefaultWorkspace('ws-1');
    cache.setWorkspace(ws);
    const retrieved = cache.getWorkspace('ws-1');
    expect(Object.isFrozen(retrieved)).toBe(true);
  });

  it('stores and retrieves sessions', () => {
    const now = new Date().toISOString();
    const session = { id: 's-1', workspaceId: 'ws-1', state: 'active' as const, goals: [], startedAt: now, endedAt: null, version: 1, createdAt: now, updatedAt: now };
    cache.setSession(session);
    expect(cache.getSession('s-1')!.id).toBe('s-1');
  });

  it('invalidateSession() removes a session', () => {
    const now = new Date().toISOString();
    const session = { id: 's-1', workspaceId: 'ws-1', state: 'active' as const, goals: [], startedAt: now, endedAt: null, version: 1, createdAt: now, updatedAt: now };
    cache.setSession(session);
    cache.invalidateSession('s-1');
    expect(cache.getSession('s-1')).toBeNull();
  });
});
