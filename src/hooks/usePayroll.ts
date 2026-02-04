// src/hooks/usePayroll.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollService } from '@/services/payrollService';

export function usePayroll(filters: any = {}) {
  // Support both old-style (without company) and new-style (with company)
  const { companyId, ...otherFilters } = filters;
  
  return useQuery({
    queryKey: ['payroll', companyId, otherFilters],
    queryFn: () => {
      if (companyId) {
        return payrollService.getPayrollByCompany(companyId, otherFilters);
      }
      return payrollService.getPayroll(otherFilters);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function usePayrollByMonth(userId: string | null, month: number, year: number) {
  return useQuery({
    queryKey: ['payroll', userId, month, year],
    queryFn: () => payrollService.getPayrollByUserAndMonth(userId!, month, year),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useProcessPayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => payrollService.processPayroll(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
    },
  });
}

export function useUpdatePayrollStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payrollId, status }: { payrollId: string; status: 'draft' | 'processed' | 'paid' }) =>
      payrollService.updatePayrollStatus(payrollId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
    },
  });
}

export function useBulkProcessPayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { companyId: string; employeeIds: string[]; month: number; year: number }) =>
      payrollService.bulkProcessPayroll(data.companyId, data.employeeIds, data.month, data.year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
    },
  });
}
