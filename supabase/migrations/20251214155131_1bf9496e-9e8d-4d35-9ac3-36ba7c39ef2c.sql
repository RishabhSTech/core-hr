-- Drop and recreate the company creation policy as PERMISSIVE
DROP POLICY IF EXISTS "Allow company creation during signup" ON public.companies;

CREATE POLICY "Allow company creation during signup"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also fix profiles insert policy to be permissive for signup
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;

CREATE POLICY "Allow profile creation"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());