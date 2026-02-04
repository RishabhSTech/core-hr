// src/services/payrollService.ts
import { BaseService, PaginationParams } from './baseService';
import { Payroll, Profile } from '@/types/hrms';

class PayrollService extends BaseService {
  async getPayroll(filters: PaginationParams = {}): Promise<any> {
    return this.fetchPaginated<Payroll>('payroll', filters);
  }

  async getPayrollByUserAndMonth(userId: string, month: number, year: number): Promise<Payroll | null> {
    const cacheKey = `payroll:${userId}:${month}:${year}`;
    const cached = this.getCache<Payroll>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('payroll')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month)
        .eq('year', year)
        .maybeSingle();

      if (error) throw error;
      if (data) this.setCache(cacheKey, data);
      return (data || null) as Payroll | null;
    }, `Get payroll ${userId}:${month}:${year}`);
  }

  async processPayroll(data: {
    month: number;
    year: number;
    employeeIds: string[];
    baseSalary?: number;
    deductions?: number;
  }): Promise<Payroll[]> {
    return this.withRetry(async () => {
      const payrolls = data.employeeIds.map(userId => ({
        user_id: userId,
        month: data.month,
        year: data.year,
        working_days: 22,
        present_days: 20,
        paid_leave_days: 1,
        unpaid_leave_days: 0,
        base_salary: data.baseSalary || 0,
        deductions: data.deductions || 0,
        net_salary: (data.baseSalary || 0) - (data.deductions || 0),
        status: 'draft' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { data: inserted, error } = await this.client
        .from('payroll')
        .insert(payrolls)
        .select();

      if (error) throw error;
      this.clearCache('payroll:');
      return (inserted || []) as Payroll[];
    }, 'Process payroll');
  }

  async updatePayrollStatus(payrollId: string, status: 'draft' | 'processed' | 'paid'): Promise<Payroll> {
    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('payroll')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', payrollId)
        .select()
        .single();

      if (error) throw error;
      this.clearCache('payroll:');
      return data as Payroll;
    }, `Update payroll ${payrollId}`);
  }

  async calculatePayroll(userId: string, month: number, year: number): Promise<{
    baseSalary: number;
    deductions: number;
    netSalary: number;
  }> {
    return this.withRetry(async () => {
      const result = await this.client.rpc('calculate_payroll', {
        user_id: userId,
        month,
        year,
      });

      if (result.error) throw result.error;
      return result.data;
    }, `Calculate payroll ${userId}:${month}:${year}`);
  }

  async bulkProcessPayroll(employeeIds: string[], month: number, year: number): Promise<Payroll[]> {
    return this.batchOperation(
      employeeIds,
      async (batch) => {
        const payrolls = batch.map(userId => ({
          user_id: userId,
          month,
          year,
          working_days: 22,
          present_days: 20,
          paid_leave_days: 1,
          unpaid_leave_days: 0,
          base_salary: 0,
          deductions: 0,
          net_salary: 0,
          status: 'draft' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const { data, error } = await this.client
          .from('payroll')
          .insert(payrolls)
          .select();

        if (error) throw error;
        return data || [];
      },
      100
    );
  }
}

export const payrollService = new PayrollService();
