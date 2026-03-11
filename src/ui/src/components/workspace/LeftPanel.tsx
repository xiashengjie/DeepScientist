'use client'

import * as React from 'react'
import {
  FolderPlus,
  Upload,
  RefreshCw,
  Search,
  BarChart3,
  FlaskConical,
  Puzzle,
  Settings,
  X,
  Terminal,
  Eye,
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DotfilesToggleIcon } from '@/components/ui/dotfiles-toggle-icon'
import { useTabsStore } from '@/lib/stores/tabs'
import { useFileTreeStore } from '@/lib/stores/file-tree'
import { BUILTIN_PLUGINS } from '@/lib/types/plugin'
import type { FileNode } from '@/lib/types/file'
import { FilePreviewPanel, FileTree } from '@/components/file-tree'
import { ArxivPanel } from '@/components/arxiv'
import { useOpenFile } from '@/hooks/useOpenFile'
import { downloadFileById } from '@/lib/api/files'
import { listCliServers } from '@/lib/api/cli'
import { PngIcon } from '@/components/ui/png-icon'
import { cn } from '@/lib/utils'
import { CliExplorerTree, type CliExplorerTreeHandle } from './CliExplorerTree'
import { useI18n } from '@/lib/i18n/useI18n'
import {
  FolderIcon as WFolderIcon,
  ChevronDownIcon,
  SparklesIcon,
} from '@/components/ui/workspace-icons'

interface LeftPanelProps {
  projectId: string
  onClose?: () => void
  readOnly?: boolean
  onEnterHome?: () => void
  onEnterLab?: () => void
  onExitHome?: () => void
}

interface SidebarButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
}

function SidebarButton({ icon, label, onClick, active }: SidebarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full px-3 py-2 rounded-lg',
        'text-[var(--text-muted-on-dark)] text-sm font-medium',
        'transition-colors duration-150',
        'hover:bg-white/[0.06] hover:text-[var(--text-on-dark)]',
        active && 'bg-white/[0.08] text-[var(--text-on-dark)]'
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

export function LeftPanel({
  projectId,
  onClose,
  readOnly,
  onEnterHome,
  onEnterLab,
  onExitHome,
}: LeftPanelProps) {
  const { t } = useI18n('workspace')
  const openTab = useTabsStore((state) => state.openTab)
  const { createFolder, upload, refresh, isLoading } = useFileTreeStore()
  const { openFileInTab } = useOpenFile()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const cliExplorerRef = React.useRef<CliExplorerTreeHandle | null>(null)
  const [isFilesOpen, setIsFilesOpen] = React.useState(true)
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(true)
  const [isCliOpen, setIsCliOpen] = React.useState(true)
  const [hasCliServers, setHasCliServers] = React.useState(false)
  const [hideDotfiles, setHideDotfiles] = React.useState(true)

  const checkCliServers = React.useCallback(async () => {
    try {
      const servers = await listCliServers(projectId)
      const connected = servers.some(
        (server) => server.status !== 'offline' && server.status !== 'error'
      )
      setHasCliServers(connected)
      return servers
    } catch {
      setHasCliServers(false)
      return null
    }
  }, [projectId])

  React.useEffect(() => {
    void checkCliServers()
  }, [checkCliServers])

  const openPluginTab = React.useCallback(
    (pluginId: string, title: string, customData?: Record<string, unknown>) => {
      onExitHome?.()
      openTab({
        pluginId,
        context: {
          type: 'custom',
          customData: customData ? { projectId, ...customData } : { projectId },
        },
        title,
      })
    },
    [onExitHome, openTab, projectId]
  )

  const handleFileOpen = React.useCallback(
    async (file: FileNode) => {
      onExitHome?.()
      await openFileInTab(file)
    },
    [onExitHome, openFileInTab]
  )

  const handleFileDownload = React.useCallback(async (file: FileNode) => {
    try {
      await downloadFileById(file.id, file.name)
    } catch (error) {
      console.error('Failed to download file:', error)
    }
  }, [])

  const handleNewFolder = React.useCallback(async () => {
    try {
      await createFolder(null, t('leftpanel_new_folder'))
    } catch (error) {
      console.error('Failed to create folder:', error)
    }
  }, [createFolder, t])

  const handleUploadClick = React.useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileSelect = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length > 0) {
        try {
          await upload(null, files)
        } catch (error) {
          console.error('Upload failed:', error)
        }
      }
      e.target.value = ''
    },
    [upload]
  )

  const handleRefresh = React.useCallback(async () => {
    try {
      await refresh()
      void checkCliServers()
    } catch (error) {
      console.error('Failed to refresh:', error)
    }
  }, [checkCliServers, refresh])

  const handleCliNewFolder = React.useCallback(() => {
    if (readOnly) return
    cliExplorerRef.current?.createFolder()
  }, [readOnly])

  const handleCliUpload = React.useCallback(() => {
    if (readOnly) return
    cliExplorerRef.current?.upload()
  }, [readOnly])

  const handleCliRefresh = React.useCallback(() => {
    void cliExplorerRef.current?.refresh()
    void checkCliServers()
  }, [checkCliServers])

  return (
    <div className="workspace-panel-left h-full flex flex-col">
      {/* Header with Traffic Lights */}
      <div className="h-12 flex items-center px-4 border-b border-[var(--border-dark)] shrink-0">
        <div className="traffic-lights mr-3">
          <button
            type="button"
            className="traffic-light-close-button"
            onClick={onClose}
            title={t('leftpanel_close_explorer')}
            aria-label={t('leftpanel_close_explorer')}
          >
            <X className="h-3 w-3" />
          </button>
          <div className="traffic-light traffic-light-min" />
          <div className="traffic-light traffic-light-max" />
        </div>
        <span className="text-[var(--text-on-dark)] text-sm font-medium opacity-80">
          {t('leftpanel_explorer')}
        </span>
      </div>

      {/* File Tree Section */}
      <Collapsible
        open={isFilesOpen}
        onOpenChange={setIsFilesOpen}
        className="flex-1 min-h-0 flex flex-col"
      >
        <div className="flex items-center px-4 py-2.5 shrink-0">
          <CollapsibleTrigger className="flex items-center flex-1 text-[var(--text-muted-on-dark)] hover:text-[var(--text-on-dark)] transition-colors">
            <span
              className={cn(
                'mr-2 transition-transform',
                isFilesOpen && 'rotate-0',
                !isFilesOpen && '-rotate-90'
              )}
            >
              <ChevronDownIcon />
            </span>
            <WFolderIcon isOpen={isFilesOpen} className="mr-2" />
            <span className="text-sm font-medium">{t('leftpanel_files')}</span>
          </CollapsibleTrigger>

          <div className="flex items-center gap-0.5">
            <button
              onClick={handleNewFolder}
              className="p-1.5 rounded hover:bg-white/[0.08] text-[var(--text-muted-on-dark)] hover:text-[var(--text-on-dark)] transition-colors"
              title={t('leftpanel_new_folder')}
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleUploadClick}
              className="p-1.5 rounded hover:bg-white/[0.08] text-[var(--text-muted-on-dark)] hover:text-[var(--text-on-dark)] transition-colors"
              title={t('leftpanel_upload_files')}
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setHideDotfiles((prev) => !prev)}
              className="p-1.5 rounded hover:bg-white/[0.08] text-[var(--text-muted-on-dark)] hover:text-[var(--text-on-dark)] transition-colors"
              title={hideDotfiles ? t('leftpanel_show_dotfiles') : t('leftpanel_hide_dotfiles')}
              aria-label={hideDotfiles ? t('leftpanel_show_dotfiles') : t('leftpanel_hide_dotfiles')}
            >
              <DotfilesToggleIcon hidden={hideDotfiles} className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className={cn(
                'p-1.5 rounded hover:bg-white/[0.08] text-[var(--text-muted-on-dark)] hover:text-[var(--text-on-dark)] transition-colors',
                isLoading && 'animate-spin'
              )}
              title={t('leftpanel_refresh')}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        <CollapsibleContent className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="file-tree-dark">
              <FileTree
                projectId={projectId}
                onFileOpen={handleFileOpen}
                onFileDownload={handleFileDownload}
                hideDotfiles={hideDotfiles}
              />
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        className="h-[260px] shrink-0 flex flex-col border-t border-[var(--border-dark)]"
      >
        <div className="flex items-center px-4 py-2.5 shrink-0">
          <CollapsibleTrigger className="flex items-center flex-1 text-[var(--text-muted-on-dark)] hover:text-[var(--text-on-dark)] transition-colors">
            <span
              className={cn(
                'mr-2 transition-transform',
                isPreviewOpen && 'rotate-0',
                !isPreviewOpen && '-rotate-90'
              )}
            >
              <ChevronDownIcon />
            </span>
            <Eye className="mr-2 h-3.5 w-3.5" />
            <span className="text-sm font-medium">{t('leftpanel_preview')}</span>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="flex-1 min-h-0">
          <FilePreviewPanel projectId={projectId} className="h-full" />
        </CollapsibleContent>
      </Collapsible>

      {hasCliServers ? (
        <Collapsible
          open={isCliOpen}
          onOpenChange={setIsCliOpen}
          className="h-[240px] shrink-0 flex flex-col border-t border-[var(--border-dark)]"
        >
          <div className="flex items-center px-4 py-2.5 shrink-0">
            <CollapsibleTrigger className="flex items-center flex-1 text-[var(--text-muted-on-dark)] hover:text-[var(--text-on-dark)] transition-colors">
              <span
                className={cn(
                  'mr-2 transition-transform',
                  isCliOpen && 'rotate-0',
                  !isCliOpen && '-rotate-90'
                )}
              >
                <ChevronDownIcon />
              </span>
              <span className="text-sm font-medium">{t('leftpanel_cli_files')}</span>
            </CollapsibleTrigger>
            <div className="flex items-center gap-0.5">
              <button
                onClick={handleCliNewFolder}
                disabled={readOnly}
                className={cn(
                  'p-1.5 rounded hover:bg-white/[0.08] text-[var(--text-muted-on-dark)] hover:text-[var(--text-on-dark)] transition-colors',
                  readOnly && 'opacity-50'
                )}
                title={readOnly ? t('leftpanel_view_only') : t('leftpanel_new_folder')}
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleCliUpload}
                disabled={readOnly}
                className={cn(
                  'p-1.5 rounded hover:bg-white/[0.08] text-[var(--text-muted-on-dark)] hover:text-[var(--text-on-dark)] transition-colors',
                  readOnly && 'opacity-50'
                )}
                title={readOnly ? t('leftpanel_view_only') : t('leftpanel_upload_files')}
              >
                <Upload className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setHideDotfiles((prev) => !prev)}
                className="p-1.5 rounded hover:bg-white/[0.08] text-[var(--text-muted-on-dark)] hover:text-[var(--text-on-dark)] transition-colors"
                title={hideDotfiles ? t('leftpanel_show_dotfiles') : t('leftpanel_hide_dotfiles')}
                aria-label={hideDotfiles ? t('leftpanel_show_dotfiles') : t('leftpanel_hide_dotfiles')}
              >
                <DotfilesToggleIcon hidden={hideDotfiles} className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleCliRefresh}
                className="p-1.5 rounded hover:bg-white/[0.08] text-[var(--text-muted-on-dark)] hover:text-[var(--text-on-dark)] transition-colors"
                title={t('leftpanel_refresh')}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <CollapsibleContent className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="file-tree-dark">
                <CliExplorerTree
                  ref={cliExplorerRef}
                  projectId={projectId}
                  readOnly={readOnly}
                  hideDotfiles={hideDotfiles}
                />
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      ) : null}

      <div className="h-[240px] shrink-0">
        <ArxivPanel projectId={projectId} className="h-full" variant="compact" />
      </div>

      {/* Separator */}
      <div className="h-px bg-[var(--border-dark)] mx-3" />

      {/* Quick Actions */}
      <div className="p-2 space-y-0.5 shrink-0">
        <SidebarButton
          icon={<Terminal className="h-4 w-4" />}
          label={t('leftpanel_cli')}
          onClick={() => openPluginTab(BUILTIN_PLUGINS.CLI, t('plugin_cli_title'), { projectId })}
        />
        <SidebarButton
          icon={<Search className="h-4 w-4" />}
          label={t('leftpanel_search')}
          onClick={() => openPluginTab(BUILTIN_PLUGINS.SEARCH, t('plugin_search_title'))}
        />
        <SidebarButton
          icon={<BarChart3 className="h-4 w-4" />}
          label={t('leftpanel_analysis')}
          onClick={() => openPluginTab('@ds/plugin-analysis', t('leftpanel_analysis'))}
        />
        <SidebarButton
          icon={<Puzzle className="h-4 w-4" />}
          label={t('leftpanel_plugins')}
          onClick={() => openPluginTab('@ds/plugin-marketplace', t('plugin_marketplace_title'))}
        />
      </div>

      {/* Separator */}
      <div className="h-px bg-[var(--border-dark)] mx-3" />

      {/* Settings */}
      <div className="p-2 shrink-0">
        <SidebarButton
          icon={<Settings className="h-4 w-4" />}
          label={t('leftpanel_settings')}
          onClick={() => openPluginTab(BUILTIN_PLUGINS.SETTINGS, t('plugin_settings_title'))}
        />
        <SidebarButton
          icon={
            <PngIcon
              name="inverted/SparklesIcon"
              alt={t('leftpanel_agent')}
              size={16}
              className="h-4 w-4"
              fallback={<SparklesIcon className="h-4 w-4" />}
            />
          }
          label={t('leftpanel_agent')}
          onClick={() => onEnterHome?.()}
        />
        <SidebarButton
          icon={<FlaskConical className="h-4 w-4" />}
          label={t('leftpanel_home')}
          onClick={() => {
            onEnterLab?.()
            openPluginTab(BUILTIN_PLUGINS.LAB, t('plugin_lab_home_title'), { readOnly })
          }}
        />
      </div>
    </div>
  )
}

export default LeftPanel
