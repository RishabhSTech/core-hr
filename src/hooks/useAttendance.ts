// src/hooks/useAttendance.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '@/services/attendanceService';

export function useAttendance(filters: any = {}) {
  return useQuery({
    queryKey: ['attendance', filters],
    queryFn: () => attendanceService.getAttendance(filters),
    enabled: !!filters.userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAttendanceById(id: string | null) {
  return useQuery({
    queryKey: ['attendance', id],
    queryFn: () => attendanceService.getAttendanceById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useUserAttendance(userId: string | null, limit: number = 30) {
  return useQuery({
    queryKey: ['attendance', userId],
    queryFn: () => attendanceService.getUserAttendance(userId!, limit),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useTodayAttendance() {
  return useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => attendanceService.getTodayAttendance(),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, lat, lng }: { userId: string; lat?: number; lng?: number }) =>
      attendanceService.signIn(userId, lat, lng),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] });
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ attendanceId, lat, lng }: { attendanceId: string; lat?: number; lng?: number }) =>
      attendanceService.signOut(attendanceId, lat, lng),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', variables.attendanceId] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] });
    },
  });
}

export function useMarkAbsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, date }: { userId: string; date?: string }) =>
      attendanceService.markAbsent(userId, date),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] });
    },
  });
}

export function useAttendanceReport(startDate: string | null, endDate: string | null) {
  return useQuery({
    queryKey: ['attendance', 'report', startDate, endDate],
    queryFn: () => attendanceService.getAttendanceReport(startDate!, endDate!),
    enabled: !!startDate && !!endDate,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useUpdateAttendanceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ attendanceId, status }: { attendanceId: string; status: string }) =>
      attendanceService.updateAttendanceStatus(attendanceId, status as any),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', variables.attendanceId] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] });
    },
  });
}

export function useBulkMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Array<{ userId: string; status: string; date?: string }>) =>
      attendanceService.bulkMarkAttendance(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] });
    },
  });
}
