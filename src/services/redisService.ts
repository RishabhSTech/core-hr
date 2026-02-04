/**
 * Redis Cache Service
 * Provides caching layer for frequently accessed data
 * Features: TTL support, key invalidation, memory management
 */

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for batch invalidation
}

interface CacheEntry<T> {
  value: T;
  expiresAt?: number;
  tags?: string[];
}

class RedisService {
  private cache = new Map<string, CacheEntry<any>>();
  private tagIndex = new Map<string, Set<string>>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    maxMemory: 50 * 1024 * 1024, // 50MB default
  };

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.invalidate(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value as T;
  }

  /**
   * Set value in cache with optional TTL
   */
  set<T>(key: string, value: T, options?: CacheOptions): void {
    const ttl = options?.ttl ?? this.DEFAULT_TTL;
    const expiresAt = ttl > 0 ? Date.now() + ttl * 1000 : undefined;

    const entry: CacheEntry<T> = {
      value,
      expiresAt,
      tags: options?.tags,
    };

    this.cache.set(key, entry);

    // Index tags
    if (options?.tags) {
      for (const tag of options.tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(key);
      }
    }

    // Memory management
    if (this.getMemoryUsage() > this.stats.maxMemory) {
      this.evict();
    }
  }

  /**
   * Invalidate single key
   */
  invalidate(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Remove from tag index
    if (entry.tags) {
      for (const tag of entry.tags) {
        this.tagIndex.get(tag)?.delete(key);
      }
    }

    this.cache.delete(key);
    return true;
  }

  /**
   * Invalidate all keys with a specific tag
   */
  invalidateByTag(tag: string): number {
    const keys = this.tagIndex.get(tag) || new Set();
    let count = 0;

    for (const key of keys) {
      if (this.invalidate(key)) {
        count++;
      }
    }

    this.tagIndex.delete(tag);
    return count;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
    this.stats.evictions = 0;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: parseFloat(hitRate.toFixed(2)),
      hitRatio: `${this.stats.hits}/${total}`,
    };
  }

  /**
   * Get memory usage estimation
   */
  private getMemoryUsage(): number {
    let usage = 0;
    for (const [key, entry] of this.cache) {
      usage += key.length * 2; // String in JS uses 2 bytes per char (rough estimate)
      usage += JSON.stringify(entry.value).length;
    }
    return usage;
  }

  /**
   * LRU eviction - remove oldest entries
   */
  private evict(): void {
    const keysToRemove = Math.ceil(this.cache.size * 0.2); // Remove 20%
    const entries = Array.from(this.cache.entries());

    for (let i = 0; i < keysToRemove && entries.length > 0; i++) {
      const [key] = entries[i];
      this.invalidate(key);
      this.stats.evictions++;
    }
  }

  /**
   * Cleanup expired entries periodically
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const expiredKeys: string[] = [];

      for (const [key, entry] of this.cache) {
        if (entry.expiresAt && entry.expiresAt < now) {
          expiredKeys.push(key);
        }
      }

      expiredKeys.forEach(key => this.invalidate(key));
    }, 60000); // Every minute
  }

  /**
   * Cleanup and stop interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }

  /**
   * Get cached or compute value
   */
  async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await compute();
    this.set(key, value, options);
    return value;
  }
}

// Singleton instance
export const redisService = new RedisService();

export default RedisService;
