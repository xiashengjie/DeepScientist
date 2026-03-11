import { cn } from '@/lib/utils'
import type { GitDiffPayload } from '@/types'

function getDiffLineMeta(line: string) {
  const isHunk = line.startsWith('@@')
  const isAdd = line.startsWith('+') && !line.startsWith('+++')
  const isDel = line.startsWith('-') && !line.startsWith('---')
  const isContext = !isHunk && !isAdd && !isDel
  const prefix = isHunk ? '@@' : isAdd ? '+' : isDel ? '-' : ' '
  const text = isHunk ? line.slice(2).trimStart() : line.slice(1)
  return { isHunk, isAdd, isDel, isContext, prefix, text }
}

export function GitDiffPanel({
  diff,
  title,
  className,
}: {
  diff: GitDiffPayload
  title?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[24px] border border-black/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(243,239,233,0.96))] shadow-card dark:border-white/[0.10] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]',
        className
      )}
    >
      <div className="border-b border-black/[0.06] px-4 py-3 dark:border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-semibold text-foreground">{title || diff.path}</div>
          <div className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
            +{diff.added ?? 0}
          </div>
          <div className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:text-rose-300">
            -{diff.removed ?? 0}
          </div>
          {diff.status ? (
            <div className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[11px] font-medium text-muted-foreground dark:bg-white/[0.07]">
              {diff.status}
            </div>
          ) : null}
        </div>
      </div>

      {diff.binary ? (
        <div className="px-4 py-8 text-sm text-muted-foreground">Binary diff preview is not available.</div>
      ) : (
        <div className="feed-scrollbar max-h-[56vh] overflow-auto bg-[rgba(20,24,28,0.94)] px-0 py-2 text-[12px] leading-6 text-slate-100">
          {diff.lines.length === 0 ? (
            <div className="px-4 py-6 text-slate-300/80">No textual differences for this file.</div>
          ) : (
            diff.lines.map((line, index) => {
              const meta = getDiffLineMeta(line)
              return (
                <div
                  key={`${meta.prefix}-${index}`}
                  className={cn(
                    'grid grid-cols-[26px_minmax(0,1fr)] gap-0 px-3 font-mono',
                    meta.isContext && 'bg-transparent text-slate-200/88',
                    meta.isHunk && 'bg-sky-400/12 text-sky-200',
                    meta.isAdd && 'bg-emerald-400/14 text-emerald-100',
                    meta.isDel && 'bg-rose-400/14 text-rose-100'
                  )}
                >
                  <div className="select-none pr-2 text-center text-[11px] text-slate-400">{meta.prefix}</div>
                  <div className="whitespace-pre-wrap break-words py-0.5">{meta.text}</div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
