import { useEffect, useCallback, useState } from 'react';
import { redisService } from '@/services/redisService';
import { jobQueue, type QueueJob } from '@/services/jobQueueService';

/**
 * Hook for cache management
 */
export function useCache() {
  const get = useCallback(<T,>(key: string): T | null => {
    return redisService.get<T>(key);
  }, []);

  const set = useCallback(<T,>(key: string, value: T, options?: { ttl?: number; tags?: string[] }) => {
    redisService.set(key, value, options);
  }, []);

  const invalidate = useCallback((key: string) => {
    return redisService.invalidate(key);
  }, []);

  const invalidateByTag = useCallback((tag: string) => {
    return redisService.invalidateByTag(tag);
  }, []);

  const getOrCompute = useCallback(async <T,>(
    key: string,
    compute: () => Promise<T>,
    options?: { ttl?: number; tags?: string[] }
  ): Promise<T> => {
    return redisService.getOrCompute(key, compute, options);
  }, []);

  const getStats = useCallback(() => {
    return redisService.getStats();
  }, []);

  return {
    get,
    set,
    invalidate,
    invalidateByTag,
    getOrCompute,
    getStats,
  };
}

/**
 * Hook for job queue management
 */
export function useJobQueue() {
  const addJob = useCallback(<T = any,>(
    type: string,
    data: T,
    options?: { priority?: number; delay?: number }
  ): string => {
    return jobQueue.add(type, data, options);
  }, []);

  const getJob = useCallback((id: string): QueueJob | undefined => {
    return jobQueue.getJob(id);
  }, []);

  const getStats = useCallback(() => {
    return jobQueue.getStats();
  }, []);

  const getRecentJobs = useCallback((limit?: number) => {
    return jobQueue.getRecentJobs(limit);
  }, []);

  const retryJob = useCallback((jobId: string) => {
    return jobQueue.retryJob(jobId);
  }, []);

  const getDeadLetterQueue = useCallback(() => {
    return jobQueue.getDeadLetterQueue();
  }, []);

  return {
    addJob,
    getJob,
    getStats,
    getRecentJobs,
    retryJob,
    getDeadLetterQueue,
  };
}

/**
 * Hook to monitor queue status
 */
export function useQueueMonitor() {
  useEffect(() => {
    // Start job queue processing
    jobQueue.start();

    return () => {
      jobQueue.stop();
    };
  }, []);

  return jobQueue.getStats();
}

/**
 * Hook to cache API responses
 */
export function useCachedQuery<T = any>(
  key: string,
  queryFn: () => Promise<T>,
  options?: { ttl?: number; tags?: string[]; enabled?: boolean }
) {
  const cache = useCache();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const result = await cache.getOrCompute(key, queryFn, {
        ttl: options?.ttl ?? 300,
        tags: options?.tags,
      });
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [key, queryFn, options, cache]);

  useEffect(() => {
    if (options?.enabled === false) return;
    fetch();
  }, [fetch, options?.enabled]);

  const refetch = useCallback(() => {
    cache.invalidate(key);
    return fetch();
  }, [key, cache, fetch]);

  return { data, loading, error, refetch };
}
