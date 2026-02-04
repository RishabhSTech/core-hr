-- Drop the view with security definer issue
DROP VIEW IF EXISTS public.employee_directory;

-- Recreate the view with SECURITY INVOKER (default, but explicit)
CREATE VIEW public.employee_directory 
WITH (security_invoker = true)
AS
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