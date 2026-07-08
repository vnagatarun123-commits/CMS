'use client'

import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

const ease = [0.22, 1, 0.36, 1] as const

const textVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14, delayChildren: 0.25 } },
}

const textItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
}

export function AuthBrandPanel() {
  const panelRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  // Raw normalized mouse position (0–1), defaulting to center
  const rawX = useMotionValue(0.5)
  const rawY = useMotionValue(0.5)

  // Springy smoothing — feels physical
  const springCfg = { stiffness: 45, damping: 16, mass: 1.3 }
  const smoothX = useSpring(rawX, springCfg)
  const smoothY = useSpring(rawY, springCfg)

  // Parallax layers — different depths
  const dotX    = useTransform(smoothX, [0, 1], [-16, 16])
  const dotY    = useTransform(smoothY, [0, 1], [-16, 16])
  const blob1X  = useTransform(smoothX, [0, 1], [12, -12])
  const blob1Y  = useTransform(smoothY, [0, 1], [8,  -8])
  const blob2X  = useTransform(smoothX, [0, 1], [-7, 7])
  const blob2Y  = useTransform(smoothY, [0, 1], [-9, 9])
  const blob3X  = useTransform(smoothX, [0, 1], [5, -5])
  const blob3Y  = useTransform(smoothY, [0, 1], [-6, 6])
  const textOffX = useTransform(smoothX, [0, 1], [-4, 4])
  const textOffY = useTransform(smoothY, [0, 1], [-3, 3])

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = panelRef.current?.getBoundingClientRect()
    if (!rect) return
    const nx = (e.clientX - rect.left) / rect.width
    const ny = (e.clientY - rect.top) / rect.height
    rawX.set(nx)
    rawY.set(ny)

    // Cursor-following light glow — direct DOM update to avoid re-renders
    if (glowRef.current) {
      const px = nx * 100
      const py = ny * 100
      glowRef.current.style.background =
        `radial-gradient(ellipse 42% 42% at ${px}% ${py}%, oklch(0.75 0.16 185 / 0.28) 0%, transparent 100%)`
    }
  }

  function onMouseLeave() {
    rawX.set(0.5)
    rawY.set(0.5)
    if (glowRef.current) {
      glowRef.current.style.background =
        'radial-gradient(ellipse 42% 42% at 50% 50%, oklch(0.75 0.16 185 / 0) 0%, transparent 100%)'
    }
  }

  return (
    <div
      ref={panelRef}
      className="hidden lg:flex lg:w-[42%] xl:w-[45%] shrink-0 flex-col justify-between p-12 relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 20% 10%, oklch(0.64 0.20 182 / 0.60) 0%, transparent 48%),
          radial-gradient(ellipse at 85% 88%, oklch(0.24 0.22 288 / 0.70) 0%, transparent 46%),
          radial-gradient(ellipse at 60% 50%, oklch(0.46 0.24 248 / 0.30) 0%, transparent 40%),
          linear-gradient(150deg, oklch(0.56 0.20 195) 0%, oklch(0.45 0.22 255) 45%, oklch(0.32 0.20 278) 100%)
        `,
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* Cursor-following glow overlay (direct DOM, no re-render) */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 transition-[background] duration-700"
        style={{
          background: 'radial-gradient(ellipse 42% 42% at 50% 50%, oklch(0.75 0.16 185 / 0) 0%, transparent 100%)',
        }}
      />

      {/* ── Dot grid — parallax outer + autonomous drift inner ────────────── */}
      <motion.div
        className="pointer-events-none absolute -inset-[8%]"
        style={{ x: dotX, y: dotY }}
      >
        <motion.div
          className="absolute inset-0 opacity-[0.18]"
          animate={{ x: [0, -28], y: [0, -28] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        >
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="auth-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#auth-dots)" />
          </svg>
        </motion.div>
      </motion.div>

      {/* ── Blob 1 — top-left — deepest layer ─────────────────────────────── */}
      <motion.div
        className="pointer-events-none absolute"
        style={{ x: blob1X, y: blob1Y, top: '-8rem', left: '-8rem' }}
      >
        <motion.div
          className="h-96 w-96 rounded-full bg-white/[0.06] blur-3xl"
          animate={{ scale: [1, 1.12, 1], opacity: [0.06, 0.1, 0.06] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* ── Blob 2 — bottom-right ─────────────────────────────────────────── */}
      <motion.div
        className="pointer-events-none absolute"
        style={{ x: blob2X, y: blob2Y, bottom: '-4rem', right: '-4rem' }}
      >
        <motion.div
          className="h-[28rem] w-[28rem] rounded-full bg-white/[0.05] blur-3xl"
          animate={{ scale: [1, 1.09, 1], opacity: [0.05, 0.09, 0.05] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />
      </motion.div>

      {/* ── Blob 3 — mid shimmer ──────────────────────────────────────────── */}
      <motion.div
        className="pointer-events-none absolute"
        style={{ x: blob3X, y: blob3Y, top: '35%', left: '40%', transform: 'translate(-50%, -50%)' }}
      >
        <motion.div
          className="h-64 w-64 rounded-full blur-3xl"
          style={{ background: 'oklch(0.70 0.18 210 / 0.12)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.22, 0.12] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        />
      </motion.div>

      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <motion.div
        className="relative flex items-center gap-2.5"
        initial={{ opacity: 0, x: -18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, ease, delay: 0.1 }}
      >
        <motion.div
          className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center ring-1 ring-white/30 backdrop-blur-sm"
          whileHover={{ scale: 1.12, rotate: 6 }}
          transition={{ type: 'spring', stiffness: 380, damping: 14 }}
        >
          <span className="text-white text-sm font-bold">P</span>
        </motion.div>
        <span className="text-white font-semibold text-lg tracking-tight">PuraLocal</span>
      </motion.div>

      {/* ── Tagline — parallax + stagger ──────────────────────────────────── */}
      <motion.div
        className="relative space-y-4"
        style={{ x: textOffX, y: textOffY }}
        variants={textVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.p
          className="text-white font-semibold leading-tight tracking-tight"
          style={{ fontSize: '2.25rem', textWrap: 'balance' }}
          variants={textItem}
        >
          The newsroom<br />
          <span style={{ color: 'oklch(0.88 0.12 190)' }}>for every</span> neighbourhood.
        </motion.p>
        <motion.p className="text-white/55 text-sm leading-relaxed max-w-xs" variants={textItem}>
          Manage content, reporters, ads, and analytics — all from one place.
        </motion.p>
      </motion.div>

      <motion.p
        className="relative text-white/25 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
      >
        PuraLocal CMS — admin access only
      </motion.p>
    </div>
  )
}
