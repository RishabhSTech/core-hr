// src/services/baseService.ts
// Foundation for all services - centralized error handling & retry logic

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ServiceError extends Error {
  code?: string;
  status?: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sort?: { column: string; ascending: boolean };
}

interface PaginationResponse<T> {
  data: T[];
  count: number;
  hasMore: boolean;
  page: number;
}

export class BaseService {
  protected client: SupabaseClient;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor() {
    this.client = supabase;
  }

  /**
   * Execute async operation with exponential backoff retry
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < this.maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (i < this.maxRetries - 1) {
          const delay = this.retryDelay * Math.pow(2, i);
          console.warn(
            `[${operationName}] Attempt ${i + 1} failed, retrying in ${delay}ms...`,
            error
          );
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    const err: ServiceError = new Error(
      `${operationName} failed after ${this.maxRetries} retries`
    ) as ServiceError;
    (err as any).cause = lastError;
    throw err;
  }

  /**
   * Handle Supabase errors and show user-friendly messages
   */
  protected handleError(error: any, userMessage: string = 'An error occurred'): ServiceError {
    console.error('Service error:', error);

    const serviceError: ServiceError = new Error(error.message || userMessage);
    serviceError.code = error.code;
    serviceError.status = error.status;

    // Show user-friendly toast
    const message = this.getErrorMessage(error.code);
    toast.error(message);

    return serviceError;
  }

  /**
   * Get user-friendly error messages
   */
  private getErrorMessage(code?: string): string {
    const errorMap: Record<string, string> = {
      '23505': 'This record already exists',
      '23503': 'Cannot delete - related records exist',
      'PGRST116': 'Record not found',
      'auth/invalid-api-key': 'Authentication failed',
      'NETWORK_ERROR': 'Network error - please check your connection',
    };

    return errorMap[code || ''] || 'Something went wrong. Please try again.';
  }

  /**
   * Fetch paginated data with consistent interface
   */
  protected async fetchPaginated<T>(
    table: string,
    params: PaginationParams = {}
  ): Promise<PaginationResponse<T>> {
    const { page = 1, pageSize = 50, sort } = params;

    if (page < 1) throw new Error('Page must be >= 1');
    if (pageSize < 1 || pageSize > 1000) throw new Error('PageSize must be 1-1000');

    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    return this.withRetry(async () => {
      let query = this.client.from(table).select('*', { count: 'exact' });

      if (sort) {
        query = query.order(sort.column, { ascending: sort.ascending });
      }

      const { data, count, error } = await query.range(start, end);

      if (error) throw error;

      return {
        data: data as T[],
        count: count || 0,
        hasMore: (page * pageSize) < (count || 0),
        page,
      };
    }, `Fetch ${table} page ${page}`);
  }

  /**
   * Batch operations with chunking for API limits
   */
  protected async batchOperation<T>(
    items: T[],
    operation: (batch: T[]) => Promise<any>,
    batchSize: number = 100
  ): Promise<any[]> {
    const batches = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    return Promise.all(batches.map(batch => 
      this.withRetry(() => operation(batch), `Batch operation (${batches.length} batches)`)
    ));
  }

  /**
   * Cache results with TTL
   */
  protected cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  protected setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  protected getCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  protected clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}
