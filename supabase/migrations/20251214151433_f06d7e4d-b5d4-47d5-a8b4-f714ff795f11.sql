-- =============================================
-- PHASE 1: CREATE CORE MULTI-TENANT TABLES
-- =============================================

-- 1.1 Create companies table
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  domain text,
  logo_url text,
  is_active boolean DEFAULT true,
  trial_ends_at timestamp with time zone DEFAULT (now() + interval '14 days'),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 1.2 Add super_admin to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- 1.3 Create super_admins table
CREATE TABLE public.super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on super_admins
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- 1.4 Create subscription types
CREATE TYPE public.subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'paused');
CREATE TYPE public.plan_type AS ENUM ('free', 'starter', 'professional', 'enterprise');

-- 1.5 Create subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_type plan_type DEFAULT 'free',
  status subscription_status DEFAULT 'trialing',
  max_employees integer DEFAULT 5,
  current_period_start timestamp with time zone DEFAULT now(),
  current_period_end timestamp with time zone DEFAULT (now() + interval '1 month'),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 1.6 Create billing_history table
CREATE TABLE public.billing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'INR',
  description text,
  invoice_url text,
  status text DEFAULT 'paid',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on billing_history
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PHASE 2: ADD company_id TO ALL EXISTING TABLES
-- =============================================

-- 2.1 Add company_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2.2 Add company_id to departments
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2.3 Add company_id to holidays
ALTER TABLE public.holidays ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2.4 Add company_id to work_sessions
ALTER TABLE public.work_sessions ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2.5 Add company_id to company_settings
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2.6 Add company_id to attendance_sessions
ALTER TABLE public.attendance_sessions ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2.7 Add company_id to leave_balances
ALTER TABLE public.leave_balances ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2.8 Add company_id to leave_requests
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2.9 Add company_id to payroll
ALTER TABLE public.payroll ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2.10 Add company_id to payroll_adjustments
ALTER TABLE public.payroll_adjustments ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- =============================================
-- PHASE 3: CREATE HELPER FUNCTIONS
-- =============================================

-- 3.1 Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = _user_id)
$$;

-- 3.2 Get user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- 3.3 Check if user belongs to company
CREATE OR REPLACE FUNCTION public.belongs_to_company(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = _user_id AND company_id = _company_id
  )
$$;

-- =============================================
-- PHASE 4: UPDATE RLS POLICIES
-- =============================================

-- 4.1 Companies RLS policies
CREATE POLICY "Super admins can manage all companies"
ON public.companies
FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Users can view their own company"
ON public.companies
FOR SELECT
USING (id = get_user_company_id(auth.uid()));

CREATE POLICY "Allow company creation during signup"
ON public.companies
FOR INSERT
WITH CHECK (true);

-- 4.2 Super admins RLS policies
CREATE POLICY "Super admins can view super_admins table"
ON public.super_admins
FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage super_admins"
ON public.super_admins
FOR ALL
USING (is_super_admin(auth.uid()));

-- 4.3 Subscriptions RLS policies
CREATE POLICY "Super admins can manage all subscriptions"
ON public.subscriptions
FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company owners can view their subscription"
ON public.subscriptions
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'))
);

-- 4.4 Billing history RLS policies
CREATE POLICY "Super admins can manage all billing"
ON public.billing_history
FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company owners can view their billing"
ON public.billing_history
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'))
);

-- =============================================
-- PHASE 5: UPDATE EXISTING TABLE RLS POLICIES
-- =============================================

-- 5.1 Drop and recreate profiles policies with company isolation
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view appropriate profiles" ON public.profiles;

CREATE POLICY "Super admins can manage all profiles"
ON public.profiles
FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage profiles"
ON public.profiles
FOR ALL
USING (
  company_id = get_user_company_id(auth.uid())
  AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Users can view profiles in their company"
ON public.profiles
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Allow profile creation"
ON public.profiles
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 5.2 Drop and recreate departments policies
DROP POLICY IF EXISTS "Departments are manageable by admins" ON public.departments;
DROP POLICY IF EXISTS "Departments are viewable by authenticated users" ON public.departments;

CREATE POLICY "Super admins can manage all departments"
ON public.departments
FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage departments"
ON public.departments
FOR ALL
USING (
  company_id = get_user_company_id(auth.uid())
  AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Users can view departments in their company"
ON public.departments
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  OR is_super_admin(auth.uid())
);

-- 5.3 Drop and recreate holidays policies
DROP POLICY IF EXISTS "Admins can manage holidays" ON public.holidays;
DROP POLICY IF EXISTS "Holidays are viewable by authenticated users" ON public.holidays;

CREATE POLICY "Super admins can manage all holidays"
ON public.holidays
FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage holidays"
ON public.holidays
FOR ALL
USING (
  company_id = get_user_company_id(auth.uid())
  AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Users can view holidays in their company"
ON public.holidays
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  OR is_super_admin(auth.uid())
);

-- 5.4 Drop and recreate work_sessions policies
DROP POLICY IF EXISTS "Admins can manage work sessions" ON public.work_sessions;
DROP POLICY IF EXISTS "Sessions are viewable by authenticated users" ON public.work_sessions;

CREATE POLICY "Super admins can manage all work sessions"
ON public.work_sessions
FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage work sessions"
ON public.work_sessions
FOR ALL
USING (
  company_id = get_user_company_id(auth.uid())
  AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Users can view work sessions in their company"
ON public.work_sessions
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  OR is_super_admin(auth.uid())
);

-- 5.5 Drop and recreate company_settings policies
DROP POLICY IF EXISTS "Admins can manage company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.company_settings;

CREATE POLICY "Super admins can manage all settings"
ON public.company_settings
FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage settings"
ON public.company_settings
FOR ALL
USING (
  company_id = get_user_company_id(auth.uid())
  AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Users can view settings in their company"
ON public.company_settings
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  OR is_super_admin(auth.uid())
);

-- 5.6 Drop and recreate attendance_sessions policies
DROP POLICY IF EXISTS "Users can insert their own attendance" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Users can update their own attendance" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Users can view their own attendance" ON public.attendance_sessions;

CREATE POLICY "Super admins can manage all attendance"
ON public.attendance_sessions
FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Users can insert their own attendance"
ON public.attendance_sessions
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "Company admins can insert attendance"
ON public.attendance_sessions
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Users can update their own attendance"
ON public.attendance_sessions
FOR UPDATE
USING (user_id = auth.uid() AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can view attendance in their company"
ON public.attendance_sessions
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  AND (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'owner')
    OR has_role(auth.uid(), 'admin')
    OR manages_user(auth.uid(), user_id)
  )
);

-- 5.7 Drop and recreate leave_balances policies
DROP POLICY IF EXISTS "Admins can manage leave balances" ON public.leave_balances;
DROP POLICY IF EXISTS "Users can view their own leave balance" ON public.leave_balances;

CREATE POLICY "Super admins can manage all leave balances"
ON public.leave_balances
FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage leave balances"
ON public.leave_balances
FOR ALL
USING (
  company_id = get_user_company_id(auth.uid())
  AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Users can view their own leave balance"
ON public.leave_balances
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  AND (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'owner')
    OR has_role(auth.uid(), 'admin')
  )
);

-- 5.8 Drop and recreate leave_requests policies
DROP POLICY IF EXISTS "Users can create their own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can delete their own pending requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can update their own pending requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can view their own leave requests" ON public.leave_requests;

CREATE POLICY "Super admins can manage all leave requests"
ON public.leave_requests
FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Users can create their own leave requests"
ON public.leave_requests
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "Users can delete their own pending requests"
ON public.leave_requests
FOR DELETE
USING (
  user_id = auth.uid()
  AND status = 'pending'
  AND company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "Users can update leave requests"
ON public.leave_requests
FOR UPDATE
USING (
  company_id = get_user_company_id(auth.uid())
  AND (
    (user_id = auth.uid() AND status = 'pending')
    OR has_role(auth.uid(), 'owner')
    OR has_role(auth.uid(), 'admin')
    OR manages_user(auth.uid(), user_id)
  )
);

CREATE POLICY "Users can view leave requests in their company"
ON public.leave_requests
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  AND (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'owner')
    OR has_role(auth.uid(), 'admin')
    OR manages_user(auth.uid(), user_id)
  )
);

-- 5.9 Drop and recreate payroll policies
DROP POLICY IF EXISTS "Admins can manage payroll" ON public.payroll;
DROP POLICY IF EXISTS "Users can view their own payroll" ON public.payroll;

CREATE POLICY "Super admins can manage all payroll"
ON public.payroll
FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage payroll"
ON public.payroll
FOR ALL
USING (
  company_id = get_user_company_id(auth.uid())
  AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Users can view their own payroll"
ON public.payroll
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  AND (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'owner')
    OR has_role(auth.uid(), 'admin')
  )
);

-- 5.10 Drop and recreate payroll_adjustments policies
DROP POLICY IF EXISTS "Admins can manage payroll adjustments" ON public.payroll_adjustments;
DROP POLICY IF EXISTS "Users can view their own payroll adjustments" ON public.payroll_adjustments;

CREATE POLICY "Super admins can manage all payroll adjustments"
ON public.payroll_adjustments
FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage payroll adjustments"
ON public.payroll_adjustments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.payroll p
    WHERE p.id = payroll_adjustments.payroll_id
    AND p.company_id = get_user_company_id(auth.uid())
  )
  AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Users can view their own payroll adjustments"
ON public.payroll_adjustments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.payroll p
    WHERE p.id = payroll_adjustments.payroll_id
    AND p.company_id = get_user_company_id(auth.uid())
    AND (
      p.user_id = auth.uid()
      OR has_role(auth.uid(), 'owner')
      OR has_role(auth.uid(), 'admin')
    )
  )
);

-- 5.11 Update user_roles policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can manage roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_roles.user_id
    AND p.company_id = get_user_company_id(auth.uid())
  )
  AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Users can view roles in their company"
ON public.user_roles
FOR SELECT
USING (
  user_id = auth.uid()
  OR is_super_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_roles.user_id
    AND p.company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'))
  )
);

-- =============================================
-- PHASE 6: UPDATE TRIGGERS
-- =============================================

-- Update handle_new_user to NOT auto-create profile (will be handled by signup flow)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Don't auto-create anything for new users
  -- Profile and role creation will be handled by the signup flow
  -- This prevents issues with company_id requirement
  RETURN NEW;
END;
$$;

-- Create updated_at triggers for new tables
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PHASE 7: CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_departments_company_id ON public.departments(company_id);
CREATE INDEX IF NOT EXISTS idx_holidays_company_id ON public.holidays(company_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_company_id ON public.work_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_company_settings_company_id ON public.company_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_company_id ON public.attendance_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_company_id ON public.leave_balances(company_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_company_id ON public.leave_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_company_id ON public.payroll(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_super_admins_user_id ON public.super_admins(user_id);