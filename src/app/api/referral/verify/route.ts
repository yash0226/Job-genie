import { NextResponse } from 'next/server'

// Minimal stub for referral verification to avoid missing imports
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    // TODO: implement actual referral verification logic with Supabase if required
    return NextResponse.json({ ok: true, verified: true, payload: body }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Unexpected error' }, { status: 500 })
  }
}
