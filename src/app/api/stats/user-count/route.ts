import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const url = process.env.PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRole = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY

    // 1. Try service role admin client first (bypasses RLS to get exact row count from public.users)
    if (url && serviceRole) {
      try {
        const adminClient = createClient(url, serviceRole, {
          auth: { persistSession: false, autoRefreshToken: false }
        })
        const { count, error } = await adminClient
          .from('users')
          .select('*', { count: 'exact', head: true })

        if (!error && typeof count === 'number' && count > 0) {
          return NextResponse.json({ count, source: 'database' })
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

        if (!error && typeof count === 'number' && count > 0) {
          return NextResponse.json({ count, source: 'public' })
        }
      } catch (publicErr) {
        console.warn('Error fetching count with anon client:', publicErr)
      }
    }

    // Fallback baseline for social proof if DB credentials are not loaded locally
    return NextResponse.json({ count: 1820, source: 'fallback' })
  } catch (err: any) {
    return NextResponse.json({ count: 1820, source: 'fallback', error: err?.message })
  }
}
