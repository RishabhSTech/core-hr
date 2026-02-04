// src/lib/codeCleanup.ts
/**
 * Code Cleanup & Scaling Utilities
 * Centralized utilities for common operations, deduplication, and performance optimization
 */

/**
 * Debounce factory - creates debounced function with memory cleanup
 */
export function createDebouncedFunction<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Throttle factory - ensures function runs at most once per interval
 */
export function createThrottledFunction<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastRun = 0;

  return function (...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastRun >= wait) {
      func(...args);
      lastRun = now;
    }
  };
}

/**
 * Batch processing utility - process large arrays in chunks
 */
export async function processBatch<T, R>(
  items: T[],
  batchSize: number = 50,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Memoization cache - avoid redundant computations
 */
export class MemoizationCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private ttl: number;

  constructor(ttlSeconds: number = 5 * 60) {
    this.ttl = ttlSeconds * 1000;
  }

  set(key: string, value: T): void {
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Object difference detector - identify what changed
 */
export function getObjectDifferences<T extends Record<string, any>>(
  original: T,
  updated: T
): Partial<T> {
  const differences: Partial<T> = {};

  for (const key in updated) {
    if (JSON.stringify(original[key]) !== JSON.stringify(updated[key])) {
      differences[key as keyof T] = updated[key];
    }
  }

  return differences;
}

/**
 * Array deduplication - remove duplicates by key
 */
export function deduplicateArray<T extends Record<string, any>>(
  items: T[],
  keySelector: (item: T) => string
): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = keySelector(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Conditional rendering helper - cleaner ternary operations
 */
export const renderWhen = {
  isLoading: (condition: boolean, fallback: React.ReactNode) =>
    condition ? fallback : null,

  hasError: (error: Error | null, fallback: React.ReactNode) =>
    error ? fallback : null,

  isEmpty: (items: any[], fallback: React.ReactNode) =>
    items.length === 0 ? fallback : null,
};

/**
 * Flatten nested data structure
 */
export function flattenObject<T>(
  obj: Record<string, any>,
  prefix = ''
): Record<string, any> {
  const flattened: Record<string, any> = {};

  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, newKey));
    } else {
      flattened[newKey] = value;
    }
  }

  return flattened;
}

/**
 * Compose multiple functions - functional programming pattern
 */
export function compose<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduceRight((result, fn) => fn(result), arg);
}

/**
 * Pipe multiple functions - left-to-right composition
 */
export function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduce((result, fn) => fn(result), arg);
}

/**
 * Create a loader factory for lazy loading data
 */
export class LazyDataLoader<T> {
  private cache: T | null = null;
  private loading: boolean = false;
  private error: Error | null = null;

  constructor(private fetcher: () => Promise<T>) {}

  async load(): Promise<T> {
    if (this.cache) return this.cache;
    if (this.loading) throw new Error('Already loading');

    this.loading = true;
    this.error = null;

    try {
      this.cache = await this.fetcher();
      return this.cache;
    } catch (err) {
      this.error = err as Error;
      throw err;
    } finally {
      this.loading = false;
    }
  }

  getCache(): T | null {
    return this.cache;
  }

  getError(): Error | null {
    return this.error;
  }

  isLoading(): boolean {
    return this.loading;
  }

  clear(): void {
    this.cache = null;
    this.error = null;
  }
}

/**
 * Request deduplication - prevent duplicate requests
 */
export class RequestDeduplicator<T> {
  private pendingRequests = new Map<string, Promise<any>>();

  async execute<R>(
    key: string,
    executor: () => Promise<R>
  ): Promise<R> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<R>;
    }

    const promise = executor().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise as any);
    return promise;
  }

  clear(): void {
    this.pendingRequests.clear();
  }
}
