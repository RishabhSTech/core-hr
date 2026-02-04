
-- Temporarily drop the foreign key constraint on profiles.user_id to allow demo data
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
