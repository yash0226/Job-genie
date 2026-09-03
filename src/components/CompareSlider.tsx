"use client"

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

interface CompareSliderProps {
  leftSrc: string // what others see (plain)
  rightSrc: string // what you see (with app)
  leftLabel?: string
  rightLabel?: string
  aspectRatio?: number // width/height, default 16/9
}

export default function CompareSlider({
  leftSrc,
  rightSrc,
  leftLabel = 'What others see',
  rightLabel = 'What you see',
  aspectRatio = 16 / 9,
}: CompareSliderProps) {
  const [pos, setPos] = useState(0.5)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef(false)

  // Drag handlers
  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const clientX = (e as TouchEvent).touches?.[0]?.clientX ?? (e as MouseEvent).clientX
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width)
      setPos(x / rect.width)
    }
    const stop = () => { draggingRef.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('mouseup', stop)
    window.addEventListener('touchend', stop)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('mouseup', stop)
      window.removeEventListener('touchend', stop)
    }
  }, [])

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    draggingRef.current = true
  }

  const percentage = Math.round(pos * 100)
  // Label opacities: fade out when their side is mostly hidden
  const leftOpacity = Math.max(0, Math.min(1, (pos - 0.1) / 0.2)) // 0 until 10%, full by 30%
  const rightOpacity = Math.max(0, Math.min(1, ((1 - pos) - 0.1) / 0.2)) // 0 until 90%, full by 70%
  // Overlay visibility: keep the left image fully hidden until handle moves slightly from the far left,
  // and fully visible towards the right end.
  const overlayOpacity = Math.max(0, Math.min(1, (pos - 0.02) / 0.08)) // fade in between 2% and 10%

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30"
        style={{ aspectRatio: `${aspectRatio}` }}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        {/* Right/base image */}
        <Image
          src={rightSrc}
          alt={rightLabel}
          fill
          className="object-cover select-none pointer-events-none"
          sizes="100vw"
          priority
        />

        {/* Left/overlay image, clipped */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${Math.max(0, (1 - pos) * 100)}% 0 0)`, opacity: overlayOpacity }}
        >
          <Image
            src={leftSrc}
            alt={leftLabel}
            fill
            className="object-cover select-none pointer-events-none"
            sizes="100vw"
            priority
          />
          {/* Soft edge gradient for realism */}
          <div
            className="absolute inset-y-0 right-0 w-10"
            style={{
              background: 'linear-gradient(90deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.25) 100%)',
              opacity: 0.6,
            }}
          />
        </div>

        {/* Mirror soft gradient on the right/base side for realism */}
        <div
          className="pointer-events-none absolute inset-y-0 w-10"
          style={{
            left: `${pos * 100}%`,
            transform: 'translateX(-100%)',
            background: 'linear-gradient(270deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.25) 100%)',
            opacity: 0.6,
          }}
        />

        {/* Drag line */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-white/80 shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
          style={{ left: `${pos * 100}%`, transform: 'translateX(-1px)' }}
        />
        {/* Handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl cursor-col-resize border border-black/10"
          style={{ left: `${pos * 100}%` }}
          aria-label="Drag to compare"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 12H4M20 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Corner labels */}
        <div className="pointer-events-none select-none absolute left-3 top-3 text-xs font-medium" style={{ opacity: leftOpacity }}>
          <span className="rounded-md bg-black/60 px-2 py-1 text-white/90 border border-white/10">{leftLabel}</span>
        </div>
        <div className="pointer-events-none select-none absolute right-3 top-3 text-xs font-medium" style={{ opacity: rightOpacity }}>
          <span className="rounded-md bg-black/60 px-2 py-1 text-white/90 border border-white/10">{rightLabel}</span>
        </div>

        {/* Hint pulse */}
        <div
          className="absolute top-1/2 -translate-y-1/2" style={{ left: `${pos * 100}%` }}
        >
          <div className="relative -translate-x-1/2">
            <span className="absolute inset-0 rounded-full animate-ping bg-white/30" style={{ filter: 'blur(1px)' }} />
          </div>
        </div>
      </div>
      {/* Removed bottom range control for a cleaner, more realistic look */}
    </div>
  )
}
