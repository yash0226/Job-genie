BEGIN;

-- Fix transactions.plan_id type mismatch - convert from text to uuid
-- This allows proper joins with plans table

-- First, update any invalid plan_id values to NULL
UPDATE public.transactions 
SET plan_id = NULL 
WHERE plan_id IS NOT NULL 
  AND plan_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Convert the column type from text to uuid
ALTER TABLE public.transactions 
  ALTER COLUMN plan_id TYPE uuid USING plan_id::uuid;

-- Re-add the foreign key constraint
ALTER TABLE public.transactions 
  DROP CONSTRAINT IF EXISTS transactions_plan_id_fkey;

ALTER TABLE public.transactions 
  ADD CONSTRAINT transactions_plan_id_fkey 
  FOREIGN KEY (plan_id) REFERENCES public.plans(id);

COMMIT;
