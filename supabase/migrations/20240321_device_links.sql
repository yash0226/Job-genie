-- Create device_links table
CREATE TABLE IF NOT EXISTS public.device_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    device_id TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add RLS policies
ALTER TABLE public.device_links ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own device links
CREATE POLICY "Users can view their own device links"
    ON public.device_links
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR NOT is_active);

-- Policy to allow users to create their own device links
CREATE POLICY "Users can create their own device links"
    ON public.device_links
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update device links
CREATE POLICY "Users can update their own device links"
    ON public.device_links
    FOR UPDATE
    TO authenticated
    USING (
        -- Can update if they own it OR if it's inactive
        auth.uid() = user_id OR 
        (NOT is_active AND user_id IS NULL)
    ); 