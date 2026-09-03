-- Create app_users table for JobGenie early access accounts
-- Safe to run multiple times due to IF NOT EXISTS checks

-- Ensure pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.app_users (
  experience_years numeric DEFAULT 1.0,
  experience_details text DEFAULT '1 year of experience in software development',
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  first_name text,
  last_name text,
  education text,
  tokens integer DEFAULT 0,
  token_referral integer,
  token_helper integer,
  CONSTRAINT app_users_pkey PRIMARY KEY (id)
);

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_app_users_updated_at'
  ) THEN
    CREATE TRIGGER set_app_users_updated_at
    BEFORE UPDATE ON public.app_users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- Note: RLS is off by default for new tables in Supabase. The API route uses service role key.
