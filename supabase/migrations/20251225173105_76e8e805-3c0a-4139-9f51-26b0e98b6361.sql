-- Add per-employee pricing to subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS price_per_employee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS base_price numeric DEFAULT 0;

-- Create plans table for super admin to manage pricing tiers
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  plan_type plan_type NOT NULL UNIQUE,
  base_price numeric NOT NULL DEFAULT 0,
  price_per_employee numeric NOT NULL DEFAULT 0,
  max_employees integer NOT NULL DEFAULT 5,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Plans are readable by authenticated users
CREATE POLICY "Anyone can view active plans" 
ON public.plans 
FOR SELECT 
USING (is_active = true);

-- Super admins can manage plans
CREATE POLICY "Super admins can manage plans" 
ON public.plans 
FOR ALL 
USING (is_super_admin(auth.uid()));

-- Insert default plans
INSERT INTO public.plans (name, plan_type, base_price, price_per_employee, max_employees, features)
VALUES 
  ('Free', 'free', 0, 0, 5, '["Basic attendance", "Leave management", "Basic payroll"]'::jsonb),
  ('Starter', 'starter', 999, 99, 25, '["All Free features", "Custom work sessions", "Holiday calendar", "Email support"]'::jsonb),
  ('Professional', 'professional', 2499, 149, 100, '["All Starter features", "Advanced reporting", "Org chart", "Priority support"]'::jsonb),
  ('Enterprise', 'enterprise', 9999, 199, 9999, '["All Professional features", "Custom integrations", "Dedicated support", "SLA"]'::jsonb)
ON CONFLICT (plan_type) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();