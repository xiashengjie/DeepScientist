'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

function formatPoints(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.max(0, Number(value || 0)))
}

export function RollingPointsNumber({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  const prefersReducedMotion = useReducedMotion()
  const [displayValue, setDisplayValue] = useState<number>(Math.max(0, Math.floor(value || 0)))
  const previousRef = useRef<number>(Math.max(0, Math.floor(value || 0)))

  useEffect(() => {
    const nextValue = Math.max(0, Math.floor(value || 0))
    const startValue = previousRef.current

    if (nextValue === startValue) {
      setDisplayValue(nextValue)
      return
    }

    if (prefersReducedMotion) {
      previousRef.current = nextValue
      setDisplayValue(nextValue)
      return
    }

    const delta = nextValue - startValue
    const absDelta = Math.abs(delta)
    const duration = absDelta > 2000 ? 550 : absDelta > 500 ? 420 : 300
    const started = performance.now()

    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const current = Math.round(startValue + delta * eased)
      setDisplayValue(current)

      if (t < 1) {
        raf = window.requestAnimationFrame(tick)
      } else {
        previousRef.current = nextValue
        setDisplayValue(nextValue)
      }
    }

    raf = window.requestAnimationFrame(tick)
    return () => {
      if (raf) {
        window.cancelAnimationFrame(raf)
      }
    }
  }, [prefersReducedMotion, value])

  const direction = useMemo(() => {
    if (displayValue > previousRef.current) return 'up'
    if (displayValue < previousRef.current) return 'down'
    return 'flat'
  }, [displayValue])

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={displayValue}
        className={`${className || ''} text-black`.trim()}
        initial={prefersReducedMotion ? undefined : { y: direction === 'up' ? 8 : -8, opacity: 0.15 }}
        animate={prefersReducedMotion ? undefined : { y: 0, opacity: 1 }}
        exit={prefersReducedMotion ? undefined : { y: direction === 'up' ? -8 : 8, opacity: 0.15 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        {formatPoints(displayValue)}
      </motion.span>
    </AnimatePresence>
  )
}
