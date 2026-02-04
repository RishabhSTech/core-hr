export type AppRole = 'owner' | 'admin' | 'manager' | 'employee';
export type LeaveType = 'casual' | 'sick' | 'paid' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'on_leave' | 'late';

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  employee_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  company_id: string | null;
  department_id: string | null;
  reporting_manager_id: string | null;
  date_of_joining: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_name: string | null;
  monthly_salary: number;
  salary_type: 'fixed' | 'daily';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  department?: Department;
  reporting_manager?: Profile;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface AttendanceSession {
  id: string;
  user_id: string;
  sign_in_time: string;
  sign_out_time: string | null;
  status: AttendanceStatus;
  notes: string | null;
  created_at: string;
}

export interface LeaveBalance {
  id: string;
  user_id: string;
  casual_leave: number;
  sick_leave: number;
  paid_leave: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: LeaveStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Payroll {
  id: string;
  user_id: string;
  month: number;
  year: number;
  working_days: number;
  present_days: number;
  paid_leave_days: number;
  unpaid_leave_days: number;
  base_salary: number;
  deductions: number;
  net_salary: number;
  status: 'draft' | 'processed' | 'paid';
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}
