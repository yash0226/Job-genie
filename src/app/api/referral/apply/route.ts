import { NextResponse } from 'next/server'

// Minimal stub for referral apply to avoid missing imports
// Extend later to use '@/lib/supabaseAdmin' if needed
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    // TODO: implement actual referral apply logic with Supabase if required
    return NextResponse.json({ ok: true, applied: true, payload: body }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Unexpected error' }, { status: 500 })
  }
}
