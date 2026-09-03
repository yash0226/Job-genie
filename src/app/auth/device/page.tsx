"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DeviceLinkPage() {
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [showLoggedInBanner, setShowLoggedInBanner] = useState(false)
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null)

  useEffect(() => {
    // Check if current user has verifier=true in public.users
    const checkVerifier = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser()
        const user = auth?.user
        if (!user) return
        const { data } = await supabase
          .from('users')
          .select('email, verifier')
          .eq('id', user.id)
          .single()
        const hasVerifier = Boolean((data as any)?.verifier)
        if (hasVerifier) {
          setShowLoggedInBanner(true)
          setLoggedInEmail((data as any)?.email || user.email || null)
        }
      } catch {}
    }
    checkVerifier()

    const run = async () => {
      try {
        const res = await fetch('/api/device-token/create', { method: 'POST' })
        const data = await res.json()
        if (res.status === 401) {
          // Not authenticated: send user to your sign-in route and come back here
          const redirect = encodeURIComponent('/auth/device')
          window.location.href = `/auth/signin?redirect=${redirect}`
          return
        }
        if (!res.ok) throw new Error(data.error || 'Failed to create token')
        setToken(data.token)
        setReady(true)
      } catch (e: any) {
        setError(e.message || 'Failed to start device link')
      }
    }
    run()
  }, [])

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black">
        <div className="max-w-md w-full rounded-xl border border-white/10 bg-white/[0.04] p-6 text-white">
          <h1 className="text-lg font-semibold">Device link failed</h1>
          <p className="mt-2 text-sm text-gray-300">{error}</p>
        </div>
      </main>
    )
  }

  if (!token || !ready) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex items-center gap-3 text-white/90">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500" />
          <span className="text-sm">Preparing secure device link…</span>
        </div>
      </main>
    )
  }

  const openDesktop = () => {
    const deepLink = `helvia://auth?token=${token}`
    window.location.href = deepLink
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-black via-indigo-950 to-black">
      <div className="absolute inset-0 pointer-events-none opacity-30" />
      <div className="relative z-10 max-w-xl mx-auto px-8 py-20">
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-md p-10 shadow-[0_0_1px_0_rgba(255,255,255,0.25)]">
          <h1 className="text-3xl font-bold text-white">Connect Helvia Desktop</h1>
          <p className="mt-3 text-base text-gray-300">
            Click the button below to open Helvia Desktop and complete sign-in. If nothing happens, ensure Helvia Desktop is installed and the helvia:// link handler is registered.
          </p>

          {showLoggedInBanner && (
            <div className="mt-4 rounded-md border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 px-4 py-3 text-sm">
              Note: You’re already signed in{loggedInEmail ? ` as ${loggedInEmail}` : ''}. You already have an account.
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={openDesktop}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-base font-semibold shadow ring-1 ring-inset ring-white/10 transition-colors"
            >
              Open Helvia Desktop
            </button>
          </div>

          {/* Removed raw token display per request */}

          {/* Deep link section removed as requested */}
        </div>
      </div>
    </main>
  )
}
