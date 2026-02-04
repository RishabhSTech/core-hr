
-- Drop foreign key constraints to allow demo data insertion
ALTER TABLE public.leave_balances DROP CONSTRAINT IF EXISTS leave_balances_user_id_fkey;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE public.leave_requests DROP CONSTRAINT IF EXISTS leave_requests_user_id_fkey;
ALTER TABLE public.attendance_sessions DROP CONSTRAINT IF EXISTS attendance_sessions_user_id_fkey;
ALTER TABLE public.payroll DROP CONSTRAINT IF EXISTS payroll_user_id_fkey;
