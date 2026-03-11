import { ArrowRight, GitBranch, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { QuestSummary } from '@/types'

function formatTime(value?: string) {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function metricText(project: QuestSummary) {
  const metric = project.summary?.latest_metric
  if (!metric?.key) {
    return '—'
  }
  return `${metric.key}: ${metric.value}`
}

export function ProjectCard({ project, className }: { project: QuestSummary; className?: string }) {
  const { t } = useI18n()
  const recentArtifact = project.recent_artifacts?.[0]
  const branch = project.branch || 'main'
  const pendingCount = project.pending_decisions?.length ?? project.counts?.pending_decision_count ?? 0

  return (
    <Link
      to={`/projects/${project.quest_id}`}
      className={cn(
        'group relative block overflow-hidden rounded-[28px] border border-black/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,239,233,0.97))] p-5 shadow-[0_16px_44px_-34px_rgba(17,24,39,0.24)] transition duration-200 hover:-translate-y-1 hover:border-black/18 hover:shadow-[0_24px_56px_-36px_rgba(17,24,39,0.28)] dark:border-white/[0.12] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] dark:hover:border-white/[0.18]',
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_-4%,rgba(255,255,255,0.56),transparent_36%),radial-gradient(circle_at_100%_100%,rgba(143,163,184,0.12),transparent_30%)]"
      />

      <div className="relative z-[1]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-lg font-semibold tracking-tight">{project.title}</div>
              <Badge>{project.quest_id}</Badge>
            </div>
            <div className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
              {project.summary?.status_line || t('workspaceGuide')}
            </div>
          </div>
          <div className="rounded-full border border-black/10 bg-white/60 p-2 text-muted-foreground transition group-hover:text-foreground dark:border-white/[0.12] dark:bg-white/[0.06]">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-[20px] bg-black/[0.04] px-3 py-2 dark:bg-white/[0.05]">
            <div className="text-muted-foreground">{t('status')}</div>
            <div className="mt-1 truncate font-medium text-foreground">{project.status}</div>
          </div>
          <div className="rounded-[20px] bg-black/[0.04] px-3 py-2 dark:bg-white/[0.05]">
            <div className="text-muted-foreground">{t('branch')}</div>
            <div className="mt-1 inline-flex items-center gap-1 truncate font-medium text-foreground">
              <GitBranch className="h-3.5 w-3.5" />
              {branch}
            </div>
          </div>
          <div className="rounded-[20px] bg-black/[0.04] px-3 py-2 dark:bg-white/[0.05]">
            <div className="text-muted-foreground">{t('metric')}</div>
            <div className="mt-1 truncate font-medium text-foreground">{metricText(project)}</div>
          </div>
          <div className="rounded-[20px] bg-black/[0.04] px-3 py-2 dark:bg-white/[0.05]">
            <div className="text-muted-foreground">{t('pending')}</div>
            <div className="mt-1 truncate font-medium text-foreground">{pendingCount}</div>
          </div>
        </div>

        {recentArtifact ? (
          <div className="mt-4 rounded-[22px] border border-black/[0.07] bg-white/60 px-3 py-3 dark:border-white/[0.08] dark:bg-white/[0.04]">
            <div className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              {t('recentArtifacts')}
            </div>
            <div className="line-clamp-2 text-sm leading-6 text-muted-foreground">
              {recentArtifact.payload?.summary || recentArtifact.payload?.reason || recentArtifact.path}
            </div>
          </div>
        ) : null}

        {project.quest_root ? (
          <div className="mt-4 truncate text-xs text-muted-foreground">{project.quest_root}</div>
        ) : null}
        <div className="mt-2 text-xs text-muted-foreground">
          {t('updated')}: {formatTime(project.updated_at)}
        </div>
      </div>
    </Link>
  )
}
