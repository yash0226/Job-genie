BEGIN;

-- Temporarily disable the cron job that downgrades expired users to basic
-- This prevents it from interfering with plan updates during testing
SELECT cron.unschedule('downgrade-expired-users');

-- Optionally, we can modify the function to be more selective
-- Only downgrade if subscription truly expired (not just updated)
CREATE OR REPLACE FUNCTION public.downgrade_expired_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only downgrade users whose subscription ended more than 1 hour ago
  -- This prevents interference with recent purchases
  UPDATE public.users
  SET plan = 'basic',
      subscription_type = NULL,
      subscription_end_date = NULL,
      updated_at = now()
  WHERE subscription_end_date IS NOT NULL
    AND subscription_end_date <= (now() - interval '1 hour');
END;
$$;

-- Re-schedule with the updated function (runs daily at 00:05 UTC)
SELECT cron.schedule(
  'downgrade-expired-users',
  '5 0 * * *',
  'SELECT public.downgrade_expired_users();'
);

COMMIT;
