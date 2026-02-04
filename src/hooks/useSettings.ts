// src/hooks/useSettings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services/settingsService';

// Note: For Settings.tsx, we'll handle payroll config through company settings
// as these methods don't exist in the base settingsService yet

export function useCompanySettings(companyId: string | null) {
  return useQuery({
    queryKey: ['company_settings', companyId],
    queryFn: () => settingsService.getCompanySettings(companyId!),
    enabled: !!companyId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000,
  });
}

export function useUpdateCompanySettings(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: any) => settingsService.updateCompanySettings(companyId, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_settings', companyId] });
    },
  });
}

export function useHolidays(companyId: string | null) {
  return useQuery({
    queryKey: ['holidays', companyId],
    queryFn: () => settingsService.getHolidays(companyId!),
    enabled: !!companyId,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useAddHoliday(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (holiday: any) => settingsService.addHoliday(companyId, holiday),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', companyId] });
    },
  });
}

export function useUpdateHoliday(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ holidayId, updates }: { holidayId: string; updates: any }) =>
      settingsService.updateHoliday(holidayId, companyId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', companyId] });
    },
  });
}

export function useDeleteHoliday(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (holidayId: string) => settingsService.deleteHoliday(holidayId, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', companyId] });
    },
  });
}

export function useDepartments(companyId: string | null) {
  return useQuery({
    queryKey: ['departments', companyId],
    queryFn: () => settingsService.getDepartments(companyId!),
    enabled: !!companyId,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useAddDepartment(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      settingsService.addDepartment(companyId, name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments', companyId] });
    },
  });
}

export function useUpdateDepartment(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ departmentId, updates }: { departmentId: string; updates: any }) =>
      settingsService.updateDepartment(departmentId, companyId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments', companyId] });
    },
  });
}

export function useDeleteDepartment(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (departmentId: string) => settingsService.deleteDepartment(departmentId, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments', companyId] });
    },
  });
}
