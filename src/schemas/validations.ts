// src/schemas/validations.ts
// Centralized input validation using Zod

import { z } from 'zod';

// Employee validation
export const createEmployeeSchema = z.object({
  first_name: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters'),
  
  last_name: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters'),
  
  email: z.string()
    .email('Invalid email address'),
  
  phone: z.string()
    .regex(/^[0-9+\-\s()]*$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  
  monthly_salary: z.number()
    .positive('Salary must be greater than 0')
    .max(999999999, 'Salary too large'),
  
  bank_account_number: z.string()
    .regex(/^\d{10,18}$/, 'Invalid bank account number')
    .optional()
    .or(z.literal('')),
  
  bank_ifsc: z.string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code')
    .optional()
    .or(z.literal('')),
  
  bank_name: z.string()
    .min(1, 'Bank name is required')
    .optional()
    .or(z.literal('')),
  
  department_id: z.string().uuid('Invalid department').optional(),
  reporting_manager_id: z.string().uuid('Invalid manager').optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

// Payroll validation
export const processPayrollSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2099),
  employeeIds: z.array(z.string().uuid()),
  baseSalary: z.number().positive().optional(),
  deductions: z.number().nonnegative().optional(),
});

export type ProcessPayrollInput = z.infer<typeof processPayrollSchema>;

// Leave request validation
export const createLeaveRequestSchema = z.object({
  leave_type: z.enum(['casual', 'sick', 'paid', 'unpaid']),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date'),
  reason: z.string()
    .max(500, 'Reason must be less than 500 characters')
    .optional(),
}).refine(
  (data) => new Date(data.start_date) <= new Date(data.end_date),
  { message: 'End date must be after or equal to start date', path: ['end_date'] }
);

export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;

// Attendance validation
export const markAttendanceSchema = z.object({
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  status: z.enum(['present', 'absent', 'half_day', 'on_leave', 'late']),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;

// Company settings validation
export const updateCompanySettingsSchema = z.object({
  name: z.string().min(1).max(200),
  logo_url: z.string().url('Invalid logo URL').optional(),
  financial_year_start: z.number().min(1).max(12),
  working_days_per_week: z.number().min(4).max(6),
  overtime_multiplier: z.number().positive().optional(),
  standard_working_hours: z.number().positive().optional(),
});

export type UpdateCompanySettingsInput = z.infer<typeof updateCompanySettingsSchema>;

// Holiday validation
export const createHolidaySchema = z.object({
  name: z.string().min(1).max(200),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  is_optional: z.boolean().default(false),
});

export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;

// Validate and handle errors consistently
export const validateInput = <T>(
  schema: z.ZodSchema,
  data: unknown
): { success: boolean; data?: T; errors?: Record<string, string> } => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated as T };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { _: 'Validation failed' } };
  }
};
