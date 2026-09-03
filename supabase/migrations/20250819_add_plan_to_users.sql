-- Add plan column to users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'basic';

-- Optional: constrain allowed values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_plan_check'
  ) THEN
    ALTER TABLE public.users
    ADD CONSTRAINT users_plan_check CHECK (plan IN ('basic', 'pro'));
  END IF;
END
$$;

-- Backfill any NULLs just in case (defensive)
UPDATE public.users SET plan = 'basic' WHERE plan IS NULL;
