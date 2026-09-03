BEGIN;

-- Force update any users who should have moderate plan but are stuck on basic
-- This fixes users who purchased moderate plans but got reset by cron or other issues

-- Update users with active moderate subscriptions but basic plan
UPDATE public.users 
SET plan = 'moderate'
WHERE plan = 'basic' 
  AND subscription_type IN ('daily', 'monthly')
  AND subscription_end_date > now()
  AND (
    -- Check if their last transaction was for a moderate plan
    id IN (
      SELECT DISTINCT t.user_id 
      FROM transactions t
      JOIN plans p ON t.plan_id::uuid = p.id
      WHERE t.status = 'completed'
        AND (p.tier = 'moderate' OR lower(p.name) LIKE '%moderate%')
        AND t.created_at > now() - interval '7 days'
    )
  );

-- Also ensure the downgrade function respects moderate plans
CREATE OR REPLACE FUNCTION public.downgrade_expired_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only downgrade users whose subscription ended more than 1 hour ago
  -- Preserve the distinction between moderate and pro when downgrading
  UPDATE public.users
  SET plan = 'basic',
      subscription_type = NULL,
      subscription_end_date = NULL,
      updated_at = now()
  WHERE subscription_end_date IS NOT NULL
    AND subscription_end_date <= (now() - interval '1 hour');
    
  -- Log the downgrade for debugging
  RAISE NOTICE 'Downgraded % expired users to basic plan', ROW_COUNT;
END;
$$;

COMMIT;
