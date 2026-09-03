'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { planService } from '@/lib/services/planService'
import { paymentService } from '@/lib/services/paymentService'
import { userService } from '@/lib/services/userService'
import type { Database } from '@/lib/database.types'
import AnimatedBackground from '@/components/AnimatedBackground'

type Plan = Database['public']['Tables']['plans']['Row']

declare global {
  interface Window {
    Razorpay: {
      new(options: Record<string, unknown>): {
        open(): void;
      };
    };
  }
}

export default function Subscribe() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Single toggle for all plans
  const [billingCycle, setBillingCycle] = useState<'daily' | 'monthly' | 'yearly'>('daily')
  // Display INR alongside USD; can be configured via env
  const USD_TO_INR = Number(process.env.NEXT_PUBLIC_USD_TO_INR ?? '83')

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setLoading(true)
      setError(null)
      const plans = await planService.getActivePlans()
      setPlans(plans)
    } catch (error: unknown) {
      setError('Failed to load subscription plans. Please refresh the page.')
      console.error('Error loading plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (plan: Plan) => {
    try {
      setProcessingPayment(true)
      setError(null)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/signin')
        return
      }

      // Create order
      const { orderId, amount, currency } = await paymentService.createOrder(
        user.id,
        plan.id
      )

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: amount, // Amount is already in smallest currency unit (paise)
        currency: currency,
        name: 'WebPay',
        description: `${plan.name} Subscription`,
        order_id: orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await paymentService.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            )
            // Best-effort: award JobGenie tokens to app_users using admin API
            try {
              const username = typeof window !== 'undefined' ? localStorage.getItem('jobgenie_username') : null
              if (username) {
                const award = plan.duration_months === 12 ? 10000 : 1000
                await fetch('/api/app-users/award-tokens', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ username, award })
                })
              }
            } catch (e) {
              console.warn('Token award skipped:', e)
            }

            // Set user plan and subscription end date based on purchased plan
            try {
              const isDaily = Boolean((plan as any).duration_days && (plan as any).duration_days > 0)
              const isMonthly = plan.duration_months === 1 && !(plan as any).duration_days
              const isYearly = plan.duration_months === 12 && !(plan as any).duration_days
              const planTier = (plan as any).tier as 'moderate' | 'pro' | undefined
              const isModerateByName = typeof plan.name === 'string' && plan.name.toLowerCase().includes('moderate')
              const isPremiumByName = typeof plan.name === 'string' && (plan.name.toLowerCase().includes('premium') || plan.name.toLowerCase().includes('pro'))
              
              console.log('🔍 Plan Update Debug:', {
                planId: plan.id,
                planName: plan.name,
                planTier,
                isDaily, isMonthly, isYearly,
                isModerateByName, isPremiumByName,
                userId: user.id
              })

              // Decide user plan label based on explicit tier, fallback to name
              // Requires DB to allow 'moderate' alongside 'basic' | 'pro'
              const targetPlan = planTier === 'moderate' || (!planTier && isModerateByName) ? 'moderate' : 'pro'
              console.log('🎯 Target plan determined:', targetPlan)
              
              const planRes: any = await userService.updatePlan(user.id, targetPlan)
              console.log('📝 Plan update result:', planRes)
              
              if (planRes?.error) {
                console.error('❌ Failed to update user plan:', planRes.error)
                setError(`Could not set your plan to ${targetPlan}. Error: ${JSON.stringify(planRes.error)}. Please contact support.`)
                return
              }
              // Verify server value (best-effort) + single retry
              try {
                let updatedUser = await userService.getUser(user.id)
                console.log('🔍 User after plan update:', { plan: updatedUser?.plan, expected: targetPlan })
                
                if (updatedUser?.plan !== targetPlan) {
                  console.warn('⚠️ Plan verification mismatch. Expected', targetPlan, 'got', updatedUser?.plan, '— retrying update once')
                  const retry = await userService.updatePlan(user.id, targetPlan)
                  console.log('🔄 Retry result:', retry)
                  
                  if (retry?.error) {
                    console.error('❌ Plan retry failed:', retry.error)
                    setError(`Plan update retry failed. Error: ${JSON.stringify(retry.error)}. Please contact support.`)
                    return
                  }
                  updatedUser = await userService.getUser(user.id)
                  console.log('🔍 User after retry:', { plan: updatedUser?.plan, expected: targetPlan })
                  
                  if (updatedUser?.plan !== targetPlan) {
                    console.error('❌ Plan still mismatched after retry. Expected', targetPlan, 'got', updatedUser?.plan)
                    setError(`Plan did not update on server. Expected: ${targetPlan}, Got: ${updatedUser?.plan}. Check console for details.`)
                    return
                  }
                }
                console.log('✅ Plan verification successful:', updatedUser?.plan)
              } catch (e) {
                console.warn('⚠️ Plan verify fetch failed', e)
                setError(`Plan verification failed: ${e}. Please check your subscription in dashboard.`)
              }

              // Compute subscription type and end date
              let subType: 'daily' | 'monthly' | 'yearly' = 'monthly'
              const end = new Date()
              if (isDaily) {
                subType = 'daily'
                end.setDate(end.getDate() + 1)
              } else if (isYearly) {
                subType = 'yearly'
                end.setMonth(end.getMonth() + 12)
              } else if (isMonthly) {
                subType = 'monthly'
                end.setMonth(end.getMonth() + 1)
              } else {
                // Fallback: treat as monthly
                subType = 'monthly'
                end.setMonth(end.getMonth() + 1)
              }

              const subRes: any = await userService.updateUserSubscription(user.id, subType, end)
              if (subRes?.error) {
                console.error('Failed to set subscription + end date:', subRes.error)
                setError('Could not activate your subscription. Please contact support or retry.')
                return
              }
            } catch (e) {
              console.warn('User plan update skipped:', e)
              setError(`Plan update failed with exception: ${e}. Please contact support.`)
            }

            // Redirect to dashboard after successful payment
            router.push('/dashboard?success=true')
          } catch (error: unknown) {
            setError('Payment verification failed. Please contact support if your payment was deducted.')
            console.error('Payment verification error:', error)
          } finally {
            setProcessingPayment(false)
          }
        },
        prefill: {
          email: user.email
        },
        theme: {
          color: '#4F46E5'
        },
        modal: {
          ondismiss: () => {
            setProcessingPayment(false)
          }
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to process payment. Please try again.')
      console.error('Payment error:', error)
      setProcessingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black py-12 px-4 sm:px-6 lg:px-8">
      <AnimatedBackground />
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Select a subscription plan that works best for you
          </p>
        </div>

        {/* Single Billing Cycle Toggle */}
        <div className="mt-6 flex items-center justify-center">
          <div className="relative inline-flex items-center rounded-full bg-white/10 ring-1 ring-white/15 p-1 transition-all duration-300">
            <button
              onClick={() => setBillingCycle('daily')}
              className={`px-4 py-1.5 text-sm font-medium transition-colors duration-300 ${billingCycle === 'daily' ? 'text-black' : 'text-white/80'}`}
            >
              Daily
            </button>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 text-sm font-medium transition-colors duration-300 ${billingCycle === 'monthly' ? 'text-black' : 'text-white/80'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 text-sm font-medium transition-colors duration-300 ${billingCycle === 'yearly' ? 'text-black' : 'text-white/80'}`}
            >
              Yearly
            </button>
            <span
              className={`absolute top-1 bottom-1 w-[33.333%] rounded-full bg-white text-black text-sm font-semibold grid place-items-center transition-transform duration-300 ${
                billingCycle === 'daily' ? 'translate-x-0' : 
                billingCycle === 'monthly' ? 'translate-x-full' : 
                'translate-x-[200%]'
              }`}
              aria-hidden
            >
              {billingCycle === 'daily' ? 'Daily' : billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
            </span>
          </div>
        </div>

        <div className="mt-12">
          {error && (
            <div className="mb-8 rounded-md bg-red-500/10 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Free Plan (static) */}
            <div className="bg-white/5 border border-white/10 rounded-lg shadow-lg overflow-hidden relative">
              <div className="absolute right-4 top-4 text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300 ring-1 ring-white/15">Free</div>
              <div className="px-6 py-8">
                <h3 className="text-2xl font-bold text-white">Free</h3>
                <p className="mt-4 text-gray-300">Get started with the core overlay assistant.</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-white">$0</span>
                  <span className="text-base font-medium text-gray-300">/forever</span>
                </p>
                <ul className="mt-8 space-y-4 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span className="text-gray-300">Invisible on screen share</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span className="text-gray-300">Ask: unlimited questions with real‑time answers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span className="text-gray-300">Basic AI models</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span className="text-gray-300">Secure data</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span className="text-gray-300">Unlimited requests</span>
                  </li>
                </ul>
                <div
                  role="status"
                  aria-label="Already in use"
                  className="mt-8 w-full select-none inline-flex items-center justify-center gap-2 bg-white/10 text-white py-2 px-4 rounded-md ring-1 ring-inset ring-white/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-emerald-400">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-2.59a.75.75 0 1 0-1.22-.86l-3.553 5.046-2.02-2.02a.75.75 0 0 0-1.06 1.06l2.625 2.625a.75.75 0 0 0 1.163-.104l4.065-5.747Z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Already in use</span>
                </div>
              </div>
            </div>

            {/* Dynamic plan cards based on billing cycle */}
            {(() => {
              let filteredPlans: Plan[] = []
              
              if (billingCycle === 'daily') {
                // Show daily plans (moderate)
                filteredPlans = plans.filter(p => (p as any).duration_days && (p as any).duration_days > 0)
              } else if (billingCycle === 'monthly') {
                // Show monthly plans (moderate monthly + premium monthly)
                filteredPlans = plans.filter(p => p.duration_months === 1 && !((p as any).duration_days))
              } else if (billingCycle === 'yearly') {
                // Show yearly plans (premium yearly)
                filteredPlans = plans.filter(p => p.duration_months === 12 && !((p as any).duration_days))
              }

              return filteredPlans.map((plan) => {
                const isDaily = Boolean((plan as any).duration_days)
                const isYearly = plan.duration_months === 12
                const isModerate = String(plan.name).toLowerCase().includes('moderate')
                const period = isDaily ? 'day' : isYearly ? 'year' : 'month'
                const inrAmount = Math.round((plan.price || 0) * USD_TO_INR)
                
                return (
                  <div 
                    key={plan.id} 
                    className={`bg-white/5 border border-white/10 rounded-lg shadow-lg overflow-hidden relative ${isYearly ? 'ring-1 ring-indigo-500/40' : ''}`}
                  >
                    {isYearly && (
                      <div className="absolute right-4 top-4 text-xs px-2 py-1 rounded-full bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-500/30">Best Value</div>
                    )}
                    {isModerate && (
                      <div className="absolute right-4 top-4 text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300 ring-1 ring-white/15">Moderate</div>
                    )}
                    <div className="px-6 py-8">
                      <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                      <p className="mt-4 text-gray-300">{plan.description}</p>
                      <div className="mt-8">
                        <div className="flex items-baseline gap-4 flex-wrap">
                          {/* USD */}
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold text-white">${plan.price}</span>
                            <span className="text-sm font-medium text-gray-300">/{period}</span>
                          </div>
                          {/* Divider */}
                          <span className="hidden sm:inline-block h-6 w-px bg-white/15" aria-hidden />
                          {/* INR */}
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold text-white">₹{inrAmount.toLocaleString('en-IN')}</span>
                            <span className="text-sm font-medium text-gray-300">/{period}</span>
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-gray-400">Shown in USD and INR (approx.)</div>
                      </div>
                      <ul className="mt-8 space-y-4 text-sm">
                        <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5">✓</span><span className="text-gray-300">Invisible on screen share and recordings</span></li>
                        <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5">✓</span><span className="text-gray-300">Most powerful agent models</span></li>
                        <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5">✓</span><span className="text-gray-300">Secure data</span></li>
                        {!isModerate && (
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5">✓</span><span className="text-gray-300">Live Listen — captures your audio and responds in real time</span></li>
                        )}
                        <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5">✓</span><span className="text-gray-300">Ask: unlimited questions with real‑time answers</span></li>
                        <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5">✓</span><span className="text-gray-300">Smart Screenshots — snap full screen or select a region get answers from the image</span></li>
                        {!isModerate && (
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5">✓</span><span className="text-gray-300">Context Memory — preload your data auto‑applied to Ask & Listen</span></li>
                        )}
                        <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5">✓</span><span className="text-gray-300">Unlimited requests</span></li>
                      </ul>
                      <button
                        onClick={() => handlePayment(plan)}
                        disabled={processingPayment}
                        className="mt-8 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingPayment ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : 'Subscribe Now'}
                      </button>
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      </div>
    </main>
  )
}