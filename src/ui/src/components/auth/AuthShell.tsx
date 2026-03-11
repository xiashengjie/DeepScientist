'use client'

import { useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { BRAND_LOGO_SMALL_SRC } from '@/lib/constants/assets'
import { cn } from '@/lib/utils'

type AuthShellProps = {
  left: ReactNode
  right: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  backgroundEffect?: ReactNode
  className?: string
}

export default function AuthShell({
  left,
  right,
  actions,
  footer,
  backgroundEffect,
  className,
}: AuthShellProps) {
  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [])

  const defaultActions = (
    <>
      <Link href="/docs" className="auth-action">
        Docs
      </Link>
      <a
        href="https://github.com/ResearAI/DeepScientist-CLI"
        className="auth-action"
        target="_blank"
        rel="noreferrer"
      >
        GitHub
      </a>
    </>
  )

  const defaultFooter = (
    <div className="auth-footer-inner">
      <div className="auth-footer-brand">
        <img
          src={BRAND_LOGO_SMALL_SRC}
          alt="DeepScientist"
          className="auth-footer-logo"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        <div>
          <div className="auth-footer-title">DeepScientist</div>
          <div className="auth-footer-sub">Autonomous research, end-to-end.</div>
        </div>
      </div>
      <div className="auth-footer-links">
        <Link href="/">Home</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/docs">Docs</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
      </div>
      <div className="auth-footer-note">© 2026 Resear.AI</div>
    </div>
  )

  return (
    <div className={cn('auth-shell font-project notranslate', className)} translate="no">
      <div className="auth-shell-bg" aria-hidden>
        <div className="auth-orb auth-orb-cool" />
        <div className="auth-orb auth-orb-warm" />
        <div className="auth-orb auth-orb-mist" />
      </div>
      {backgroundEffect}
      <div className="auth-shell-inner">
        <header className="auth-header">
          <Link href="/" className="auth-brand" aria-label="DeepScientist home">
            <img
              src={BRAND_LOGO_SMALL_SRC}
              alt="DeepScientist"
              className="auth-logo"
              loading="eager"
              decoding="async"
              draggable={false}
            />
            <div>
              <div className="auth-brand-title">DeepScientist</div>
              <div className="auth-brand-sub">Research orchestration, softened.</div>
            </div>
          </Link>
          <nav className="auth-actions">{actions ?? defaultActions}</nav>
        </header>

        <main className="auth-main">
          <div className="auth-left">{left}</div>
          <div className="auth-right">{right}</div>
        </main>

        <footer className="auth-footer">{footer ?? defaultFooter}</footer>
      </div>
    </div>
  )
}
