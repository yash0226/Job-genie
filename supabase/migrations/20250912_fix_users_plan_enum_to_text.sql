BEGIN;

-- 1) Ensure users.plan can store 'basic' | 'moderate' | 'pro'
-- If plan is an enum, convert to text first (safe using enum::text)
ALTER TABLE public.users
  ALTER COLUMN plan TYPE text USING plan::text;

-- 2) Drop existing CHECK constraint if present (name-agnostic)
DO $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.users'::regclass
      AND contype = 'c'
      AND conname ILIKE '%plan%check%'
  ) LOOP
    EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- 3) Normalize any legacy values
UPDATE public.users SET plan = 'pro' WHERE plan IN ('premium');
UPDATE public.users SET plan = 'basic' WHERE plan IS NULL OR plan NOT IN ('basic','moderate','pro');

-- 4) Re-add CHECK constraint and default
ALTER TABLE public.users
  ALTER COLUMN plan SET DEFAULT 'basic';

ALTER TABLE public.users
  ADD CONSTRAINT users_plan_check
  CHECK (plan = ANY (ARRAY['basic','moderate','pro']));

COMMIT;
