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
      process.env.SUPABASE_SERVICE_ROLE_KEY || 
      process.env.SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY || 
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

        // Preferred: GET query with count=exact and limit 1 (reliable on serverless & avoids HEAD-stripping proxies)
        const resA = await adminClient
          .from('users')
          .select('id', { count: 'exact' })
          .limit(1)

        if (!resA.error && typeof resA.count === 'number') {
          return NextResponse.json({ count: resA.count, total_new_users: resA.count, source: 'database' })
        }

        // Fallback: HEAD request
        const resB = await adminClient
          .from('users')
          .select('*', { count: 'exact', head: true })

        if (!resB.error && typeof resB.count === 'number') {
          return NextResponse.json({ count: resB.count, total_new_users: resB.count, source: 'database-head' })
        }

        // Fallback: RPC function get_total_users if exists
        const resC = await adminClient.rpc('get_total_users')
        if (!resC.error && typeof resC.data === 'number') {
          return NextResponse.json({ count: resC.data, total_new_users: resC.data, source: 'database-rpc' })
        }
      } catch (adminErr) {
        console.warn('Error fetching count with service role:', adminErr)
      }
    }

    // 2. Try anon key / RPC if service role was unavailable
    if (url && anonKey) {
      try {
        const publicClient = createClient(url, anonKey, {
          auth: { persistSession: false }
        })

        // Check if get_total_users RPC is defined in Supabase
        const rpcRes = await publicClient.rpc('get_total_users')
        if (!rpcRes.error && typeof rpcRes.data === 'number') {
          return NextResponse.json({ count: rpcRes.data, total_new_users: rpcRes.data, source: 'public-rpc' })
        }

        const resA = await publicClient
          .from('users')
          .select('id', { count: 'exact' })
          .limit(1)

        if (!resA.error && typeof resA.count === 'number') {
          return NextResponse.json({ count: resA.count, total_new_users: resA.count, source: 'public' })
        }
      } catch (publicErr) {
        console.warn('Error fetching count with anon client:', publicErr)
      }
    }

    return NextResponse.json({ 
      count: 0, 
      total_new_users: 0, 
      source: 'database-empty',
      hasUrl: Boolean(url),
      hasServiceRole: Boolean(serviceRole),
      hasAnonKey: Boolean(anonKey)
    })
  } catch (err: any) {
    return NextResponse.json({ count: 0, total_new_users: 0, error: err?.message })
  }
}
