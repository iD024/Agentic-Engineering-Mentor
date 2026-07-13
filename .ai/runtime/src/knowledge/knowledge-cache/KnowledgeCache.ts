export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class KnowledgeCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private ttlMs: number;

  constructor(ttlMs: number = 60 * 60 * 1000) { // Default 1 hour TTL
    this.ttlMs = ttlMs;
  }

  public set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  public get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data as T;
  }

  public invalidate(key: string): void {
    this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }
}
