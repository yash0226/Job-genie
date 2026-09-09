import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const url = 
      process.env.NEXT_PUBLIC_SUPABASE_URL || 
      process.env.PUBLIC_SUPABASE_URL || 
      process.env.SUPABASE_URL

    const serviceRole = 
      process.env.SUPABASE_SERVICE_KEY || 
      process.env.SUPABASE_SERVICE_ROLE_KEY || 
      process.env.SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

    const anonKey = 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
      process.env.PUBLIC_SUPABASE_ANON_KEY || 
      process.env.SUPABASE_ANON_KEY

    // 1. Query using service role admin client (bypasses RLS to run SELECT COUNT(*) FROM "public"."users")
    if (url && serviceRole) {
      try {
        const adminClient = createClient(url, serviceRole, {
          auth: { persistSession: false, autoRefreshToken: false }
        })
        const { count, error } = await adminClient
          .from('users')
          .select('*', { count: 'exact', head: true })

        if (!error && typeof count === 'number') {
          return NextResponse.json({ count, total_new_users: count, source: 'database' })
        }
      } catch (adminErr) {
        console.warn('Error fetching count with service role:', adminErr)
      }
    }

    // 2. Try anon key if service role was unavailable
    if (url && anonKey) {
      try {
        const publicClient = createClient(url, anonKey, {
          auth: { persistSession: false }
        })
        const { count, error } = await publicClient
          .from('users')
          .select('*', { count: 'exact', head: true })

        if (!error && typeof count === 'number') {
          return NextResponse.json({ count, total_new_users: count, source: 'public' })
        }
      } catch (publicErr) {
        console.warn('Error fetching count with anon client:', publicErr)
      }
    }

    return NextResponse.json({ count: 0, total_new_users: 0, source: 'database-zero' })
  } catch (err: any) {
    return NextResponse.json({ count: 0, total_new_users: 0, error: err?.message })
  }
}
