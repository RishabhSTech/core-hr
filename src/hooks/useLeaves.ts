// src/hooks/useLeaves.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveService } from '@/services/leaveService';

export function useLeaveRequests(filters = {}) {
  return useQuery({
    queryKey: ['leaves', filters],
    queryFn: () => leaveService.getLeaveRequests(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

export function useLeaveRequestById(id: string | null) {
  return useQuery({
    queryKey: ['leaves', id],
    queryFn: () => leaveService.getLeaveRequestById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useLeaveBalance(userId: string | null) {
  return useQuery({
    queryKey: ['leave_balance', userId],
    queryFn: () => leaveService.getLeaveBalance(userId!),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useUserLeaveRequests(userId: string | null) {
  return useQuery({
    queryKey: ['user_leaves', userId],
    queryFn: () => leaveService.getUserLeaveRequests(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function usePendingLeaveRequests() {
  return useQuery({
    queryKey: ['pending_leaves'],
    queryFn: () => leaveService.getPendingLeaveRequests(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => leaveService.createLeaveRequest(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user_leaves', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['pending_leaves'] });
    },
  });
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approvedBy }: { id: string; approvedBy: string }) =>
      leaveService.approveLeaveRequest(id, approvedBy),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leaves', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['pending_leaves'] });
    },
  });
}

export function useRejectLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) =>
      leaveService.rejectLeaveRequest(id, rejectionReason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leaves', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['pending_leaves'] });
    },
  });
}

export function useUpdateLeaveBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { userId: string; leaveType: string; days: number }) =>
      leaveService.updateLeaveBalance(data.userId, data.leaveType as any, data.days),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leave_balance', variables.userId] });
    },
  });
}
