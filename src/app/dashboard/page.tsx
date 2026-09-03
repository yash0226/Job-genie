'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import AnimatedBackground from '@/components/AnimatedBackground'

type User = Database['public']['Tables']['users']['Row']

export default function Dashboard() {
  const router = useRouter()
  const jobgenieUrl = 'https://chromewebstore.google.com/detail/bneiakaceagbgndkbmjdchnmhceldljb?utm_source=item-share-cb'
  const [userDetails, setUserDetails] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEarlySignup, setShowEarlySignup] = useState(false)
  const [earlyUsername, setEarlyUsername] = useState('')
  const [earlyPassword, setEarlyPassword] = useState('')
  const [earlyLoading, setEarlyLoading] = useState(false)
  const [earlyMessage, setEarlyMessage] = useState<string | null>(null)
  const [earlyError, setEarlyError] = useState<string | null>(null)
  const [createdCreds, setCreatedCreds] = useState<{ username: string; password: string } | null>(null)
  const [accountLocked, setAccountLocked] = useState(false)

  useEffect(() => {
    loadUserDetails()
    // Restore saved credentials from this browser only
    try {
      if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('jobgenie_username')
        const savedPass = localStorage.getItem('jobgenie_password')
        const flag = localStorage.getItem('jobgenie_account_created')
        if (savedUser && savedPass) {
          setCreatedCreds({ username: savedUser, password: savedPass })
        }
        if (flag === 'true') setAccountLocked(true)
      }
    } catch {}
  }, [])

  const loadUserDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/signin')
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setUserDetails(data)
    } catch (error) {
      console.error('Error loading user details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!userDetails) {
    router.push('/auth/signin')
    return null
  }

  // Calculate days remaining for premium subscription
  const daysRemaining = userDetails.subscription_end_date
    ? Math.max(
        0,
        Math.ceil(
          (new Date(userDetails.subscription_end_date).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null

  // Derive plan/subscription strings (avoid TS union narrow issues if schema evolved)
  const planStr = String((userDetails as any).plan || 'basic')
  const isPro = planStr === 'pro'
  const isModerate = planStr === 'moderate'
  const badgeClass = isPro
    ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30'
    : isModerate
    ? 'bg-indigo-500/15 text-indigo-300 ring-indigo-500/30'
    : 'bg-white/10 text-gray-200 ring-white/20'
  const badgeLabel = isPro ? 'Pro' : isModerate ? 'Moderate' : 'Free'

  const subTypeStr = String((userDetails as any).subscription_type || '')
  const subLabel = subTypeStr === 'yearly' ? 'Yearly' : subTypeStr === 'daily' ? 'Daily' : subTypeStr === 'monthly' ? 'Monthly' : ''

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-black via-indigo-950 to-black">
      <AnimatedBackground />
      <div className="relative z-10">
        {/* Top Bar */}
        <header className="sticky top-0 backdrop-blur supports-[backdrop-filter]:bg-black/20 bg-black/40 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-600/80 ring-1 ring-white/20 flex items-center justify-center text-white font-bold">H</div>
              <span className="text-white/90 font-semibold tracking-wide">Helvia</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm text-gray-300">{userDetails.email}</span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-200 hover:bg-rose-500/15 hover:text-rose-100 text-sm font-medium ring-1 ring-inset ring-rose-500/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
                aria-label="Sign out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v8.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zm-3.22 2.03a.75.75 0 011.06 1.06 6.75 6.75 0 109.54 0 .75.75 0 111.06-1.06 8.25 8.25 0 11-11.66 0z" clipRule="evenodd" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hero Card */}
            <section className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-6 sm:p-8 shadow-[0_0_1px_0_rgba(255,255,255,0.2)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Welcome back</h1>
                  <p className="mt-2 text-sm text-gray-300">Manage your subscription and access premium features.</p>
                </div>
              {/* Plan Badge */}
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${badgeClass}`}>
                {badgeLabel}
              </span>
              </div>

              {/* Subscription status */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-black/40 border border-white/10 p-5">
                  <h3 className="text-sm text-gray-400">Subscription</h3>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {subLabel ? `${subLabel} ${badgeLabel}`.trim() : 'No active subscription'}
                  </p>
                  <div className="mt-3 text-sm text-gray-300">
                    {daysRemaining !== null && daysRemaining > 0 ? (
                      <span>Access ends in <strong className="text-white">{daysRemaining}</strong> day{daysRemaining === 1 ? '' : 's'}</span>
                    ) : userDetails.subscription_end_date ? (
                      <span className="text-rose-300">Access expired</span>
                    ) : (
                      <span>Upgrade to unlock premium features</span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-black/40 border border-white/10 p-5">
                  <h3 className="text-sm text-gray-400">Quick action</h3>
                  <p className="mt-2 text-sm text-gray-300">Upgrade or manage your subscription.</p>
                  <button
                    onClick={() => router.push('/dashboard/subscribe')}
                    className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow ring-1 ring-inset ring-white/10 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>
                    {userDetails?.subscription_type ? 'Manage Subscription' : 'Get Premium'}
                  </button>
                </div>
              </div>
              {/* Open JobGenie button lives only in Early Access section */}
            </section>

            {/* Highlights / Tips */}
            <aside className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-6 sm:p-8">
              <h3 className="text-sm font-semibold text-white/90">What you get</h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  Priority access to features with Pro plan
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
                  Manage billing and plan from a single place
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-fuchsia-400"></span>
                  Secure authentication powered by Supabase
                </li>
              </ul>
              <div className="mt-6 rounded-lg border border-white/10 bg-gradient-to-r from-indigo-600/20 via-fuchsia-600/20 to-emerald-600/20 p-4">
                <p className="text-xs text-gray-300">Tip: You can upgrade anytime — changes apply instantly.</p>
              </div>
            </aside>
          </div>
          {/* Early Access: JobGenie */}
          <div className="max-w-7xl mx-auto mt-6">
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Early Access: JobGenie</h2>
                  <p className="mt-2 text-sm text-gray-300">We’re building JobGenie — it automatically applies to roles across LinkedIn, Naukri, and Internshala for you.</p>
                  <ul className="mt-3 space-y-2 text-sm text-gray-300 list-disc list-inside">
                    <li>Connect your platforms securely</li>
                    <li>Set your preferences (role, location, keywords)</li>
                    <li>Auto-apply with tailored answers and tracking</li>
                    <li>Review progress in a single dashboard</li>
                  </ul>
                  {/* Bottom-left persistent JobGenie link inside Early Access */}
                  <div className="mt-4">
                    <a
                      href={jobgenieUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow ring-1 ring-inset ring-white/10 transition-colors w-full sm:w-auto"
                    >
                      Open JobGenie
                    </a>
                  </div>
                </div>
                <div className="w-full md:w-96">
                  {accountLocked && createdCreds && (
                    <div className="space-y-3">
                      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <h4 className="text-sm font-semibold text-emerald-300">Your JobGenie credentials</h4>
                        <div className="mt-2 grid grid-cols-1 gap-2 text-sm">
                          <div className="text-gray-300">Username: <span className="text-white font-medium">{createdCreds.username}</span></div>
                          <div className="text-gray-300">Password: <span className="text-white font-medium">{createdCreds.password}</span></div>
                        </div>
                        <p className="mt-2 text-xs text-gray-400">Please store these safely. You’ll need them when JobGenie access opens.</p>
                      </div>
                      {/* Link lives in the header for global access */}
                      <button
                        onClick={() => router.push('/dashboard/subscribe')}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow ring-1 ring-inset ring-white/10 transition-colors w-full sm:w-auto"
                      >
                        Upgrade to Premium — get free access
                      </button>
                    </div>
                  )}
                  {!accountLocked && !showEarlySignup ? (
                    <button
                      onClick={() => setShowEarlySignup(true)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm ring-1 ring-inset ring-white/10 transition-colors"
                    >
                      Wanna try? Create an account
                    </button>
                  ) : !accountLocked ? (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault()
                        setEarlyError(null)
                        setEarlyMessage(null)
                        if (earlyUsername.trim().length < 3) {
                          setEarlyError('Username must be at least 3 characters')
                          return
                        }
                        if (earlyPassword.length < 6) {
                          setEarlyError('Password must be at least 6 characters')
                          return
                        }
                        try {
                          setEarlyLoading(true)
                          const res = await fetch('/api/app-users', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username: earlyUsername.trim(), password: earlyPassword })
                          })
                          const data = await res.json()
                          if (!res.ok) {
                            setEarlyError(data?.error || 'Failed to create account')
                          } else {
                            setEarlyMessage('Account created! Save your credentials below.')
                            setCreatedCreds({ username: earlyUsername.trim(), password: earlyPassword })
                            try {
                              localStorage.setItem('jobgenie_account_created', 'true')
                              localStorage.setItem('jobgenie_username', earlyUsername.trim())
                              localStorage.setItem('jobgenie_password', earlyPassword)
                            } catch {}
                            setAccountLocked(true)
                            setEarlyUsername('')
                            setEarlyPassword('')
                          }
                        } catch (err: any) {
                          setEarlyError(err?.message || 'Network error')
                        } finally {
                          setEarlyLoading(false)
                        }
                      }}
                      className="space-y-3"
                    >
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">Username</label>
                        <input
                          type="text"
                          value={earlyUsername}
                          onChange={(e) => setEarlyUsername(e.target.value)}
                          placeholder="yourname"
                          className="w-full rounded-md bg-black/40 border border-white/10 text-white placeholder:text-gray-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">Password</label>
                        <input
                          type="password"
                          value={earlyPassword}
                          onChange={(e) => setEarlyPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-md bg-black/40 border border-white/10 text-white placeholder:text-gray-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                          required
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={earlyLoading}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium shadow ring-1 ring-inset ring-white/10 transition-colors"
                        >
                          {earlyLoading ? 'Creating...' : 'Create account'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowEarlySignup(false)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm ring-1 ring-inset ring-white/10 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                      {(earlyError || earlyMessage) && (
                        <p className={`text-sm ${earlyError ? 'text-rose-300' : 'text-emerald-300'}`}>
                          {earlyError || earlyMessage}
                        </p>
                      )}
                    </form>
                  ) : null}
                  {/* Link only in header to avoid duplication */}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}