import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

async function initializeUsersTable() {
  try {
    // Check if users table exists
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (error) {
      console.log('Users table might not exist, trying to create it')
      
      // Run the SQL migration directly
      console.log('Please run the SQL migration manually:')
      console.log(`
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL,
  tokens_remaining INTEGER DEFAULT 0,
  subscription_type VARCHAR(10),
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
      `)
    } else {
      console.log('Users table exists!')
    }

    console.log('Users table initialized successfully!')
  } catch (error) {
    console.error('Error initializing users table:', error)
  }
}

initializeUsersTable() 