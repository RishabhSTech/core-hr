// src/services/analyticsService.ts
import { BaseService } from './baseService';

interface DashboardMetrics {
  totalEmployees: number;
  presentToday: number;
  pendingLeaves: number;
  payrollEstimate: number;
  departmentCounts: { [key: string]: number };
  attendanceRate: number;
}

class AnalyticsService extends BaseService {
  async getDashboardMetrics(companyId: string): Promise<DashboardMetrics> {
    const cacheKey = `dashboard_metrics:${companyId}`;
    const cached = this.getCache<DashboardMetrics>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const today = new Date().toISOString().split('T')[0];

      // Total employees
      const { count: employeeCount } = await this.client
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      // Present today
      const { data: presentData } = await this.client
        .from('attendance_sessions')
        .select('user_id')
        .eq('date', today)
        .eq('status', 'present');

      // Pending leaves
      const { count: pendingLeaves } = await this.client
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Payroll estimate (current month total for this company)
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const { data: payrollData } = await this.client
        .from('payroll')
        .select('net_salary')
        .eq('company_id', companyId)
        .eq('month', currentMonth)
        .eq('year', currentYear);

      const payrollEstimate = payrollData?.reduce((sum, p) => sum + (p.net_salary || 0), 0) || 0;
      const { data: deptData } = await this.client
        .from('departments')
        .select('id, name')
        .eq('company_id', companyId);

      const departmentCounts: { [key: string]: number } = {};
      if (deptData) {
        for (const dept of deptData) {
          const { count } = await this.client
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', dept.id);
          departmentCounts[dept.name] = count || 0;
        }
      }

      // Attendance rate (last 30 days)
      const { data: attendanceData } = await this.client
        .from('attendance_sessions')
        .select('*')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .eq('company_id', companyId);

      const presentCount = attendanceData?.filter(a => a.status === 'present').length || 0;
      const attendanceRate = attendanceData && attendanceData.length > 0 
        ? (presentCount / attendanceData.length) * 100 
        : 0;

      const metrics: DashboardMetrics = {
        totalEmployees: employeeCount || 0,
        presentToday: presentData?.length || 0,
        pendingLeaves: pendingLeaves || 0,
        payrollEstimate: payrollEstimate,
        departmentCounts,
        attendanceRate: Math.round(attendanceRate),
      };

      this.setCache(cacheKey, metrics);
      return metrics;
    }, `Get dashboard metrics ${companyId}`);
  }

  async getAttendanceAnalytics(companyId: string, startDate: string, endDate: string): Promise<any> {
    const cacheKey = `attendance_analytics:${companyId}:${startDate}:${endDate}`;
    const cached = this.getCache<any>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('attendance_sessions')
        .select('*')
        .eq('company_id', companyId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      // Calculate analytics
      const byDate: { [key: string]: { present: number; absent: number; total: number } } = {};
      const byUser: { [key: string]: { present: number; absent: number; total: number } } = {};

      (data || []).forEach(record => {
        // By date
        if (!byDate[record.date]) {
          byDate[record.date] = { present: 0, absent: 0, total: 0 };
        }
        byDate[record.date].total++;
        if (record.status === 'present') byDate[record.date].present++;
        else byDate[record.date].absent++;

        // By user
        if (!byUser[record.user_id]) {
          byUser[record.user_id] = { present: 0, absent: 0, total: 0 };
        }
        byUser[record.user_id].total++;
        if (record.status === 'present') byUser[record.user_id].present++;
        else byUser[record.user_id].absent++;
      });

      const analytics = { byDate, byUser, totalRecords: data?.length || 0 };
      this.setCache(cacheKey, analytics);
      return analytics;
    }, `Get attendance analytics ${companyId}`);
  }

  async getPayrollAnalytics(companyId: string, year: number): Promise<any> {
    const cacheKey = `payroll_analytics:${companyId}:${year}`;
    const cached = this.getCache<any>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('payroll')
        .select('*')
        .eq('company_id', companyId)
        .eq('year', year);

      if (error) throw error;

      // Calculate analytics
      const byMonth: { [key: string]: { totalSalary: number; totalDeductions: number; count: number } } = {};

      (data || []).forEach(record => {
        const month = record.month.toString().padStart(2, '0');
        if (!byMonth[month]) {
          byMonth[month] = { totalSalary: 0, totalDeductions: 0, count: 0 };
        }
        byMonth[month].totalSalary += record.base_salary || 0;
        byMonth[month].totalDeductions += record.total_deductions || 0;
        byMonth[month].count++;
      });

      const analytics = {
        byMonth,
        totalPayroll: (data || []).reduce((sum, r) => sum + (r.net_salary || 0), 0),
        totalDeductions: (data || []).reduce((sum, r) => sum + (r.total_deductions || 0), 0),
        recordCount: data?.length || 0,
      };

      this.setCache(cacheKey, analytics);
      return analytics;
    }, `Get payroll analytics ${companyId}`);
  }

  async getLeaveAnalytics(companyId: string): Promise<any> {
    const cacheKey = `leave_analytics:${companyId}`;
    const cached = this.getCache<any>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const { data, error } = await this.client
        .from('leave_requests')
        .select('*')
        .eq('company_id', companyId);

      if (error) throw error;

      // Calculate analytics
      const byStatus: { [key: string]: number } = { approved: 0, pending: 0, rejected: 0 };
      const byType: { [key: string]: number } = {};

      (data || []).forEach(record => {
        byStatus[record.status] = (byStatus[record.status] || 0) + 1;
        byType[record.leave_type] = (byType[record.leave_type] || 0) + 1;
      });

      const analytics = {
        byStatus,
        byType,
        totalRequests: data?.length || 0,
      };

      this.setCache(cacheKey, analytics);
      return analytics;
    }, `Get leave analytics ${companyId}`);
  }

  async getEmployeeMetrics(userId: string): Promise<any> {
    const cacheKey = `employee_metrics:${userId}`;
    const cached = this.getCache<any>(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      // Get attendance for last 30 days
      const { data: attendanceData } = await this.client
        .from('attendance_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      const presentDays = attendanceData?.filter(a => a.status === 'present').length || 0;
      const absentDays = attendanceData?.filter(a => a.status === 'absent').length || 0;

      // Get leave balance
      const { data: balanceData } = await this.client
        .from('leave_balances')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get recent leaves
      const { data: leaveData } = await this.client
        .from('leave_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      const metrics = {
        attendance: {
          presentDays,
          absentDays,
          attendanceRate: attendanceData?.length ? Math.round((presentDays / attendanceData.length) * 100) : 0,
        },
        leaves: {
          balance: balanceData,
          recentRequests: leaveData || [],
        },
      };

      this.setCache(cacheKey, metrics);
      return metrics;
    }, `Get employee metrics ${userId}`);
  }

  async clearAnalyticsCaches(companyId: string): Promise<void> {
    const cacheKeys = [
      `dashboard_metrics:${companyId}`,
      `leave_analytics:${companyId}`,
    ];
    cacheKeys.forEach(key => this.clearCache(key));
  }
}

export const analyticsService = new AnalyticsService();
