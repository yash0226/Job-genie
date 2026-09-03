-- Drop all existing policies
DROP POLICY IF EXISTS "Public users can create inactive device links" ON public.device_links;
DROP POLICY IF EXISTS "Users can claim unclaimed device links" ON public.device_links;
DROP POLICY IF EXISTS "Users can create own device links" ON public.device_links;
DROP POLICY IF EXISTS "Users can create their own device links" ON public.device_links;
DROP POLICY IF EXISTS "Users can delete own device links" ON public.device_links;
DROP POLICY IF EXISTS "Users can read own device links" ON public.device_links;
DROP POLICY IF EXISTS "Users can update device links" ON public.device_links;
DROP POLICY IF EXISTS "Users can update own device links" ON public.device_links;
DROP POLICY IF EXISTS "Users can view own device links" ON public.device_links;
DROP POLICY IF EXISTS "Users can view their own device links" ON public.device_links;
DROP POLICY IF EXISTS "Users can view their own devices" ON public.device_links;

-- Create simplified policies
-- Allow public to read device links (needed for verification)
CREATE POLICY "Allow reading device links"
    ON public.device_links
    FOR SELECT
    TO public
    USING (true);

-- Allow authenticated users to update device links
CREATE POLICY "Allow updating device links"
    ON public.device_links
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow desktop app to create device links
CREATE POLICY "Allow creating device links"
    ON public.device_links
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Make user_id nullable if it isn't already
ALTER TABLE public.device_links 
ALTER COLUMN user_id DROP NOT NULL; 