-- Ensure users can update their own subscription fields (and plan)
-- Safe to run multiple times
BEGIN;

-- Enable RLS on users (no-op if already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create or replace an update policy allowing a user to update their own row
DO $$
DECLARE
  pol_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'users_update_own_row'
  ) INTO pol_exists;

  IF NOT pol_exists THEN
    CREATE POLICY users_update_own_row
      ON public.users
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

COMMIT;
