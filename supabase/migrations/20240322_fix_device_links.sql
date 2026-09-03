-- Make user_id nullable
ALTER TABLE public.device_links 
ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own device links" ON public.device_links;
DROP POLICY IF EXISTS "Users can create their own device links" ON public.device_links;
DROP POLICY IF EXISTS "Users can update their own device links" ON public.device_links;

-- Create new policies
CREATE POLICY "Users can view their own device links"
    ON public.device_links
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id OR  -- Can view their own devices
        user_id IS NULL  -- Can view unlinked devices
    );

CREATE POLICY "Users can create their own device links"
    ON public.device_links
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update device links"
    ON public.device_links
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id OR  -- Can update their own devices
        (user_id IS NULL AND NOT is_active)  -- Can update unlinked and inactive devices
    ); 