BEGIN;

-- Manual fix for moderate plan issue
-- This directly updates users who have active moderate subscriptions but wrong plan

-- Step 1: Identify and fix users with moderate subscriptions but basic plan
WITH moderate_users AS (
  SELECT DISTINCT u.id, u.email, u.plan, u.subscription_type, u.subscription_end_date
  FROM public.users u
  WHERE u.plan = 'basic'
    AND u.subscription_type IN ('daily', 'monthly') 
    AND u.subscription_end_date > now()
    AND u.updated_at > now() - interval '24 hours'  -- Recent activity
)
UPDATE public.users 
SET plan = 'moderate',
    updated_at = now()
FROM moderate_users m
WHERE users.id = m.id;

-- Step 2: Disable the cron job temporarily to prevent interference
SELECT cron.unschedule('downgrade-expired-users');

-- Step 3: Create a safer downgrade function that preserves moderate/pro distinction
CREATE OR REPLACE FUNCTION public.downgrade_expired_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  downgraded_count INTEGER := 0;
BEGIN
  -- Only downgrade users whose subscription ended more than 2 hours ago
  -- This prevents interference with recent purchases
  UPDATE public.users
  SET plan = 'basic',
      subscription_type = NULL,
      subscription_end_date = NULL,
      updated_at = now()
  WHERE subscription_end_date IS NOT NULL
    AND subscription_end_date <= (now() - interval '2 hours');
    
  GET DIAGNOSTICS downgraded_count = ROW_COUNT;
  RAISE NOTICE 'Downgraded % expired users to basic plan', downgraded_count;
END;
$$;

-- Step 4: Re-enable cron with safer function
SELECT cron.schedule(
  'downgrade-expired-users',
  '5 0 * * *',  -- Daily at 00:05 UTC
  'SELECT public.downgrade_expired_users();'
);

-- Step 5: Verify the fix
SELECT 
  plan,
  subscription_type,
  COUNT(*) as user_count
FROM public.users 
WHERE subscription_end_date > now()
GROUP BY plan, subscription_type
ORDER BY plan, subscription_type;

COMMIT;
