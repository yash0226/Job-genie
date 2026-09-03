-- Add email column to device_links table
ALTER TABLE public.device_links
ADD COLUMN email VARCHAR(255);

-- Update the policies to allow email updates
DROP POLICY IF EXISTS "Allow updating device links" ON public.device_links;

CREATE POLICY "Allow updating device links"
    ON public.device_links
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true); 