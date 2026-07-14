import { describe, it, expect, afterEach } from 'vitest';
import { Database } from '../../src/database/Database.js';
import type { DatabaseConfig } from '../../src/database/DatabaseConfig.js';

const inMemoryConfig: DatabaseConfig = {
  path: ':memory:',
  walMode: true,
  timeout: 5000,
  verbose: false,
};

describe('Database', () => {
  let db: Database;

  afterEach(() => {
    if (db.isOpen()) db.close();
  });

  it('opens a connection', () => {
    db = new Database(inMemoryConfig);
    db.open();
    expect(db.isOpen()).toBe(true);
  });

  it('exposes the raw better-sqlite3 connection', () => {
    db = new Database(inMemoryConfig);
    db.open();
    expect(db.connection).toBeDefined();
  });

  it('closes the connection', () => {
    db = new Database(inMemoryConfig);
    db.open();
    db.close();
    expect(db.isOpen()).toBe(false);
  });

  it('throws if open() is called twice', () => {
    db = new Database(inMemoryConfig);
    db.open();
    expect(() => db.open()).toThrow('Database is already open');
  });

  it('throws if connection is accessed before open()', () => {
    db = new Database(inMemoryConfig);
    expect(() => db.connection).toThrow('Database is not open');
  });

  it('close() is idempotent', () => {
    db = new Database(inMemoryConfig);
    db.open();
    db.close();
    expect(() => db.close()).not.toThrow();
  });
});
