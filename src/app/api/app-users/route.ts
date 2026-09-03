import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const username = url.searchParams.get('username')
    if (!username) {
      return NextResponse.json({ exists: false })
    }

    const { data, error } = await supabaseAdmin
      .from('app_users' as any)
      .select('id, username, password_hash, created_at')
      .eq('username', username)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to load account' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ exists: false })
    }

    return NextResponse.json({ exists: true, user: data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }
    if (typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    if (username.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Store password as provided (WARNING: insecure for production)
    const password_hash = password

    // Insert into app_users
    const { data, error } = await supabaseAdmin
      .from('app_users' as any)
      .insert({ username, password_hash })
      .select('id, username, created_at')
      .single()

    if (error) {
      if ((error as any).code === '23505') {
        return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message || 'Failed to create account' }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 })
  }
}
