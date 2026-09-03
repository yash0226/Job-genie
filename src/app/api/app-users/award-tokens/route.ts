import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const { username, award } = await request.json()

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'username is required' }, { status: 400 })
    }
    const delta = Number(award)
    if (!Number.isFinite(delta) || delta <= 0) {
      return NextResponse.json({ error: 'award must be a positive number' }, { status: 400 })
    }

    // 1) Fetch current tokens
    const { data: user, error: selError } = await supabaseAdmin
      .from('app_users' as any)
      .select('tokens')
      .eq('username', username)
      .single()

    if (selError) {
      return NextResponse.json({ error: selError.message || 'Failed to fetch user' }, { status: 500 })
    }
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const newTokens = (user.tokens ?? 0) + delta

    // 2) Update tokens
    const { error: updError } = await supabaseAdmin
      .from('app_users' as any)
      .update({ tokens: newTokens })
      .eq('username', username)

    if (updError) {
      return NextResponse.json({ error: updError.message || 'Failed to update tokens' }, { status: 500 })
    }

    return NextResponse.json({ success: true, tokens: newTokens })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 })
  }
}
