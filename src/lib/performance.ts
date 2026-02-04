// src/lib/performance.ts
/**
 * Performance Optimization Utilities
 * Tools for monitoring, optimizing, and scaling the application
 */

/**
 * Performance monitor - track function execution time
 */
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  mark(label: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }
      this.metrics.get(label)!.push(duration);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
      }
    };
  }

  getMetrics(label: string) {
    const durations = this.metrics.get(label) || [];
    if (durations.length === 0) return null;

    return {
      count: durations.length,
      average: durations.reduce((a, b) => a + b) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      total: durations.reduce((a, b) => a + b),
    };
  }

  getAllMetrics() {
    const result: Record<string, ReturnType<typeof this.getMetrics>> = {};
    
    for (const [label] of this.metrics) {
      result[label] = this.getMetrics(label);
    }
    
    return result;
  }

  clear(): void {
    this.metrics.clear();
  }

  printReport(): void {
    console.table(this.getAllMetrics());
  }
}

/**
 * Memory leak detector - monitor large object retention
 */
export class MemoryMonitor {
  private snapshots: Record<string, number> = {};

  snapshot(label: string): void {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      this.snapshots[label] = (performance as any).memory.usedJSHeapSize;
    }
  }

  compare(label1: string, label2: string): number | null {
    const snap1 = this.snapshots[label1];
    const snap2 = this.snapshots[label2];

    if (!snap1 || !snap2) return null;

    const diffBytes = snap2 - snap1;
    const diffMB = diffBytes / (1024 * 1024);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Memory] ${label1} → ${label2}: ${diffMB.toFixed(2)}MB`);
    }

    return diffMB;
  }

  clear(): void {
    this.snapshots = {};
  }
}

/**
 * Resource pooling - reuse expensive objects
 */
export class ObjectPool<T> {
  private available: T[] = [];
  private inUse = new Set<T>();

  constructor(
    private factory: () => T,
    private reset: (obj: T) => void,
    initialSize: number = 10
  ) {
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory());
    }
  }

  acquire(): T {
    let obj: T;
    
    if (this.available.length > 0) {
      obj = this.available.pop()!;
    } else {
      obj = this.factory();
    }

    this.inUse.add(obj);
    return obj;
  }

  release(obj: T): void {
    if (this.inUse.has(obj)) {
      this.inUse.delete(obj);
      this.reset(obj);
      this.available.push(obj);
    }
  }

  getStats() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size,
    };
  }

  clear(): void {
    this.available = [];
    this.inUse.clear();
  }
}

/**
 * Rate limiter - prevent too many operations
 */
export class RateLimiter {
  private timestamps: number[] = [];

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  canExecute(): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Remove old timestamps
    this.timestamps = this.timestamps.filter(ts => ts > windowStart);

    if (this.timestamps.length < this.maxRequests) {
      this.timestamps.push(now);
      return true;
    }

    return false;
  }

  getRemaining(): number {
    return Math.max(0, this.maxRequests - this.timestamps.length);
  }

  reset(): void {
    this.timestamps = [];
  }
}

/**
 * Circuit breaker - prevent cascading failures
 */
export class CircuitBreaker<T> {
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private executor: () => Promise<T>,
    private failureThreshold: number = 5,
    private resetTimeoutMs: number = 60000
  ) {}

  async execute(): Promise<T> {
    if (this.state === 'open') {
      if (
        this.lastFailureTime &&
        Date.now() - this.lastFailureTime > this.resetTimeoutMs
      ) {
        this.state = 'half-open';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await this.executor();

      if (this.state === 'half-open') {
        this.successCount++;
        if (this.successCount >= 3) {
          this.state = 'closed';
          this.failureCount = 0;
        }
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.state = 'open';
      }

      throw error;
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failureCount,
      successes: this.successCount,
    };
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }
}

/**
 * Resource tracker - monitor resource usage
 */
export class ResourceTracker {
  private resources = new Map<string, number>();

  increment(resource: string, amount: number = 1): void {
    const current = this.resources.get(resource) || 0;
    this.resources.set(resource, current + amount);
  }

  decrement(resource: string, amount: number = 1): void {
    const current = this.resources.get(resource) || 0;
    this.resources.set(resource, Math.max(0, current - amount));
  }

  getUsage(resource: string): number {
    return this.resources.get(resource) || 0;
  }

  getAllUsage(): Record<string, number> {
    return Object.fromEntries(this.resources);
  }

  clear(): void {
    this.resources.clear();
  }
}

/**
 * Batch queue - accumulate requests and process in batches
 */
export class BatchQueue<T, R> {
  private queue: T[] = [];
  private timer: NodeJS.Timeout | null = null;
  private processing = false;

  constructor(
    private processor: (batch: T[]) => Promise<R[]>,
    private batchSize: number = 50,
    private delayMs: number = 100
  ) {}

  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push(item);

      if (this.queue.length >= this.batchSize) {
        this.processBatch().catch(reject);
      } else if (!this.timer) {
        this.timer = setTimeout(() => {
          this.processBatch().catch(reject);
        }, this.delayMs);
      }
    });
  }

  private async processBatch(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const batch = this.queue.splice(0, this.batchSize);

    try {
      await this.processor(batch);
    } finally {
      this.processing = false;

      if (this.queue.length > 0) {
        this.processBatch();
      }
    }
  }

  flush(): Promise<void> {
    if (this.queue.length === 0) return Promise.resolve();
    return this.processBatch();
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  clear(): void {
    if (this.timer) clearTimeout(this.timer);
    this.queue = [];
  }
}

export const globalPerformanceMonitor = new PerformanceMonitor();
export const globalMemoryMonitor = new MemoryMonitor();
