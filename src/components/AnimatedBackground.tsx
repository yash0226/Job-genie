'use client'

import { useEffect, useRef } from 'react'

export default function AnimatedBackground() {
  const particlesRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = particlesRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const DPR = Math.min(2, window.devicePixelRatio || 1)
    let raf = 0
    let pmx = 0, pmy = 0
    let particles: {x:number;y:number;z:number;vx:number;vy:number}[] = []

    const resize = () => {
      const w = window.innerWidth
      const h = Math.max(window.innerHeight, 800)
      canvas.width = Math.floor(w * DPR)
      canvas.height = Math.floor(h * DPR)
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      if (ctx) ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }

    const init = () => {
      resize()
      const count = Math.min(120, Math.floor((canvas.width * canvas.height) / (30000 * DPR)))
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width / DPR,
        y: Math.random() * canvas.height / DPR,
        z: Math.random() * 1 + 0.3,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
      }))
    }

    init()

    const onMouse = (e: MouseEvent) => { pmx = e.clientX; pmy = e.clientY }
    window.addEventListener('mousemove', onMouse)

    const loop = () => {
      if (!ctx) return
      const w = canvas.width / DPR
      const h = canvas.height / DPR
      ctx.clearRect(0, 0, w, h)
      ctx.globalAlpha = 0.7
      particles.forEach(p => {
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
      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <>
      <canvas ref={particlesRef} className="pointer-events-none fixed inset-0 z-[1]" />
      <style>{`
        @keyframes helvia-blob { 0% { transform: translate3d(-20%, -10%, 0) scale(1); } 50% { transform: translate3d(10%, 20%, 0) scale(1.1); } 100% { transform: translate3d(-20%, -10%, 0) scale(1); } }
      `}</style>
      <div className="pointer-events-none fixed -top-20 -left-20 z-[2] h-[40rem] w-[40rem] rounded-full blur-3xl opacity-25"
           style={{ background: 'conic-gradient(from 90deg, #6366f1, #a855f7, #22c55e)', animation: 'helvia-blob 16s ease-in-out infinite' }} />
      <div className="pointer-events-none fixed -bottom-24 right-[-10%] z-[2] h-[36rem] w-[36rem] rounded-full blur-3xl opacity-20"
           style={{ background: 'conic-gradient(from 210deg, #22c55e, #06b6d4, #6366f1)', animation: 'helvia-blob 22s ease-in-out infinite' }} />
    </>
  )
}
