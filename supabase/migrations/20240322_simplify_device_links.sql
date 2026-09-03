-- Drop the trigger and function since we don't need them anymore
DROP TRIGGER IF EXISTS update_device_link_email_trigger ON device_links;
DROP FUNCTION IF EXISTS update_device_link_email();

-- Make user_id nullable since we're not using it from web app
ALTER TABLE device_links
ALTER COLUMN user_id DROP NOT NULL; 