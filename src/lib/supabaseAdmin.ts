import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Prefer new env names; fall back to previous for safety
const url = process.env.PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRole = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url) throw new Error('Missing PUBLIC_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)')
if (!serviceRole) throw new Error('Missing SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY)')

export const supabaseAdmin = createClient<Database>(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false }
})
