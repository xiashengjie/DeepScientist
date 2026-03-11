'use client'

import { cn } from '@/lib/utils'
import type { MarkdownHeading } from '@/lib/docs/types'

export function DocsToc({
  headings,
  onSelect,
  className,
  sticky = true,
}: {
  headings: MarkdownHeading[]
  onSelect: (id: string) => void
  className?: string
  sticky?: boolean
}) {
  const items = headings.filter((h) => h.level >= 2 && h.level <= 4)

  if (items.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-black/10 bg-white/75 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.03]',
        sticky && 'sticky',
        className
      )}
      style={sticky ? { top: 'var(--docs-toc-top, 96px)' } : undefined}
    >
      <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/65'>
        <span>On this page</span>
      </div>
      <nav className='mt-3 space-y-1'>
        {items.map((h) => (
          <button
            key={h.id}
            type='button'
            onClick={() => onSelect(h.id)}
            className={cn(
              'block w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-foreground/85 transition-colors hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]',
              h.level === 3 && 'pl-5 text-[13px] text-foreground/70',
              h.level === 4 && 'pl-8 text-[13px] text-foreground/65'
            )}
          >
            {h.text}
          </button>
        ))}
      </nav>
    </div>
  )
}
