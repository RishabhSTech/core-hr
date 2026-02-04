// src/services/leaveService.ts
import { BaseService, PaginationParams } from './baseService';
import { LeaveRequest, LeaveBalance, LeaveType, LeaveStatus } from '@/types/hrms';

class LeaveService extends BaseService {
  async getLeaveRequests(filters: PaginationParams = {}): Promise<any> {
    return this.fetchPaginated<LeaveRequest>('leave_requests', filters);
  }

  async getLeaveRequestById(id: string): Promise<LeaveRequest> {
    const cacheKey = `leave_request:${id}`;
    const cached = this.getCache<LeaveRequest>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('leave_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      this.setCache(cacheKey, data);
      return data as LeaveRequest;
    }, `Get leave request ${id}`);
  }

  async getLeaveBalance(userId: string): Promise<LeaveBalance> {
    const cacheKey = `leave_balance:${userId}`;
    const cached = this.getCache<LeaveBalance>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('leave_balances')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      this.setCache(cacheKey, data);
      return data as LeaveBalance;
    }, `Get leave balance ${userId}`);
  }

  async createLeaveRequest(data: {
    userId: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason?: string;
  }): Promise<LeaveRequest> {
    return this.withRetry(async () => {
      const { data: inserted, error } = await this.client
        .from('leave_requests')
        .insert([{
          user_id: data.userId,
          leave_type: data.leaveType,
          start_date: data.startDate,
          end_date: data.endDate,
          reason: data.reason,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      this.clearCache(`leave_request:${inserted.id}`);
      return inserted as LeaveRequest;
    }, 'Create leave request');
  }

  async approveLeaveRequest(id: string, approvedBy: string): Promise<LeaveRequest> {
    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('leave_requests')
        .update({
          status: 'approved' as LeaveStatus,
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      this.clearCache(`leave_request:${id}`);
      return data as LeaveRequest;
    }, `Approve leave request ${id}`);
  }

  async rejectLeaveRequest(id: string, rejectionReason: string): Promise<LeaveRequest> {
    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('leave_requests')
        .update({
          status: 'rejected' as LeaveStatus,
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      this.clearCache(`leave_request:${id}`);
      return data as LeaveRequest;
    }, `Reject leave request ${id}`);
  }

  async getUserLeaveRequests(userId: string): Promise<LeaveRequest[]> {
    const cacheKey = `user_leave_requests:${userId}`;
    const cached = this.getCache<LeaveRequest[]>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('leave_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.setCache(cacheKey, data || []);
      return (data || []) as LeaveRequest[];
    }, `Get user leave requests ${userId}`);
  }

  async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    const cacheKey = 'pending_leave_requests';
    const cached = this.getCache<LeaveRequest[]>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('leave_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      this.setCache(cacheKey, data || []);
      return (data || []) as LeaveRequest[];
    }, 'Get pending leave requests');
  }

  async updateLeaveBalance(userId: string, leaveType: LeaveType, days: number): Promise<LeaveBalance> {
    return this.withRetry(async () => {
      const balance = await this.getLeaveBalance(userId);
      const updated = { ...balance };
      
      if (leaveType === 'casual') updated.casual_leave -= days;
      else if (leaveType === 'sick') updated.sick_leave -= days;
      else if (leaveType === 'paid') updated.paid_leave -= days;

      const { data, error } = await this.client
        .from('leave_balances')
        .update(updated)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      this.clearCache(`leave_balance:${userId}`);
      return data as LeaveBalance;
    }, `Update leave balance ${userId}`);
  }
}

export const leaveService = new LeaveService();
