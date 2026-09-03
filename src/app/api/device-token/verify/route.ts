import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const { token } = await req.json().catch(() => ({}))
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

    // Fetch token record
    const { data: rec, error } = await supabaseAdmin
      .from('device_tokens')
      .select('token, user_id, email, expires_at, used')
      .eq('token', token)
      .single()

    if (error || !rec) return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    if (rec.used) return NextResponse.json({ error: 'Token already used' }, { status: 400 })
    if (new Date(rec.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 })
    }

    // Mark token as used
    const { error: useErr } = await supabaseAdmin
      .from('device_tokens')
      .update({ used: true })
      .eq('token', token)

    if (useErr) return NextResponse.json({ error: useErr.message }, { status: 500 })

    // Minimal profile response for Electron
    return NextResponse.json({
      success: true,
      user: {
        id: rec.user_id,
        email: rec.email ?? '',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}
