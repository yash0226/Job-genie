BEGIN;

-- Debug script to identify why moderate plans aren't setting users.plan correctly
-- Run this to see what's happening with your moderate plan purchases

-- 1. Check current state of users with recent subscriptions
SELECT 
  u.id,
  u.email,
  u.plan as current_plan,
  u.subscription_type,
  u.subscription_end_date,
  u.created_at as user_created,
  u.updated_at as user_updated
FROM public.users u
WHERE u.subscription_end_date > now() - interval '1 day'
ORDER BY u.updated_at DESC;

-- 2. Check recent transactions and their associated plans
SELECT 
  t.id as transaction_id,
  t.user_id,
  t.status,
  t.created_at as transaction_time,
  p.id as plan_id,
  p.name as plan_name,
  p.tier as plan_tier,
  p.duration_months,
  p.duration_days
FROM public.transactions t
LEFT JOIN public.plans p ON t.plan_id::uuid = p.id
WHERE t.created_at > now() - interval '1 day'
ORDER BY t.created_at DESC;

-- 3. Check if there are any triggers or functions that might reset plan
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgrelid = 'public.users'::regclass
  AND NOT tgisinternal;

-- 4. Check current cron jobs
SELECT * FROM cron.job WHERE jobname LIKE '%downgrade%' OR jobname LIKE '%user%';

-- 5. Manually test updating a user to moderate (replace with actual user ID)
-- UPDATE public.users SET plan = 'moderate' WHERE id = 'YOUR_USER_ID_HERE';
-- SELECT id, plan FROM public.users WHERE id = 'YOUR_USER_ID_HERE';

COMMIT;
