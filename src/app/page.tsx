'use client'

import Image from 'next/image'
import Link from 'next/link'
import CompareSlider from '@/components/CompareSlider'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const layersRef = useRef<HTMLDivElement[]>([])
  const heroTiltRef = useRef<HTMLDivElement | null>(null)
  const floatRefs = useRef<HTMLDivElement[]>([])
  const howVideoRef = useRef<HTMLVideoElement | null>(null)
  const layer0Ref = useRef<HTMLDivElement | null>(null)
  const layer1Ref = useRef<HTMLDivElement | null>(null)
  const layer2Ref = useRef<HTMLDivElement | null>(null)
  const particlesRef = useRef<HTMLCanvasElement | null>(null)
  // Static pricing on landing page for consistent rendering across browsers
  // Single toggle for all plans (defaults to monthly as most bought)
  const [billingCycle, setBillingCycle] = useState<'daily' | 'monthly' | 'yearly'>('monthly')
  const [userCount, setUserCount] = useState<number | null>(null)

  // Fetch real-time count of records from public.users table
  useEffect(() => {
    fetch('/api/stats/user-count')
      .then(res => res.json())
      .then(data => {
        if (typeof data?.count === 'number') {
          setUserCount(data.count)
        }
      })
      .catch(() => {})
  }, [])

  // Helper to navigate to subscribe with preselected cycle
  const subscribeHref = (cycle: 'daily' | 'monthly' | 'yearly') => `/dashboard/subscribe?cycle=${cycle}`

  // Show logged-in banner if users.verifier === true
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null)
  const [showLoggedInBanner, setShowLoggedInBanner] = useState(false)

  // Check if current user has verifier=true in public.users
  useEffect(() => {
    const run = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser()
        const user = auth?.user
        if (!user) {
          setShowLoggedInBanner(false)
          setLoggedInEmail(null)
          return
        }
        // fetch row from users
        const { data, error } = await supabase
          .from('users')
          .select('email, verifier')
          .eq('id', user.id)
          .single()
        if (error) {
          setShowLoggedInBanner(false)
          return
        }
        const hasVerifier = Boolean((data as any)?.verifier)
        setShowLoggedInBanner(hasVerifier)
        setLoggedInEmail((data as any)?.email || user.email || null)
      } catch {
        setShowLoggedInBanner(false)
      }
    }
    run()
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let ticking = false

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const scrollY = window.scrollY || window.pageYOffset
        // Adjust each layer based on index/depth
        layersRef.current.forEach((layer, idx) => {
          if (!layer) return
          const depth = idx + 1 // 1,2,3...
          const translateY = scrollY * (depth * 0.06) // stronger for deeper layers
          const rotateX = Math.min(15, scrollY * 0.01)
          const translateZ = -depth * 60 // push back in Z
          layer.style.transform = `translateZ(${translateZ}px) translateY(${translateY}px) rotateX(${rotateX}deg)`
        })
        ticking = false
      })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    // Hero subtle 3D tilt
    const hero = heroTiltRef.current
    const onTilt = (e: MouseEvent) => {
      if (!hero) return
      const { innerWidth: w, innerHeight: h } = window
      const rx = ((e.clientY / h) - 0.5) * -6
      const ry = ((e.clientX / w) - 0.5) * 6
      hero.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`
    }
    window.addEventListener('mousemove', onTilt)

    // Floating hero cards bobbing/parallax
    let t = 0
    const bob = () => {
      t += 0.01
      floatRefs.current.forEach((el, i) => {
        if (!el) return
        const y = Math.sin(t + i) * 6
        const r = Math.cos(t + i) * 2
        el.style.transform = `translateZ(0) translateY(${y}px) rotate(${r}deg)`
      })
      raf2 = requestAnimationFrame(bob)
    }
    let raf2 = requestAnimationFrame(bob)

    // Particles canvas (soft, depthy)
    const canvas = particlesRef.current
    let raf3 = 0
    let particles: {x:number;y:number;z:number;vx:number;vy:number}[] = []
    let pmx = 0, pmy = 0
    if (canvas) {
      const ctx = canvas.getContext('2d')
      const DPR = Math.min(2, window.devicePixelRatio || 1)
      const resize = () => {
        const w = window.innerWidth
        const h = Math.max(window.innerHeight, 800)
        canvas.width = Math.floor(w * DPR)
        canvas.height = Math.floor(h * DPR)
        canvas.style.width = w + 'px'
        canvas.style.height = h + 'px'
        if (ctx) ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      }
      resize()
      const count = Math.min(120, Math.floor((canvas.width * canvas.height) / (30000 * DPR)))
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width / DPR,
        y: Math.random() * canvas.height / DPR,
        z: Math.random() * 1 + 0.3,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
      }))
      const onMouseP = (e: MouseEvent) => { pmx = e.clientX; pmy = e.clientY }
      window.addEventListener('mousemove', onMouseP)
      const loopP = () => {
        if (!ctx) return
        const w = canvas.width / DPR
        const h = canvas.height / DPR
        ctx.clearRect(0, 0, w, h)
        ctx.globalAlpha = 0.7
        particles.forEach(p => {
          // gentle drift + mouse parallax
          p.x += p.vx * p.z + (pmx - w/2) * 0.00003 * p.z
          p.y += p.vy * p.z + (pmy - h/2) * 0.00003 * p.z
          if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10
          if (p.y < -10) p.y = h + 10; if (p.y > h + 10) p.y = -10
          const r = 1.2 + p.z * 1.8
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r*4)
          grad.addColorStop(0, 'rgba(99,102,241,0.6)')
          grad.addColorStop(1, 'rgba(99,102,241,0.0)')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
          ctx.fill()
        })
        raf3 = requestAnimationFrame(loopP)
      }
      loopP()
      window.addEventListener('resize', resize)
      // cleanup for particles
      const cleanupParticles = () => {
        cancelAnimationFrame(raf3)
        window.removeEventListener('mousemove', onMouseP)
        window.removeEventListener('resize', resize)
      }
      // attach to container for return
      ;(canvas as any)._cleanup = cleanupParticles
    }

    // Reveal on scroll for sections
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('opacity-100', 'translate-y-0')
          }
        })
      },
      { threshold: 0.15 }
    )
    document.querySelectorAll('[data-reveal]')?.forEach((n) => {
      ;(n as HTMLElement).classList.add('opacity-0', 'translate-y-6', 'transition-all', 'duration-700')
      observer.observe(n)
    })

    // Autoplay/pause How-it-works video on scroll visibility
    const v = howVideoRef.current
    let videoObserver: IntersectionObserver | null = null
    if (v) {
      videoObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(async (en) => {
            const el = en.target as HTMLVideoElement
            if (en.isIntersecting && en.intersectionRatio > 0.5) {
              try { await el.play() } catch {}
            } else {
              el.pause()
            }
          })
        },
        { threshold: [0, 0.25, 0.5, 0.75, 1] }
      )
      videoObserver.observe(v)
    }

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onTilt)
      cancelAnimationFrame(raf2)
      observer.disconnect()
      if (videoObserver && v) videoObserver.unobserve(v)
      // cleanup particles if created
      if (particlesRef.current && (particlesRef.current as any)._cleanup) {
        ;(particlesRef.current as any)._cleanup()
      }
    }
  }, [])

  // No DB fetch here; plans are static on the landing page

  return (
    <main ref={containerRef} className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(1200px_600px_at_50%_-100px,rgba(30,41,59,0.7),rgba(2,6,23,1))] text-gray-100">
      {showLoggedInBanner && (
        <div className="sticky top-0 z-[60] w-full bg-emerald-600/20 backdrop-blur supports-[backdrop-filter]:bg-emerald-700/15 border-b border-emerald-400/30 text-emerald-200">
          <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between gap-4">
            <div className="text-sm">
              You’re already signed in{loggedInEmail ? ` as ${loggedInEmail}` : ''}. 
              <span className="opacity-80">You already have an account.</span>
            </div>
            <button onClick={() => setShowLoggedInBanner(false)} className="text-emerald-100/80 hover:text-emerald-50 text-sm">Dismiss</button>
          </div>
        </div>
      )}
      {/* Animated background: particles and blobs */}
      <canvas ref={particlesRef} className="pointer-events-none fixed inset-0 z-[1]"/>
      <div className="pointer-events-none fixed inset-0 z-[2] perspective-[1200px]">
        <div ref={(el)=>{layer0Ref.current=el; layersRef.current[0]=el!}} className="absolute inset-0" style={{
          background: 'radial-gradient(600px 300px at 20% 30%, rgba(99,102,241,0.08), transparent)'
        }}/>
        <div ref={(el)=>{layer1Ref.current=el; layersRef.current[1]=el!}} className="absolute inset-0" style={{
          background: 'radial-gradient(700px 350px at 80% 40%, rgba(168,85,247,0.08), transparent)'
        }}/>
        <div ref={(el)=>{layer2Ref.current=el; layersRef.current[2]=el!}} className="absolute inset-0" style={{
          background: 'radial-gradient(900px 450px at 50% 90%, rgba(34,197,94,0.06), transparent)'
        }}/>
      </div>
      {/* Flowing gradient blobs */}
      <style>{`
        @keyframes helvia-blob {
          0% { transform: translate3d(-20%, -10%, 0) scale(1); }
          50% { transform: translate3d(10%, 20%, 0) scale(1.1); }
          100% { transform: translate3d(-20%, -10%, 0) scale(1); }
        }
      `}</style>
      <div className="pointer-events-none fixed -top-20 -left-20 z-[3] h-[40rem] w-[40rem] rounded-full blur-3xl opacity-25"
           style={{ background: 'conic-gradient(from 90deg, #6366f1, #a855f7, #22c55e)', animation: 'helvia-blob 16s ease-in-out infinite' }}/>
      <div className="pointer-events-none fixed -bottom-24 right-[-10%] z-[3] h-[36rem] w-[36rem] rounded-full blur-3xl opacity-20"
           style={{ background: 'conic-gradient(from 210deg, #22c55e, #06b6d4, #6366f1)', animation: 'helvia-blob 22s ease-in-out infinite' }}/>
      {/* Header (dark, minimal) */}
      <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/30 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight text-white text-2xl sm:text-3xl">Helvia</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-gray-300">
            <a className="hover:text-white transition" href="#pricing">Pricing</a>
            <a className="hover:text-white transition" href="#features">Enterprise</a>
            <a className="hover:text-white transition" href="#security">Careers</a>
            <a className="hover:text-white transition" href="#help">Help Center</a>
          </nav>
          <Link
            href="/auth/signin"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2.5 text-sm font-semibold shadow-[0_4px_0_rgba(0,0,0,0.55)] hover:shadow-[0_3px_0_rgba(0,0,0,0.55)] hover:translate-y-[1px] active:translate-y-[2px] transition transform ring-1 ring-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Get started for free"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M4 4h3v3H4V4Zm4.5 0H12v3H8.5V4ZM13.5 4H16v3h-2.5V4ZM4 8.5h3V12H4V8.5Zm4.5 0H12V12H8.5V8.5ZM13.5 8.5H16V12h-2.5V8.5ZM4 13.5h3V16H4v-2.5Zm4.5 0H12V16H8.5v-2.5ZM13.5 13.5H16V16h-2.5v-2.5Z"/>
            </svg>
            Get Started for Free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pt-20 sm:pt-28">
        <div ref={heroTiltRef} className="transform-gpu transition-transform duration-300 will-change-transform">
          {/* Active Users Social Proof Badge */}
          {userCount !== null && userCount > 0 ? (
            <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6 shadow-inner ring-1 ring-white/10 hover:border-indigo-500/30 transition">
              <div className="flex -space-x-2 overflow-hidden">
                <span className="inline-flex h-6 w-6 rounded-full ring-2 ring-black bg-gradient-to-tr from-indigo-600 to-indigo-400 text-[10px] font-bold text-white items-center justify-center">JD</span>
                <span className="inline-flex h-6 w-6 rounded-full ring-2 ring-black bg-gradient-to-tr from-purple-600 to-purple-400 text-[10px] font-bold text-white items-center justify-center">AK</span>
                <span className="inline-flex h-6 w-6 rounded-full ring-2 ring-black bg-gradient-to-tr from-emerald-600 to-emerald-400 text-[10px] font-bold text-white items-center justify-center">YS</span>
                <span className="inline-flex h-6 w-6 rounded-full ring-2 ring-black bg-gradient-to-tr from-amber-600 to-amber-400 text-[10px] font-bold text-white items-center justify-center">+</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-200">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span><strong className="text-white font-extrabold">{userCount.toLocaleString()}</strong> registered users on Helvia</span>
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6 shadow-inner ring-1 ring-white/10 hover:border-indigo-500/30 transition">
              <div className="flex -space-x-2 overflow-hidden">
                <span className="inline-flex h-6 w-6 rounded-full ring-2 ring-black bg-gradient-to-tr from-indigo-600 to-indigo-400 text-[10px] font-bold text-white items-center justify-center">JD</span>
                <span className="inline-flex h-6 w-6 rounded-full ring-2 ring-black bg-gradient-to-tr from-purple-600 to-purple-400 text-[10px] font-bold text-white items-center justify-center">AK</span>
                <span className="inline-flex h-6 w-6 rounded-full ring-2 ring-black bg-gradient-to-tr from-emerald-600 to-emerald-400 text-[10px] font-bold text-white items-center justify-center">YS</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-200">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span><strong className="text-white font-extrabold">Active Community</strong> of job seekers & pros</span>
              </div>
            </div>
          )}

          <h1 className="text-5xl sm:text-7xl font-extrabold leading-[1.05] tracking-tight text-white">
            Never think alone again.
            <br />
            <span className="text-white/90">Helvia whispers answers in real time.</span>
          </h1>
          <p className="mt-5 max-w-3xl text-lg sm:text-xl text-gray-300">
            Helvia is a desktop assistant for your calls and meetings—quietly listening (with permission) and
            understanding your screen to deliver context‑aware answers, notes, and summaries in real time—without
            anyone else seeing it.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <a
              href="https://pub-03bc99680a6b4ba8b50e492f9a12a142.r2.dev/helvia%20setup.exe"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-5 py-3 text-sm shadow-[0_6px_0_rgba(0,0,0,0.6)] hover:shadow-[0_6px_0_rgba(0,0,0,0.7)] transition-shadow"
            >
              Download for Windows
            </a>
            <Link href="#how-it-works" className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-black/40 px-5 py-3 text-sm shadow-sm hover:bg-black/60 transition">
              See how it works
            </Link>
          </div>

          

          {/* 3D floating snippet cards */}
          <div className="mt-12 perspective-[1200px]">
            <div className="relative h-56 w-full">
              <div ref={(el)=>{if(el) floatRefs.current[0]=el}} className="absolute left-0 top-6 w-56 rounded-xl border border-white/10 bg-white/5 p-4 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]">
                <div className="text-xs text-gray-400">What users say</div>
                <div className="mt-2 text-sm text-gray-200">“Helvia helps me answer tough questions without breaking eye contact.”</div>
              </div>
              <div ref={(el)=>{if(el) floatRefs.current[1]=el}} className="absolute left-1/2 top-0 -translate-x-1/2 w-64 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-gray-400">What users say</div>
                <div className="mt-2 text-sm text-gray-200">“Setup took minutes. The live snippets feel like a superpower.”</div>
              </div>
              <div ref={(el)=>{if(el) floatRefs.current[2]=el}} className="absolute right-0 bottom-0 w-60 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-gray-400">What users say</div>
                <div className="mt-2 text-sm text-gray-200">“The privacy controls gave our security team confidence to proceed.”</div>
              </div>
            </div>
          </div>

          {/* Social proof (placeholder logos) */}
          <div className="mt-10 text-gray-400">
            <div className="text-xs uppercase tracking-wider">Trusted by fast-moving teams</div>
            <div className="mt-4 flex flex-wrap items-center gap-8 opacity-80">
              <span className="text-sm">Acme</span>
              <span className="text-sm">Northwind</span>
              <span className="text-sm">Globex</span>
              <span className="text-sm">Umbrella</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" data-reveal className="px-6 py-16 sm:py-24 text-gray-100">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold">How it works</h2>
            <p className="mt-3 text-gray-400">Watch a quick demo of Helvia in action.</p>
          </div>
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <iframe
                src="https://www.youtube.com/embed/6na9OtzabTo"
                title="Helvia Meeting Assistant — Demo"
                className="absolute inset-0 h-full w-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Before/After slider: What others see vs What you see */}
      <section data-reveal className="px-6 py-12 sm:py-16 text-gray-100">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold">See the difference</h2>
            <p className="mt-3 text-gray-400">Drag the line to compare what others see vs what you see with Helvia.</p>
          </div>
          <div className="mt-6 max-w-3xl mx-auto">
            <CompareSlider
              leftSrc="/plain.png"
              rightSrc="/with-app.png"
              leftLabel="What others see"
              rightLabel="What you see"
              aspectRatio={16/9}
            />
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section data-reveal className="relative z-10 px-6 py-16 sm:py-24 text-gray-100">
        <div className="mx-auto max-w-6xl grid gap-10 md:grid-cols-2 items-start">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold">The fastest answer wins</h2>
            <p className="mt-4 text-gray-300">Helvia runs in the background of your calls and meetings to surface the right answer at the right moment—so you keep eye contact and flow.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <ul className="space-y-3 text-gray-300 list-disc pl-5">
              <li>Invisible during meetings—only you see it</li>
              <li>Live notes and automatic summaries</li>
              <li>Context from your screen + mic (with permission)</li>
              <li>Answers from the web and your docs</li>
            </ul>
          </div>
        </div>
      </section>

      

      {/* Integrations / Works with */}
      <section id="integrations" data-reveal className="px-6 py-16 sm:py-24 text-gray-100">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold">Works with every meeting platform</h2>
            <p className="mt-3 text-gray-400">Use Helvia on your calls, no matter where you meet.</p>
          </div>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4 items-stretch">
            {/* Google Meet */}
            <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-5">
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full" style={{ background: '#34A853' }} />
                <span className="text-white font-semibold">Google Meet</span></div>
            </div>
            {/* Microsoft Teams */}
            <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-5">
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: '#6264A7' }} />
                <span className="text-white font-semibold">Microsoft Teams</span></div>
            </div>
            {/* GoTo Meeting */}
            <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-5">
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full" style={{ background: '#FFB000' }} />
                <span className="text-white font-semibold">GoTo Meeting</span></div>
            </div>
            {/* Cisco Webex */}
            <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-5">
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full" style={{ background: '#00BCEB' }} />
                <span className="text-white font-semibold">Cisco Webex</span></div>
            </div>
            {/* Discord */}
            <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-5">
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: '#5865F2' }} />
                <span className="text-white font-semibold">Discord</span></div>
            </div>
            {/* TeamViewer */}
            <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-5">
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full" style={{ background: '#168EF4' }} />
                <span className="text-white font-semibold">TeamViewer</span></div>
            </div>
            {/* Slack */}
            <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-5">
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: '#611f69' }} />
                <span className="text-white font-semibold">Slack</span></div>
            </div>
            {/* RingCentral Video */}
            <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-5">
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full" style={{ background: '#F80' }} />
                <span className="text-white font-semibold">RingCentral Video</span></div>
            </div>
            {/* Lark */}
            <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-5">
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full" style={{ background: '#1E9FFF' }} />
                <span className="text-white font-semibold">Lark</span></div>
            </div>
            {/* Jitsi Meet */}
            <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-5">
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full" style={{ background: '#0A7ACA' }} />
                <span className="text-white font-semibold">Jitsi Meet</span></div>
            </div>
            {/* Skype */}
            <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-5">
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full" style={{ background: '#00AFF0' }} />
                <span className="text-white font-semibold">Skype</span></div>
            </div>
            {/* Zoho Meeting */}
            <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-5">
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: '#EA3E3B' }} />
                <span className="text-white font-semibold">Zoho Meeting</span></div>
            </div>
            {/* Livestorm */}
            <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-5">
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full" style={{ background: '#4E5EE4' }} />
                <span className="text-white font-semibold">Livestorm</span></div>
            </div>
            {/* Chanty */}
            <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-5">
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: '#0AA2FF' }} />
                <span className="text-white font-semibold">Chanty</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section data-reveal className="px-6 py-16 sm:py-24 text-gray-100">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold">Highlights</h2>
            <p className="mt-3 text-gray-400">A few reasons users love Helvia.</p>
          </div>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
              <div className="text-sm font-semibold text-white">Fast</div>
              <div className="text-xs text-gray-400 mt-1">Snappy experience end‑to‑end</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
              <div className="text-sm font-semibold text-white">Reliable</div>
              <div className="text-xs text-gray-400 mt-1">Works when you need it</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
              <div className="text-sm font-semibold text-white">Secure</div>
              <div className="text-xs text-gray-400 mt-1">Best practices applied</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
              <div className="text-sm font-semibold text-white">In Control</div>
              <div className="text-xs text-gray-400 mt-1">You choose what to share</div>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900/30 via-white/5 to-white/5 p-6 relative overflow-hidden ring-1 ring-indigo-500/20">
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
                {userCount !== null ? userCount.toLocaleString() : '...'}
              </div>
              <div className="text-sm font-semibold text-indigo-200 mt-1">Registered Users</div>
              <div className="text-xs text-gray-400 mt-0.5">Live database record count</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="text-4xl font-extrabold text-white">99.95%</div>
              <div className="text-sm text-gray-400 mt-1">Target uptime</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="text-4xl font-extrabold text-white">24h</div>
              <div className="text-sm text-gray-400 mt-1">Average ticket response</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="text-4xl font-extrabold text-white">0</div>
              <div className="text-sm text-gray-400 mt-1">Data sold to third parties</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section data-reveal className="px-6 py-16 sm:py-24 text-gray-100">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold">What teams say</h2>
            <p className="mt-3 text-gray-400">Original quotes you can replace later.</p>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <p className="text-gray-300">“Helvia helps our reps answer hard questions without breaking eye contact.”</p>
              <div className="mt-4 text-sm text-gray-400">— A. Kumar, Sales Lead</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <p className="text-gray-300">“Set up took minutes. The live snippets feel like a superpower.”</p>
              <div className="mt-4 text-sm text-gray-400">— J. Patel, Founder</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <p className="text-gray-300">“The privacy controls gave our security team confidence to proceed.”</p>
              <div className="mt-4 text-sm text-gray-400">— S. Chen, IT</div>
            </div>
          </div>
        </div>
      </section>

      

      

      

      {/* Plans preview (mirrors subscribe layout, view-only) moved to bottom */}
      <section id="pricing" data-reveal className="px-6 py-16 sm:py-24 text-gray-100">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Choose Your Plan</h2>
            <p className="mt-4 text-lg text-gray-300">Select a subscription plan that works best for you</p>
          </div>
          {/* Single Billing Cycle Toggle */}
          <div className="mt-8 flex flex-col items-center justify-center gap-2.5">
            <div className="inline-flex items-center rounded-full bg-white/10 ring-1 ring-white/15 p-1.5 backdrop-blur-md">
              <button
                onClick={() => setBillingCycle('daily')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  billingCycle === 'daily'
                    ? 'bg-white text-black shadow font-bold'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`relative px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-2 ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-black shadow-lg font-extrabold ring-2 ring-indigo-400'
                    : 'text-gray-200 hover:text-white'
                }`}
              >
                <span>Monthly</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-black px-2 py-0.5 rounded-full shadow-sm">
                  🔥 Most Bought
                </span>
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-black shadow font-bold'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <span>Yearly</span>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/70 px-1.5 py-0.5 rounded-full border border-emerald-500/30">Save 40%</span>
              </button>
            </div>
            <p className="text-xs text-indigo-300/90 font-medium">⚡ 82% of job seekers choose the Monthly Pro Plan for interview preparation</p>
          </div>
          <div className="mt-12">
            <div className="grid gap-8 lg:grid-cols-3">
                {/* Free Plan (static) */}
                <div className="bg-white/5 border border-white/10 rounded-2xl shadow-lg overflow-hidden relative">
                  <div className="absolute right-4 top-4 text-xs px-2.5 py-1 rounded-full bg-white/10 text-gray-300 ring-1 ring-white/15 font-medium">Free</div>
                  <div className="px-6 py-8">
                    <h3 className="text-2xl font-bold text-white">Free</h3>
                    <p className="mt-4 text-gray-300">Get started with the core overlay assistant.</p>
                    <p className="mt-8">
                      <span className="text-4xl font-extrabold text-white">$0</span>
                      <span className="text-base font-medium text-gray-300">/forever</span>
                    </p>
                    <ul className="mt-8 space-y-4 text-sm">
                      <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Invisible on screen share</span></li>
                      <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Ask: unlimited questions with real‑time answers</span></li>
                      <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Basic AI models</span></li>
                      <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Secure data</span></li>
                      <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Unlimited requests</span></li>
                    </ul>
                    <div role="status" aria-label="Already in use" className="mt-8 w-full select-none inline-flex items-center justify-center gap-2 bg-white/10 text-white py-2 px-4 rounded-md ring-1 ring-inset ring-white/10">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-emerald-400"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-2.59a.75.75 0 1 0-1.22-.86l-3.553 5.046-2.02-2.02a.75.75 0 0 0-1.06 1.06l2.625 2.625a.75.75 0 0 0 1.163-.104l4.065-5.747Z" clipRule="evenodd" /></svg>
                      <span className="font-medium">Already in use</span>
                    </div>
                  </div>
                </div>
                {/* Static plan cards based on selected billing cycle */}
                {billingCycle === 'daily' && (
                  <>
                    {/* Moderate Daily */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl shadow-lg overflow-hidden relative">
                      <div className="absolute right-4 top-4 text-xs px-2.5 py-1 rounded-full bg-white/10 text-gray-300 ring-1 ring-white/15 font-medium">Moderate</div>
                      <div className="px-6 py-8">
                        <h3 className="text-2xl font-bold text-white">Moderate</h3>
                        <p className="mt-1 text-sm text-gray-400">1 Day access</p>
                        <p className="mt-8">
                          <span className="text-4xl font-extrabold text-white">$1.19</span>
                          <span className="text-base font-medium text-gray-300">/day</span>
                          <span className="ml-3 text-2xl font-extrabold text-white">₹99</span>
                          <span className="block text-xs text-gray-400 mt-1">Shown in USD and INR (approx.)</span>
                        </p>
                        <ul className="mt-8 space-y-4 text-sm">
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Invisible on screen share and recordings</span></li>
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Most powerful agent models</span></li>
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Secure data</span></li>
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Ask: unlimited questions with real‑time answers</span></li>
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Smart Screenshots — snap full screen or select a region</span></li>
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Unlimited requests</span></li>
                        </ul>
                        <a href={subscribeHref('daily')} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white py-3 text-sm font-semibold ring-1 ring-inset ring-white/10 transition-colors">Subscribe Now</a>
                      </div>
                    </div>

                    {/* Pro Daily */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl shadow-lg overflow-hidden relative">
                      <div className="absolute right-4 top-4 text-xs px-2.5 py-1 rounded-full bg-white/10 text-gray-300 ring-1 ring-white/15 font-medium">Pro</div>
                      <div className="px-6 py-8">
                        <h3 className="text-2xl font-bold text-white">Pro</h3>
                        <p className="mt-1 text-sm text-gray-400">1 Day access</p>
                        <p className="mt-8">
                          <span className="text-4xl font-extrabold text-white">₹169</span>
                          <span className="text-base font-medium text-gray-300">/day</span>
                          <span className="block text-xs text-gray-400 mt-1">Approx. $2.0 (shown for reference)</span>
                        </p>
                        <ul className="mt-8 space-y-4 text-sm">
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Invisible on screen share and recordings</span></li>
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Most powerful agent models</span></li>
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Secure data</span></li>
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Ask: unlimited questions with real‑time answers</span></li>
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Smart Screenshots — snap full screen or select a region</span></li>
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Content Memory — preload your data auto‑applied to Ask & Listen</span></li>
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Unlimited requests</span></li>
                        </ul>
                        <a href={`${subscribeHref('daily')}&tier=pro`} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white py-3 text-sm font-semibold ring-1 ring-inset ring-white/10 transition-colors">Subscribe Now</a>
                      </div>
                    </div>
                  </>
                )}

                {billingCycle === 'monthly' && (
                  <>
                    {/* Monthly Moderate */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl shadow-xl overflow-hidden relative flex flex-col justify-between hover:border-white/20 transition-all duration-300">
                      <div className="absolute right-4 top-4 text-xs px-2.5 py-1 rounded-full bg-white/10 text-gray-300 ring-1 ring-white/15 font-medium">Moderate</div>
                      <div className="px-6 py-8">
                        <h3 className="text-2xl font-bold text-white">Monthly Moderate</h3>
                        <p className="mt-1 text-sm text-gray-300">Starter monthly plan — 1 month access</p>
                        <div className="mt-8">
                          <div className="flex items-baseline gap-2.5 flex-wrap">
                            <span className="text-lg text-gray-500 line-through font-semibold">₹799</span>
                            <span className="text-4xl font-extrabold text-white">₹499</span>
                            <span className="text-base font-medium text-gray-300">/month</span>
                            <span className="text-sm text-gray-400">($6)</span>
                          </div>
                          <span className="block text-xs text-gray-400 mt-1">Full 30 days access • basic screen assistant</span>
                        </div>
                        <ul className="mt-8 space-y-4 text-sm">
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Invisible on screen share and recordings</span></li>
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Most powerful agent models</span></li>
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Secure data</span></li>
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Ask: unlimited questions with real‑time answers</span></li>
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Smart Screenshots — snap full screen or select a region</span></li>
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-300">Unlimited requests</span></li>
                        </ul>
                      </div>
                      <div className="p-6 pt-0">
                        <a href={subscribeHref('monthly')} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white py-3 text-sm font-semibold ring-1 ring-inset ring-white/15 transition-all">Subscribe Moderate</a>
                      </div>
                    </div>

                    {/* Monthly Pro - 999 LIMITED TIME DISCOUNT SHOWSTOPPER */}
                    <div className="relative rounded-2xl p-[2px] bg-gradient-to-b from-amber-400 via-indigo-500 to-purple-600 shadow-[0_0_50px_rgba(99,102,241,0.4)] transform lg:-translate-y-3 transition-all duration-300">
                      <div className="bg-gradient-to-b from-slate-900/95 via-indigo-950/50 to-slate-950/95 rounded-[14px] p-6 sm:p-8 flex flex-col justify-between h-full relative overflow-hidden backdrop-blur-xl">
                        {/* Top Most Bought Badge */}
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-bl-xl shadow-lg flex items-center gap-1.5">
                          <span>🔥</span>
                          <span>MOST BOUGHT • 82% OF USERS</span>
                        </div>

                        <div>
                          <div className="inline-flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full font-bold mb-3">
                            <span>⚡</span> LIMITED TIME DISCOUNT — SAVE 50%
                          </div>
                          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Monthly Pro</h3>
                          <p className="mt-1 text-sm text-indigo-200/90">Full unrestricted AI power + Live voice listen & memory</p>
                          
                          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-indigo-500/30 shadow-inner">
                            <div className="flex items-baseline gap-3 flex-wrap">
                              <span className="text-2xl text-gray-500 line-through font-bold">₹1,999</span>
                              <span className="text-4xl sm:text-5xl font-black text-emerald-400">₹999</span>
                              <span className="text-base font-semibold text-indigo-200">/month</span>
                              <span className="text-sm text-gray-400">($12.03)</span>
                            </div>
                            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-300 font-bold bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1 rounded-full">
                              <span>🎉</span> Special Offer: ₹1,000 Flat Discount • Limited Time
                            </div>
                          </div>

                          <ul className="mt-6 space-y-3.5 text-sm">
                            <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-white font-medium">Live Listen — captures audio & answers in real time</span></li>
                            <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-white font-medium">Content Memory — auto‑preloads your data & resume</span></li>
                            <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-200">Invisible on screen share and recordings</span></li>
                            <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-200">Most powerful agent models</span></li>
                            <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-200">Smart Screenshots — snap full screen or region</span></li>
                            <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5 font-bold">✓</span><span className="text-gray-200">Unlimited requests & priority latency</span></li>
                          </ul>
                        </div>
                        <div className="mt-8">
                          <a
                            href={`${subscribeHref('monthly')}&tier=pro`}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 hover:from-amber-400 hover:via-indigo-500 hover:to-purple-500 text-white py-3.5 text-base font-bold shadow-[0_0_35px_rgba(99,102,241,0.55)] hover:shadow-[0_0_45px_rgba(99,102,241,0.75)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ring-1 ring-white/20"
                          >
                            <span>Get Pro at ₹999 (50% OFF)</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </a>
                          <p className="text-center text-[11px] text-gray-400 mt-2">Instant activation • Special promotional price</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {billingCycle === 'yearly' && (
                  <>
                    {/* Yearly Premium */}
                    <div className="bg-white/5 border border-white/10 rounded-lg shadow-lg overflow-hidden relative ring-1 ring-indigo-400/40">
                      <div className="absolute right-4 top-4 text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300 ring-1 ring-white/15">Best Value</div>
                      <div className="px-6 py-8">
                        <h3 className="text-2xl font-bold text-white">Yearly Premium</h3>
                        <p className="mt-1 text-sm text-gray-400">Best value! Access to premium features with yearly tokens</p>
                        <p className="mt-8">
                          <span className="text-4xl font-extrabold text-white">$100</span>
                          <span className="text-base font-medium text-gray-300">/year</span>
                          <span className="ml-3 text-2xl font-extrabold text-white">₹8,300</span>
                          <span className="block text-xs text-gray-400 mt-1">Shown in USD and INR (approx.)</span>
                        </p>
                        <ul className="mt-8 space-y-4 text-sm">
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5">✓</span><span className="text-gray-300">Invisible on screen share and recordings</span></li>
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5">✓</span><span className="text-gray-300">Most powerful agent models</span></li>
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5">✓</span><span className="text-gray-300">Secure data</span></li>
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5">✓</span><span className="text-gray-300">Live Listen — captures your audio and responds in real time</span></li>
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5">✓</span><span className="text-gray-300">Smart Screenshots — snap full screen or select a region</span></li>
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5">✓</span><span className="text-gray-300">Content Memory — preload your data auto‑applied to Ask & Listen</span></li>
                          <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5">✓</span><span className="text-gray-300">Unlimited requests</span></li>
                        </ul>
                        <a href={subscribeHref('yearly')} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 text-sm font-semibold ring-1 ring-inset ring-white/10 transition-colors">Subscribe Now</a>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
      </section>

      {/* Contact Support Section */}
      <section data-reveal className="px-6 py-16 sm:py-24 text-gray-100">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Need Support?</h2>
          <p className="mt-4 text-lg text-gray-300">Get help from our support team through your preferred channel</p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-6 justify-center items-center">
            {/* WhatsApp Button */}
            <a
              href="https://wa.me/919032025916"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-xl bg-green-600 text-white px-6 py-4 text-lg font-semibold shadow-[0_6px_0_rgba(0,0,0,0.3)] hover:shadow-[0_4px_0_rgba(0,0,0,0.3)] hover:translate-y-[2px] transition-all duration-150 min-w-[200px]"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.105"/>
              </svg>
              WhatsApp Support
            </a>

            {/* Email Button */}
            <a
              href="mailto:jobsgeni149@gmail.com"
              className="inline-flex items-center gap-3 rounded-xl bg-blue-600 text-white px-6 py-4 text-lg font-semibold shadow-[0_6px_0_rgba(0,0,0,0.3)] hover:shadow-[0_4px_0_rgba(0,0,0,0.3)] hover:translate-y-[2px] transition-all duration-150 min-w-[200px]"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Support
            </a>
          </div>

          <div className="mt-8 text-sm text-gray-400">
            <p>Our support team typically responds within 24 hours</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 text-gray-400 border-t border-white/10 bg-transparent">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative h-6 w-6">
              <Image src="/next.svg" alt="Logo" fill className="object-contain invert" />
            </div>
            <span className="text-gray-200 font-semibold">Helvia</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/privacy" className="hover:text-gray-200 transition">Privacy Policy</Link>
            <span className="opacity-50">•</span>
            <Link href="/terms" className="hover:text-gray-200 transition">Terms of Service</Link>
            <span className="opacity-50">•</span>
            <Link href="/refund" className="hover:text-gray-200 transition">Refund & Cancellation</Link>
            <span className="opacity-50">•</span>
            <span className="text-gray-300">Founder: <span className="text-gray-200">N Yashwanth</span></span>
            <span className="opacity-50 hidden sm:inline">•</span>
            <p className="text-sm hidden sm:inline">© {new Date().getFullYear()} Helvia. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm hover:shadow transition">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-300">{desc}</p>
    </div>
  )
}
