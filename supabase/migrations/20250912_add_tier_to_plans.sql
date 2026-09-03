BEGIN;

-- 1) Add tier column to plans (moderate | pro)
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS tier text;

-- 2) Add a CHECK constraint to restrict values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'plans_tier_check'
  ) THEN
    ALTER TABLE public.plans
      ADD CONSTRAINT plans_tier_check
      CHECK (tier IS NULL OR tier = ANY (ARRAY['moderate','pro']));
  END IF;
END $$;

-- 3) Backfill tier for existing rows
-- Prefer explicit IDs if known; otherwise use name patterns as fallback
UPDATE public.plans
SET tier = 'pro'
WHERE lower(name) LIKE '%premium%' OR lower(name) LIKE '%pro%';

UPDATE public.plans
SET tier = 'moderate'
WHERE lower(name) LIKE '%moderate%';

-- 4) Optionally set known IDs directly (safe if they exist)
UPDATE public.plans SET tier = 'pro' WHERE id IN (
  '0625bdd2-1933-4974-b082-855818f0dd8f', -- Yearly Premium
  '4bcb83bc-2322-42f4-896f-0e2288d246a5'  -- Monthly Premium
);
UPDATE public.plans SET tier = 'moderate' WHERE id IN (
  '8c91c981-1e96-4922-92bc-1ce77d331631', -- Monthly Moderate
  'b1cb203c-1f3c-45ea-b80c-5377fd3dca7c'  -- Moderate (Daily)
);

-- 5) Set a default and NOT NULL once backfilled
ALTER TABLE public.plans
  ALTER COLUMN tier SET DEFAULT 'pro';

-- Ensure no nulls remain (after backfill defaults)
UPDATE public.plans SET tier = 'pro' WHERE tier IS NULL;

ALTER TABLE public.plans
  ALTER COLUMN tier SET NOT NULL;

COMMIT;
