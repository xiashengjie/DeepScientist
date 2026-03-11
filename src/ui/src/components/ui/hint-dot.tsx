import { cn } from '@/lib/utils'

export function HintDot({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  return (
    <span className={cn('group relative inline-flex', className)}>
      <span
        tabIndex={0}
        aria-label={label}
        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-black/[0.10] text-[10px] font-medium leading-none text-muted-foreground outline-none transition hover:border-black/[0.16] hover:text-foreground focus:border-black/[0.16] focus:text-foreground dark:border-white/[0.12] dark:hover:border-white/[0.18] dark:hover:text-white dark:focus:border-white/[0.18] dark:focus:text-white"
      >
        ?
      </span>
      <span className="pointer-events-none invisible absolute left-1/2 top-[calc(100%+0.5rem)] z-50 w-56 -translate-x-1/2 rounded-[18px] border border-black/[0.08] bg-[rgba(255,255,255,0.96)] px-3 py-2 text-[11px] font-normal leading-5 text-foreground opacity-0 shadow-[0_20px_40px_-28px_rgba(17,24,39,0.35)] transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 dark:border-white/[0.10] dark:bg-[rgba(24,27,32,0.96)] dark:text-white/88">
        {label}
      </span>
    </span>
  )
}
