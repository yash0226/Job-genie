-- Allow 'moderate' as a valid users.plan value
-- Safe to run multiple times
BEGIN;

-- Drop all existing CHECK constraints that apply to column "plan"
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.conrelid = 'public.users'::regclass
      AND c.contype = 'c'
      AND a.attname = 'plan'
  ) LOOP
    EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- Add new check constraint allowing 'basic', 'pro', and 'moderate'
ALTER TABLE public.users
  ADD CONSTRAINT users_plan_check
  CHECK (plan = ANY (ARRAY['basic','pro','moderate']));

COMMIT;
