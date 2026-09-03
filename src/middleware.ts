import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // If there is no session and the user is trying to access a protected route,
  // redirect them to the sign-in page
  if (!session && (req.nextUrl.pathname.startsWith('/dashboard'))) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth/signin'
    return NextResponse.redirect(redirectUrl)
  }

  // If there is a session and the user is trying to access auth pages,
  // redirect them to the dashboard
  if (session && (
    req.nextUrl.pathname.startsWith('/auth/signin') || 
    req.nextUrl.pathname.startsWith('/auth/signup')
  )) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/signin', '/auth/signup'],
} 