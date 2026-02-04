-- Allow anyone to search for active companies (only basic info exposed)
CREATE POLICY "Anyone can search active companies"
ON public.companies
FOR SELECT
USING (is_active = true);