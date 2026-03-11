'use client'

import Link from 'next/link'
import { BookOpen, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BRAND_LOGO_SMALL_SRC } from '@/lib/constants/assets'
import { cn } from '@/lib/utils'

export default function HeroNav() {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full pt-2 [padding-top:calc(env(safe-area-inset-top,0px)+0.5rem)]',
        'border-b border-black/5 bg-white/60 backdrop-blur-xl',
        'supports-[backdrop-filter]:bg-white/40'
      )}
    >
      <div className="mx-auto flex min-h-16 w-full max-w-[90vw] items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full px-2 py-1 transition-colors hover:bg-black/[0.03]"
          aria-label="DeepScientist"
        >
          <img
            src={BRAND_LOGO_SMALL_SRC}
            alt="DeepScientist"
            width={28}
            height={28}
            className="object-contain"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            draggable={false}
          />
          <span className="text-sm font-semibold tracking-tight text-[#2D2A26]">
            DeepScientist
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-full border-black/10 bg-white/60 text-[#2D2A26] hover:bg-white/90"
            asChild
          >
            <Link href="/docs">
              <BookOpen className="mr-2 h-4 w-4" />
              Docs
            </Link>
          </Button>
          <Button
            size="sm"
            className="h-9 rounded-full bg-[#C7AD96] text-[#2D2A26] hover:bg-[#D7C6AE]"
            asChild
          >
            <Link href="/settings">
              <Settings2 className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
