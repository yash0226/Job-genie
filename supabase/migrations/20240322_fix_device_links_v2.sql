-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own device links" ON public.device_links;
DROP POLICY IF EXISTS "Users can create their own device links" ON public.device_links;
DROP POLICY IF EXISTS "Users can update their own device links" ON public.device_links;

-- Create new policies with fixed permissions
CREATE POLICY "Users can view their own device links"
    ON public.device_links
    FOR SELECT
    TO authenticated
    USING (true);  -- Allow reading all device links

CREATE POLICY "Users can create their own device links"
    ON public.device_links
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update device links"
    ON public.device_links
    FOR UPDATE
    TO authenticated
    USING (true)  -- Allow updating any device link
    WITH CHECK (true);  -- Allow any updates

-- Add policy for deleting device links
CREATE POLICY "Users can delete their own device links"
    ON public.device_links
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id); 