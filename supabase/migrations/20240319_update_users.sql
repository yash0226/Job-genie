-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL,
  tokens_remaining INTEGER DEFAULT 0,
  subscription_type VARCHAR(10),
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create RLS policies for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for users own data" ON public.users;
DROP POLICY IF EXISTS "Enable update access for users own data" ON public.users;
DROP POLICY IF EXISTS "Enable insert access for service role" ON public.users;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.users;

-- Users can read and update their own data
CREATE POLICY "Enable read access for users own data" ON public.users
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Enable update access for users own data" ON public.users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- Create policy for inserting new users (used by service role)
CREATE POLICY "Enable insert access for service role" ON public.users
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Create policy for inserting new users by authenticated users
CREATE POLICY "Enable insert access for authenticated users" ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid()); 