-- Automatically downgrade users to basic when subscription_end_date has passed
-- Safe to run multiple times
BEGIN;

-- Ensure pg_cron is available (Supabase uses the extensions schema)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Function to downgrade expired users
CREATE OR REPLACE FUNCTION public.downgrade_expired_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET plan = 'basic',
      subscription_type = NULL,
      subscription_end_date = NULL,
      updated_at = now()
  WHERE subscription_end_date IS NOT NULL
    AND subscription_end_date <= now();
END;
$$;

-- Optional: allow roles to execute the function manually (not required for cron)
GRANT EXECUTE ON FUNCTION public.downgrade_expired_users() TO anon, authenticated, service_role;

-- Schedule to run daily at 00:05 UTC (idempotent: ignore if job already exists)
DO $$
BEGIN
  PERFORM cron.schedule(
    'downgrade-expired-users',
    '5 0 * * *',
    'SELECT public.downgrade_expired_users();'
  );
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'Cron job downgrade-expired-users already exists; keeping existing schedule.';
END $$;

COMMIT;
