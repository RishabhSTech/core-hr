/**
 * Redis Queue Service
 * Provides job queue functionality for background tasks
 * Features: Priority queue, retry logic, dead-letter queue
 */

export interface QueueJob<T = any> {
  id: string;
  type: string;
  data: T;
  priority: number; // 0-10, higher = more important
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  processedAt?: number;
  completedAt?: number;
  error?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'delayed';
}

interface QueueOptions {
  maxRetries?: number;
  defaultPriority?: number;
  processingTimeout?: number; // ms
}

interface JobProcessor<T = any> {
  (job: QueueJob<T>): Promise<any>;
}

export class JobQueue {
  private jobs = new Map<string, QueueJob>();
  private processors = new Map<string, JobProcessor>();
  private deadLetterQueue: QueueJob[] = [];
  private processing = new Set<string>();
  private options: Required<QueueOptions>;
  private processInterval: NodeJS.Timeout | null = null;

  constructor(options: QueueOptions = {}) {
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      defaultPriority: options.defaultPriority ?? 5,
      processingTimeout: options.processingTimeout ?? 30000,
    };
  }

  /**
   * Register a job processor
   */
  register<T = any>(type: string, processor: JobProcessor<T>): void {
    this.processors.set(type, processor);
  }

  /**
   * Add job to queue
   */
  add<T = any>(
    type: string,
    data: T,
    options?: { priority?: number; delay?: number }
  ): string {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const priority = options?.priority ?? this.options.defaultPriority;

    const job: QueueJob<T> = {
      id: jobId,
      type,
      data,
      priority,
      attempts: 0,
      maxAttempts: this.options.maxRetries + 1,
      createdAt: Date.now(),
      status: options?.delay ? 'delayed' : 'pending',
    };

    if (options?.delay) {
      setTimeout(() => {
        const stored = this.jobs.get(jobId);
        if (stored) {
          stored.status = 'pending';
        }
      }, options.delay);
    }

    this.jobs.set(jobId, job);
    return jobId;
  }

  /**
   * Get job by ID
   */
  getJob(id: string): QueueJob | undefined {
    return this.jobs.get(id);
  }

  /**
   * Start processing queue
   */
  start(): void {
    if (this.processInterval) return;

    this.processInterval = setInterval(() => {
      this.process();
    }, 1000);
  }

  /**
   * Stop processing queue
   */
  stop(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }

  /**
   * Process pending jobs
   */
  private async process(): Promise<void> {
    // Get pending jobs sorted by priority (descending)
    const pendingJobs = Array.from(this.jobs.values())
      .filter(j => j.status === 'pending' && !this.processing.has(j.id))
      .sort((a, b) => b.priority - a.priority);

    for (const job of pendingJobs) {
      if (this.processing.size >= 5) break; // Max 5 concurrent jobs
      await this.processJob(job);
    }
  }

  /**
   * Process individual job
   */
  private async processJob(job: QueueJob): Promise<void> {
    const processor = this.processors.get(job.type);
    if (!processor) {
      job.status = 'failed';
      job.error = `No processor registered for type: ${job.type}`;
      this.deadLetterQueue.push(job);
      return;
    }

    job.status = 'processing';
    job.attempts++;
    this.processing.add(job.id);

    try {
      // Execute with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Job timeout')), this.options.processingTimeout)
      );

      await Promise.race([processor(job), timeoutPromise]);

      job.status = 'completed';
      job.completedAt = Date.now();
    } catch (error) {
      job.error = error instanceof Error ? error.message : String(error);

      if (job.attempts < job.maxAttempts) {
        // Retry with exponential backoff
        job.status = 'delayed';
        const delay = Math.pow(2, job.attempts - 1) * 1000;
        setTimeout(() => {
          const stored = this.jobs.get(job.id);
          if (stored) {
            stored.status = 'pending';
          }
        }, delay);
      } else {
        job.status = 'failed';
        this.deadLetterQueue.push(job);
      }
    } finally {
      this.processing.delete(job.id);
    }
  }

  /**
   * Get queue statistics
   */
  getStats() {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      delayed: jobs.filter(j => j.status === 'delayed').length,
      dlqSize: this.deadLetterQueue.length,
      processingCount: this.processing.size,
    };
  }

  /**
   * Get dead letter queue
   */
  getDeadLetterQueue(): QueueJob[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue(): number {
    const count = this.deadLetterQueue.length;
    this.deadLetterQueue = [];
    return count;
  }

  /**
   * Clear all jobs
   */
  clear(): void {
    this.jobs.clear();
    this.deadLetterQueue = [];
    this.processing.clear();
  }

  /**
   * Get recent jobs
   */
  getRecentJobs(limit: number = 100): QueueJob[] {
    return Array.from(this.jobs.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  /**
   * Retry failed job
   */
  retryJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'failed') return false;

    job.status = 'pending';
    job.attempts = 0;
    job.error = undefined;
    return true;
  }
}

// Singleton instance
export const jobQueue = new JobQueue();

export default JobQueue;
