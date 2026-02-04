// src/hooks/useAnalytics.ts
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analyticsService';

export function useDashboardMetrics(companyId: string | null) {
  return useQuery({
    queryKey: ['dashboard_metrics', companyId],
    queryFn: () => analyticsService.getDashboardMetrics(companyId!),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

export function useAttendanceAnalytics(
  companyId: string | null,
  startDate: string | null,
  endDate: string | null
) {
  return useQuery({
    queryKey: ['attendance_analytics', companyId, startDate, endDate],
    queryFn: () => analyticsService.getAttendanceAnalytics(companyId!, startDate!, endDate!),
    enabled: !!companyId && !!startDate && !!endDate,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function usePayrollAnalytics(companyId: string | null, year: number) {
  return useQuery({
    queryKey: ['payroll_analytics', companyId, year],
    queryFn: () => analyticsService.getPayrollAnalytics(companyId!, year),
    enabled: !!companyId,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useLeaveAnalytics(companyId: string | null) {
  return useQuery({
    queryKey: ['leave_analytics', companyId],
    queryFn: () => analyticsService.getLeaveAnalytics(companyId!),
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

export function useEmployeeMetrics(userId: string | null) {
  return useQuery({
    queryKey: ['employee_metrics', userId],
    queryFn: () => analyticsService.getEmployeeMetrics(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}
