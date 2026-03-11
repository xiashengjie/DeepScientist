import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { OverlayDialog } from '@/components/home/OverlayDialog'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/lib/i18n'
import type { QuestSummary } from '@/types'

const copy = {
  en: {
    title: 'Experiment list',
    body: 'Open any quest workspace directly from the current local runtime.',
    search: 'Search quest title, id, branch…',
    empty: 'No experiments found.',
  },
  zh: {
    title: '实验列表',
    body: '从当前本地运行时中直接进入任意 quest 工作区。',
    search: '搜索课题标题、quest id、分支…',
    empty: '没有找到实验。',
  },
} as const

export function ExperimentListDialog({
  open,
  projects,
  loading,
  onClose,
}: {
  open: boolean
  projects: QuestSummary[]
  loading?: boolean
  onClose: () => void
}) {
  const { locale, t } = useI18n()
  const labels = copy[locale]
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) {
      return projects
    }
    return projects.filter((project) =>
      `${project.title} ${project.quest_id} ${project.branch || ''} ${project.summary?.status_line || ''}`
        .toLowerCase()
        .includes(keyword)
    )
  }, [projects, search])

  return (
    <OverlayDialog
      open={open}
      title={labels.title}
      description={labels.body}
      onClose={onClose}
      className="max-w-6xl"
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="border-b border-black/[0.06] px-5 py-4 dark:border-white/[0.08] sm:px-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={labels.search}
              className="h-11 rounded-full pl-10"
            />
          </div>
        </div>

        <div className="feed-scrollbar min-h-0 flex-1 overflow-auto px-5 py-5 sm:px-6">
          {loading ? (
            <div className="rounded-[24px] border border-black/[0.08] bg-white/[0.72] px-4 py-6 text-sm text-muted-foreground dark:border-white/[0.12] dark:bg-white/[0.04]">
              {t('loading')}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-black/[0.10] px-4 py-8 text-sm text-muted-foreground dark:border-white/[0.12]">
              {labels.empty}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {filtered.map((project) => (
                <ProjectCard key={project.quest_id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>
    </OverlayDialog>
  )
}

