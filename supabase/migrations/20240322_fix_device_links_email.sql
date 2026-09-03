-- Update existing device_links with emails from users table
UPDATE device_links dl
SET email = u.email
FROM users u
WHERE dl.user_id = u.id
AND dl.email IS NULL;

-- Add a trigger to automatically update email when user_id changes
CREATE OR REPLACE FUNCTION update_device_link_email()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        -- Get email from users table
        NEW.email := (
            SELECT email 
            FROM users 
            WHERE id = NEW.user_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS update_device_link_email_trigger ON device_links;

-- Create the trigger
CREATE TRIGGER update_device_link_email_trigger
    BEFORE INSERT OR UPDATE
    ON device_links
    FOR EACH ROW
    EXECUTE FUNCTION update_device_link_email(); 