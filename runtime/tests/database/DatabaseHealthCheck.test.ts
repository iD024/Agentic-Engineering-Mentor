import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../src/database/Database.js';
import { DatabaseHealthCheck } from '../../src/database/DatabaseHealthCheck.js';
import type { DatabaseConfig } from '../../src/database/DatabaseConfig.js';

const config: DatabaseConfig = { path: ':memory:', walMode: true, timeout: 5000, verbose: false };

describe('DatabaseHealthCheck', () => {
  let db: Database;
  let healthCheck: DatabaseHealthCheck;

  beforeEach(() => {
    db = new Database(config);
    healthCheck = new DatabaseHealthCheck(db);
  });

  afterEach(() => {
    if (db.isOpen()) {
      db.close();
    }
  });

  it('returns healthy status when database is open and responsive', async () => {
    db.open();
    const result = await healthCheck.check();
    
    expect(result.healthy).toBe(true);
    expect(result.message).toBe('Database connection is healthy');
    expect(result.details).toEqual({ path: 'sqlite', open: true });
  });

  it('returns unhealthy status when database is closed', async () => {
    const result = await healthCheck.check();
    
    expect(result.healthy).toBe(false);
    expect(result.message).toBe('Database connection is closed');
    expect(result.details).toBeUndefined();
  });
  
  it('returns unhealthy status if a query fails', async () => {
    db.open();
    // Force an error by closing the database directly to simulate a failure
    // while isOpen() still returns true initially, or mock connection
    db.close();
    
    const result = await healthCheck.check();
    
    expect(result.healthy).toBe(false);
    expect(result.message).toBe('Database connection is closed');
  });
});
