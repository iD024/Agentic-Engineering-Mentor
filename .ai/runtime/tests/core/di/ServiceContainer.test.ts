import { describe, it, expect } from 'vitest';
import { ServiceContainer } from '../../../src/core/di/ServiceContainer.js';
import type { ServiceToken } from '../../../src/interfaces/IServiceContainer.js';

function createToken<T>(name: string): ServiceToken<T> {
  return { id: Symbol(name), name };
}

describe('ServiceContainer', () => {
  it('registers and resolves an instance', () => {
    const container = new ServiceContainer();
    const token = createToken<string>('greeting');
    container.registerInstance(token, 'hello');
    expect(container.resolve(token)).toBe('hello');
  });

  it('registers a factory and resolves lazily', () => {
    const container = new ServiceContainer();
    const token = createToken<{ value: number }>('counter');
    container.register(token, () => ({ value: 42 }));
    expect(container.resolve(token)).toEqual({ value: 42 });
  });

  it('caches singleton — factory called only once', () => {
    const container = new ServiceContainer();
    const token = createToken<object>('singleton');
    let callCount = 0;
    container.register(token, () => {
      callCount++;
      return { id: callCount };
    });

    const first = container.resolve(token);
    const second = container.resolve(token);

    expect(first).toBe(second);
    expect(callCount).toBe(1);
  });

  it('throws on unregistered token', () => {
    const container = new ServiceContainer();
    const token = createToken<string>('missing');
    expect(() => container.resolve(token)).toThrow('Service not registered: missing');
  });

  it('has() returns true for registered instance', () => {
    const container = new ServiceContainer();
    const token = createToken<string>('present');
    container.registerInstance(token, 'value');
    expect(container.has(token)).toBe(true);
  });

  it('has() returns true for registered factory', () => {
    const container = new ServiceContainer();
    const token = createToken<string>('lazy');
    container.register(token, () => 'value');
    expect(container.has(token)).toBe(true);
  });

  it('has() returns false for unregistered token', () => {
    const container = new ServiceContainer();
    const token = createToken<string>('absent');
    expect(container.has(token)).toBe(false);
  });

  it('registerInstance overrides a previous factory', () => {
    const container = new ServiceContainer();
    const token = createToken<string>('overridden');
    container.register(token, () => 'from factory');
    container.registerInstance(token, 'from instance');
    expect(container.resolve(token)).toBe('from instance');
  });

  it('register overrides a previous instance', () => {
    const container = new ServiceContainer();
    const token = createToken<string>('overridden');
    container.registerInstance(token, 'from instance');
    container.register(token, () => 'from factory');
    expect(container.resolve(token)).toBe('from factory');
  });
});
