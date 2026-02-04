// src/services/employeeService.ts
// Service for all employee-related database operations

import { BaseService, PaginationParams, ServiceError } from './baseService';
import { Profile, Department, UserRole } from '@/types/hrms';

export interface EmployeeFilters extends PaginationParams {
  companyId?: string;
  departmentId?: string;
  search?: string;
  role?: string;
  status?: 'active' | 'inactive';
}

export interface EmployeeWithRelations extends Profile {
  department?: Department;
  role?: string;
}

class EmployeeService extends BaseService {
  /**
   * Get all employees with filters and pagination
   * Replaces direct DB calls in Employees.tsx
   */
  async getEmployees(filters: EmployeeFilters = {}): Promise<any> {
    const { companyId, departmentId, search, role, status = 'active', page = 1, pageSize = 50, sort } = filters;
    const cacheKey = `employees:${companyId}:${departmentId}:${search}:${role}:${status}:${page}`;

    // Check cache
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      let query = this.client.from('profiles').select(
        '*, department:departments(*), user_roles(*)',
        { count: 'exact' }
      );

      // Apply company filter (required for RLS)
      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      // Apply filters
      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }

      if (status === 'active') {
        query = query.is('deleted_at', null);
      }

      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      // Apply pagination
      const start = (page - 1) * pageSize;
      query = query.range(start, start + pageSize - 1);

      // Apply sorting
      if (sort) {
        query = query.order(sort.column, { ascending: sort.ascending });
      } else {
        query = query.order('first_name', { ascending: true });
      }

      const { data, count, error } = await query;
      if (error) throw error;

      const result = {
        data: data as EmployeeWithRelations[],
        count: count || 0,
        hasMore: (page * pageSize) < (count || 0),
        page,
      };

      // Cache result
      this.setCache(cacheKey, result);
      return result;
    }, 'Get employees');
  }

  /**
   * Get single employee with all relations
   */
  async getEmployeeById(id: string): Promise<EmployeeWithRelations> {
    const cacheKey = `employee:${id}`;
    const cached = this.getCache<EmployeeWithRelations>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('profiles')
        .select('*, department:departments(*), user_roles(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Employee not found');

      this.setCache(cacheKey, data);
      return data as EmployeeWithRelations;
    }, `Get employee ${id}`);
  }

  /**
   * Create new employee
   */
  async createEmployee(employee: Omit<Profile, 'id' | 'created_at' | 'updated_at'>): Promise<Profile> {
    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('profiles')
        .insert([employee])
        .select()
        .single();

      if (error) throw error;

      // Invalidate list cache
      this.clearCache('^employees:');
      return data as Profile;
    }, 'Create employee');
  }

  /**
   * Update employee
   */
  async updateEmployee(id: string, updates: Partial<Profile>): Promise<Profile> {
    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Clear caches
      this.clearCache(`employee:${id}`);
      this.clearCache('^employees:');
      return data as Profile;
    }, `Update employee ${id}`);
  }

  /**
   * Bulk import employees from CSV
   */
  async bulkCreateEmployees(employees: Array<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>): Promise<Profile[]> {
    return this.batchOperation(employees, async (batch) => {
      const { data, error } = await this.client
        .from('profiles')
        .insert(batch)
        .select();

      if (error) throw error;
      return data;
    }, 100);
  }

  /**
   * Bulk update employees (e.g., salary change)
   */
  async bulkUpdateEmployees(
    updates: Array<{ id: string; data: Partial<Profile> }>
  ): Promise<Profile[]> {
    return Promise.all(
      updates.map(({ id, data }) => this.updateEmployee(id, data))
    );
  }

  /**
   * Delete employee (soft delete)
   */
  async deleteEmployee(id: string): Promise<void> {
    return this.withRetry(async () => {
      const { error } = await this.client
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Clear caches
      this.clearCache(`employee:${id}`);
      this.clearCache('^employees:');
    }, `Delete employee ${id}`);
  }

  /**
   * Get all departments
   */
  async getDepartments(): Promise<Department[]> {
    const cacheKey = 'departments:all';
    const cached = this.getCache<Department[]>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('departments')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      this.setCache(cacheKey, data || []);
      return (data || []) as Department[];
    }, 'Get departments');
  }

  /**
   * Get employee by email
   */
  async getEmployeeByEmail(email: string): Promise<EmployeeWithRelations | null> {
    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('profiles')
        .select('*, department:departments(*)')
        .eq('email', email)
        .maybeSingle();

      if (error) throw error;
      return (data || null) as EmployeeWithRelations | null;
    }, `Get employee by email ${email}`);
  }

  /**
   * Search employees (full-text search if available)
   */
  async searchEmployees(query: string, limit: number = 20): Promise<EmployeeWithRelations[]> {
    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('profiles')
        .select('*, department:departments(*)')
        .or(
          `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,employee_id.ilike.%${query}%`
        )
        .limit(limit);

      if (error) throw error;
      return (data || []) as EmployeeWithRelations[];
    }, `Search employees: ${query}`);
  }

  /**
   * Get employee reporting structure
   */
  async getReportingStructure(employeeId: string, depth: number = 5): Promise<any> {
    const structure: any = {
      id: employeeId,
      children: [],
    };

    const fetchChildren = async (parentId: string, currentDepth: number): Promise<any[]> => {
      if (currentDepth <= 0) return [];

      const { data, error } = await this.client
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('reporting_manager_id', parentId);

      if (error) throw error;

      return Promise.all(
        (data || []).map(async (child: any) => ({
          ...child,
          children: await fetchChildren(child.id, currentDepth - 1),
        }))
      );
    };

    structure.children = await fetchChildren(employeeId, depth);
    return structure;
  }

  /**
   * Get department statistics
   */
  async getDepartmentStats(departmentId: string): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    averageSalary: number;
  }> {
    return this.withRetry(async () => {
      const { data, error } = await this.client.rpc('get_department_stats', {
        dept_id: departmentId,
      });

      if (error) throw error;
      return data;
    }, `Get department stats for ${departmentId}`);
  }
}

export const employeeService = new EmployeeService();
