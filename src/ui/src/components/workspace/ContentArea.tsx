'use client'

import { useEffect } from 'react'
import { useActiveTab, useTabs, useTabsStore } from '@/lib/stores/tabs'
import { TabBar } from './TabBar'
import { EmptyWorkspace } from './EmptyWorkspace'
import { PluginRenderer } from '@/components/plugin'
import { BUILTIN_PLUGINS } from '@/lib/types/plugin'
import { useI18n } from '@/lib/i18n/useI18n'

interface ContentAreaProps {
  projectId: string
}

function EmptyTab() {
  const { t } = useI18n('workspace')

  return (
    <div className="h-full flex items-center justify-center bg-[var(--bg-panel-center)]">
      <div className="text-center text-[var(--text-muted)]">
        <p>{t('content_empty_tab')}</p>
      </div>
    </div>
  )
}

export function ContentArea({ projectId }: ContentAreaProps) {
  const { t } = useI18n('workspace')
  const tabs = useTabs()
  const activeTab = useActiveTab()
  const updateTabPlugin = useTabsStore((state) => state.updateTabPlugin)

  const shouldRedirectMarkdown =
    activeTab?.pluginId === BUILTIN_PLUGINS.PDF_VIEWER &&
    Boolean(activeTab.context.resourceName?.toLowerCase().match(/\.(md|markdown|mdx)$/))

  useEffect(() => {
    if (!activeTab || !shouldRedirectMarkdown) return
    updateTabPlugin(activeTab.id, BUILTIN_PLUGINS.NOTEBOOK, {
      ...activeTab.context,
      mimeType: activeTab.context.mimeType ?? 'text/markdown',
      customData: {
        ...(activeTab.context.customData || {}),
        docKind: 'markdown',
      },
    })
  }, [activeTab, shouldRedirectMarkdown, updateTabPlugin])

  if (tabs.length === 0) {
    return <EmptyWorkspace projectId={projectId} />
  }

  return (
    <div className="workspace-panel-center h-full flex flex-col mx-4 my-2">
      {/* Tab Bar */}
      <TabBar />

      {/* Plugin Render Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab ? (
          shouldRedirectMarkdown ? (
            <div className="h-full flex items-center justify-center bg-[var(--bg-panel-center)]">
              <div className="text-sm text-[var(--text-muted)]">
                {t('content_switching_markdown')}
              </div>
            </div>
          ) : (
            <PluginRenderer
              pluginId={activeTab.pluginId}
              context={activeTab.context}
              tabId={activeTab.id}
              projectId={projectId}
            />
          )
        ) : (
          <EmptyTab />
        )}
      </div>
    </div>
  )
}

export default ContentArea
