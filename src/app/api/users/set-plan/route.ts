import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, plan } = body as { userId?: string; plan?: 'free' | 'basic' | 'moderate' | 'pro' }

    if (!userId || !plan) {
      return NextResponse.json({ error: 'Missing userId or plan' }, { status: 400 })
    }

    // Accept 'free' for testing and map to 'basic'
    const normalizedPlan = plan === 'free' ? 'basic' : plan
    if (!['basic', 'moderate', 'pro'].includes(normalizedPlan)) {
      return NextResponse.json({ error: 'Invalid plan value' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const supabaseAdmin = createClient(url, serviceKey)

    // Update via service role so it cannot be blocked by RLS or client state
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ plan: normalizedPlan })
      .eq('id', userId)
      .select('id, plan')
      .single()

    if (error) {
      console.error('Failed to update user plan:', error)
      return NextResponse.json({ error: 'Failed to update plan', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId: data.id, plan: data.plan })
  } catch (error) {
    console.error('Error in set-plan API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
