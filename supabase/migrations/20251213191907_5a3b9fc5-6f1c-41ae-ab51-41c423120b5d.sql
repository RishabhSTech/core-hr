-- Create company_settings table for PF, ESIC, EPF configuration
CREATE TABLE public.company_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Only owners/admins can manage company settings
CREATE POLICY "Admins can manage company settings"
  ON public.company_settings
  FOR ALL
  USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can view settings for payroll calculations
CREATE POLICY "Authenticated users can view settings"
  ON public.company_settings
  FOR SELECT
  USING (true);

-- Create payroll_adjustments table for additions/deductions
CREATE TABLE public.payroll_adjustments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_id uuid NOT NULL REFERENCES public.payroll(id) ON DELETE CASCADE,
  adjustment_type text NOT NULL CHECK (adjustment_type IN ('addition', 'deduction')),
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payroll_adjustments ENABLE ROW LEVEL SECURITY;

-- Admins can manage payroll adjustments
CREATE POLICY "Admins can manage payroll adjustments"
  ON public.payroll_adjustments
  FOR ALL
  USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own payroll adjustments
CREATE POLICY "Users can view their own payroll adjustments"
  ON public.payroll_adjustments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.payroll p 
      WHERE p.id = payroll_id AND p.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'owner'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Add columns to payroll for statutory deductions
ALTER TABLE public.payroll 
ADD COLUMN IF NOT EXISTS pf_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS esic_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS epf_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS gross_salary numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_additions numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_deductions numeric DEFAULT 0;

-- Insert default company settings
INSERT INTO public.company_settings (setting_key, setting_value) VALUES 
('payroll_config', '{"pf_enabled": false, "pf_percentage": 12, "esic_enabled": false, "esic_percentage": 0.75, "epf_enabled": false, "epf_percentage": 12}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();