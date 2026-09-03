-- Add password and password_set columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS password_set BOOLEAN DEFAULT false;

-- Create or replace function to check if password is required
CREATE OR REPLACE FUNCTION public.check_password_required()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND password_set = true
    AND password_hash IS NOT NULL
  ) THEN
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to check password status
DROP TRIGGER IF EXISTS check_password_status ON public.users;
CREATE TRIGGER check_password_status
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_password_required(); 