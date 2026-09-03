-- Allow 'daily' as a valid users.subscription_type value
-- Safe to run multiple times
BEGIN;

-- Drop all existing CHECK constraints that apply to column "subscription_type"
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.conrelid = 'public.users'::regclass
      AND c.contype = 'c'
      AND a.attname = 'subscription_type'
  ) LOOP
    EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- Add new check constraint allowing 'monthly', 'yearly', and 'daily'
ALTER TABLE public.users
  ADD CONSTRAINT users_subscription_type_check
  CHECK (subscription_type IS NULL OR subscription_type = ANY (ARRAY['monthly','yearly','daily']));

COMMIT;
