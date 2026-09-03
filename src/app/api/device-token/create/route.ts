import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'

export async function POST() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )

  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 401 })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Create a short-lived device token
  const token = randomBytes(18).toString('base64url')
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  const { error: insertErr } = await supabase.from('device_tokens').insert({
    token,
    user_id: user.id,
    email: user.email,
    expires_at: expiresAt,
  })
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  return NextResponse.json({ token })
}
