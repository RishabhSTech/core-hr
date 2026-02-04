-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- Create a more restrictive policy for viewing profiles
-- Users can view: their own profile, profiles they manage, or all profiles if admin/owner
CREATE POLICY "Users can view appropriate profiles" 
ON public.profiles 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR has_role(auth.uid(), 'owner'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR manages_user(auth.uid(), user_id)
);

-- Create a view for basic employee info (name, department) that's safe to share
-- This allows org chart and employee directory to work without exposing sensitive data
CREATE OR REPLACE VIEW public.employee_directory AS
SELECT 
  id,
  user_id,
  employee_id,
  first_name,
  last_name,
  department_id,
  reporting_manager_id,
  avatar_url
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.employee_directory TO authenticated;