// src/hooks/useEmployees.ts
// React Query integration for employee data fetching

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService, EmployeeFilters, EmployeeWithRelations } from '@/services/employeeService';
import { Profile } from '@/types/hrms';
import { toast } from 'sonner';

// Query keys for consistency
export const employeeQueryKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeQueryKeys.all, 'list'] as const,
  list: (filters: EmployeeFilters) => [...employeeQueryKeys.lists(), filters] as const,
  details: () => [...employeeQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeQueryKeys.details(), id] as const,
  search: (query: string) => [...employeeQueryKeys.all, 'search', query] as const,
  departments: () => ['departments'] as const,
};

/**
 * Hook to fetch employees with pagination and filters
 * Automatically caches and syncs with React Query
 */
export const useEmployees = (filters: EmployeeFilters = {}) => {
  return useQuery({
    queryKey: employeeQueryKeys.list(filters),
    queryFn: () => employeeService.getEmployees(filters),
    enabled: !!filters.companyId, // Only fetch when companyId is available
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes (formerly cacheTime)
    placeholderData: (previousData) => previousData, // Keep previous data while loading
    retry: 2,
  });
};

/**
 * Hook to fetch single employee
 */
export const useEmployee = (id: string | null) => {
  return useQuery({
    queryKey: employeeQueryKeys.detail(id || ''),
    queryFn: () => employeeService.getEmployeeById(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    gcTime: 1 * 60 * 60 * 1000, // 1 hour
    retry: 2,
  });
};

/**
 * Hook to fetch departments
 */
export const useDepartments = () => {
  return useQuery({
    queryKey: employeeQueryKeys.departments(),
    queryFn: () => employeeService.getDepartments(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000,
    retry: 2,
  });
};

/**
 * Hook to search employees
 */
export const useSearchEmployees = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: employeeQueryKeys.search(query),
    queryFn: () => employeeService.searchEmployees(query),
    enabled: enabled && query.length > 0,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Hook to create employee
 */
export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employee: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) =>
      employeeService.createEmployee(employee),
    onSuccess: (newEmployee) => {
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() });
      // Optionally update departments cache
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.departments() });
      toast.success('Employee created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create employee: ${error.message}`);
    },
  });
};

/**
 * Hook to update employee
 */
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Profile> }) =>
      employeeService.updateEmployee(id, data),
    onSuccess: (updatedEmployee) => {
      // Update specific employee detail
      queryClient.setQueryData(
        employeeQueryKeys.detail(updatedEmployee.id),
        updatedEmployee
      );
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() });
      toast.success('Employee updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update employee: ${error.message}`);
    },
  });
};

/**
 * Hook to delete employee
 */
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employeeService.deleteEmployee(id),
    onSuccess: () => {
      // Invalidate all employee queries
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all });
      toast.success('Employee deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete employee: ${error.message}`);
    },
  });
};

/**
 * Hook to bulk create employees
 */
export const useBulkCreateEmployees = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employees: Array<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>) =>
      employeeService.bulkCreateEmployees(employees),
    onSuccess: (createdEmployees) => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() });
      toast.success(`${createdEmployees.length} employees imported successfully`);
    },
    onError: (error: any) => {
      toast.error(`Bulk import failed: ${error.message}`);
    },
  });
};

/**
 * Hook to get reporting structure
 */
export const useReportingStructure = (employeeId: string | null) => {
  return useQuery({
    queryKey: ['reportingStructure', employeeId],
    queryFn: () => employeeService.getReportingStructure(employeeId!),
    enabled: !!employeeId,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

/**
 * Hook to get department statistics
 */
export const useDepartmentStats = (departmentId: string | null) => {
  return useQuery({
    queryKey: ['departmentStats', departmentId],
    queryFn: () => employeeService.getDepartmentStats(departmentId!),
    enabled: !!departmentId,
    staleTime: 1 * 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000,
  });
};
