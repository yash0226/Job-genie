import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const response = NextResponse.redirect(new URL('/dashboard', request.url))

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    try {
      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        // If there's an error, redirect to sign in
        return NextResponse.redirect(new URL('/auth/signin', request.url))
      }

      // Get the session to ensure it was created
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return NextResponse.redirect(new URL('/auth/signin', request.url))
      }

      // Ensure user profile exists in public.users
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!existing) {
          await supabase.from('users').insert({
            id: user.id,
            email: user.email ?? '',
            tokens_remaining: 0,
            plan: 'basic',
          })
        }
      }
    } catch (error) {
      // If there's an error, redirect to sign in
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
  }

  return response
}