'use client'

import * as React from 'react'
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FileImage,
  FileText,
  Folder,
  FolderOpen,
  GitBranch,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { client } from '@/lib/api'
import { useQuestWorkspace } from '@/lib/acp'
import { cn } from '@/lib/utils'
import type { ExplorerNode, QuestSearchPayload, QuestSearchResultItem } from '@/types'

import { QuestAiManusChatView } from './QuestAiManusChatView'
import {
  QuestWorkspaceSurfaceInner,
  type QuestWorkspaceState,
} from './QuestWorkspaceSurface'
import type { QuestWorkspaceView } from './workspace-events'

function formatTimestamp(value?: string | null) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

function iconForNode(node: ExplorerNode) {
  if (node.kind === 'directory') {
    return node.children?.length ? FolderOpen : Folder
  }
  if (node.open_kind === 'image') return FileImage
  if (node.open_kind === 'code') return FileCode2
  return FileText
}

function QuestExplorerTree({
  nodes,
  questId,
  selectedDocumentId,
  workspace,
  onSelectedDocumentIdChange,
}: {
  nodes: ExplorerNode[]
  questId: string
  selectedDocumentId: string | null
  workspace: QuestWorkspaceState
  onSelectedDocumentIdChange: (documentId: string | null) => void
}) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    const defaults: Record<string, boolean> = {}
    const visit = (items: ExplorerNode[], depth = 0) => {
      for (const item of items) {
        if (item.kind === 'directory' && depth < 2) {
          defaults[item.id] = true
          visit(item.children ?? [], depth + 1)
        }
      }
    }
    visit(nodes)
    setExpanded((current) => ({ ...defaults, ...current }))
  }, [nodes])

  const toggle = React.useCallback((id: string) => {
    setExpanded((current) => ({ ...current, [id]: !current[id] }))
  }, [])

  const openDocument = React.useCallback(
    async (documentId: string) => {
      const opened = await client.openDocument(questId, documentId)
      workspace.setActiveDocument(opened)
      onSelectedDocumentIdChange(documentId)
    },
    [onSelectedDocumentIdChange, questId, workspace]
  )

  const renderNode = React.useCallback(
    (node: ExplorerNode, depth = 0): React.ReactNode => {
      const Icon = iconForNode(node)
      const isDirectory = node.kind === 'directory'
      const isExpanded = expanded[node.id] ?? false
      const isSelected = !isDirectory && node.document_id === selectedDocumentId

      return (
        <div key={node.id} className="space-y-1">
          <button
            type="button"
            onClick={() => {
              if (isDirectory) {
                toggle(node.id)
                return
              }
              if (node.document_id) {
                void openDocument(node.document_id)
              }
            }}
            className={cn(
              'flex w-full items-center gap-2 rounded-[16px] px-2.5 py-2 text-left text-sm transition',
              isSelected
                ? 'bg-[#1b1f27] text-white shadow-[0_14px_36px_-24px_rgba(15,23,42,0.55)]'
                : 'text-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.06]'
            )}
            style={{ paddingLeft: `${10 + depth * 14}px` }}
          >
            {isDirectory ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )
            ) : (
              <span className="h-4 w-4 shrink-0" />
            )}
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{node.name}</span>
            {node.recently_changed ? (
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#d7b56d]" />
            ) : null}
          </button>
          {isDirectory && isExpanded && node.children?.length ? (
            <div className="space-y-1">
              {node.children.map((child) => renderNode(child, depth + 1))}
            </div>
          ) : null}
        </div>
      )
    },
    [expanded, openDocument, selectedDocumentId, toggle]
  )

  return <div className="space-y-1">{nodes.map((node) => renderNode(node))}</div>
}

function SearchResults({
  results,
  loading,
  query,
  onOpen,
}: {
  results: QuestSearchPayload | null
  loading: boolean
  query: string
  onOpen: (item: QuestSearchResultItem) => void
}) {
  if (!query.trim()) {
    return (
      <div className="rounded-[20px] border border-dashed border-black/[0.08] bg-white/[0.52] px-4 py-4 text-sm text-muted-foreground dark:border-white/[0.12] dark:bg-white/[0.03]">
        Search inside the current quest files.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-[20px] border border-black/[0.08] bg-white/[0.60] px-4 py-3 text-sm text-muted-foreground dark:border-white/[0.12] dark:bg-white/[0.04]">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Searching quest files…</span>
      </div>
    )
  }

  if (!results || results.items.length === 0) {
    return (
      <div className="rounded-[20px] border border-black/[0.08] bg-white/[0.60] px-4 py-4 text-sm text-muted-foreground dark:border-white/[0.12] dark:bg-white/[0.04]">
        No matches found.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        <span>{results.items.length} matches</span>
        <span>{results.files_scanned} files</span>
      </div>
      <div className="space-y-2">
        {results.items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpen(item)}
            className="w-full rounded-[18px] border border-black/[0.08] bg-white/[0.65] px-3 py-3 text-left transition hover:bg-white/[0.82] dark:border-white/[0.12] dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="min-w-0 truncate text-sm font-medium">{item.path}</div>
              <Badge>{`L${item.line_number}`}</Badge>
            </div>
            <div className="line-clamp-2 text-xs text-muted-foreground">{item.snippet}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

export function QuestProjectWorkspace({
  questId,
  projectName,
}: {
  questId: string
  projectName: string
}) {
  const workspace = useQuestWorkspace(questId)
  const [view, setView] = React.useState<QuestWorkspaceView>('canvas')
  const [composer, setComposer] = React.useState('')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [searchResults, setSearchResults] = React.useState<QuestSearchPayload | null>(null)
  const [searchLoading, setSearchLoading] = React.useState(false)
  const [selectedDocumentId, setSelectedDocumentId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const query = searchQuery.trim()
    if (!query) {
      setSearchResults(null)
      setSearchLoading(false)
      return
    }
    let cancelled = false
    setSearchLoading(true)
    const timer = window.setTimeout(() => {
      void client
        .search(questId, query, 40)
        .then((payload) => {
          if (!cancelled) {
            setSearchResults(payload)
          }
        })
        .catch(() => {
          if (!cancelled) {
            setSearchResults(null)
          }
        })
        .finally(() => {
          if (!cancelled) {
            setSearchLoading(false)
          }
        })
    }, 180)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [questId, searchQuery])

  const openSearchResult = React.useCallback(
    async (item: QuestSearchResultItem) => {
      const opened = await client.openDocument(questId, item.document_id)
      workspace.setActiveDocument({
        ...opened,
        meta: {
          ...(opened.meta ?? {}),
          highlight_line: item.line_number,
          highlight_query: searchQuery.trim(),
        },
      })
      setSelectedDocumentId(item.document_id)
    },
    [questId, searchQuery, workspace]
  )

  const sections = workspace.explorer?.sections ?? []
  const snapshot = workspace.snapshot
  const statusLine = snapshot?.summary?.status_line || 'Quest workspace'

  return (
    <div className="h-screen overflow-hidden bg-[#f4efe9] text-foreground dark:bg-[#0b0c0e]">
      <div className="flex h-full min-h-0 flex-col">
        <div className="border-b border-black/[0.06] bg-white/[0.62] px-5 py-4 backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.03]">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <div className="truncate text-lg font-semibold">{projectName}</div>
                {snapshot?.status ? <Badge>{snapshot.status}</Badge> : null}
                {snapshot?.active_anchor ? <Badge>{snapshot.active_anchor}</Badge> : null}
                {snapshot?.branch ? (
                  <Badge className="gap-1">
                    <GitBranch className="h-3 w-3" />
                    <span>{snapshot.branch}</span>
                  </Badge>
                ) : null}
              </div>
              <div className="truncate text-sm text-muted-foreground">{statusLine}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{`${snapshot?.counts?.artifacts ?? 0} artifacts`}</Badge>
              <Badge>{`${snapshot?.counts?.memory_cards ?? 0} memory`}</Badge>
              <Badge>{formatTimestamp(snapshot?.updated_at)}</Badge>
              <Button variant="secondary" size="sm" onClick={() => void workspace.refresh(false)}>
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden p-3">
          <ResizablePanelGroup orientation="horizontal" className="h-full gap-0">
            <ResizablePanel defaultSize={21} minSize={16}>
              <div className="flex h-full min-h-0 flex-col rounded-[28px] border border-black/[0.08] bg-white/[0.64] shadow-[0_28px_90px_-58px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/[0.10] dark:bg-white/[0.03]">
                <div className="border-b border-black/[0.06] px-4 py-4 dark:border-white/[0.08]">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span>Explorer</span>
                  </div>
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search files and content…"
                    className="rounded-[18px] bg-white/[0.75] dark:bg-white/[0.04]"
                  />
                </div>

                <ScrollArea className="min-h-0 flex-1 px-3 py-3">
                  <div className="space-y-4 pb-4">
                    {searchQuery.trim() ? (
                      <SearchResults
                        results={searchResults}
                        loading={searchLoading}
                        query={searchQuery}
                        onOpen={openSearchResult}
                      />
                    ) : (
                      sections.map((section) => (
                        <div key={section.id} className="space-y-2">
                          <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {section.title}
                          </div>
                          <QuestExplorerTree
                            nodes={section.nodes}
                            questId={questId}
                            selectedDocumentId={selectedDocumentId}
                            workspace={workspace}
                            onSelectedDocumentIdChange={setSelectedDocumentId}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                <div className="border-t border-black/[0.06] p-3 dark:border-white/[0.08]">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={view === 'canvas' ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => setView('canvas')}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Canvas
                    </Button>
                    <Button
                      variant={view === 'details' ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => setView('details')}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={49} minSize={32}>
              <div className="h-full min-h-0 px-3">
                <QuestWorkspaceSurfaceInner
                  questId={questId}
                  safePaddingLeft={0}
                  safePaddingRight={0}
                  view={view}
                  onViewChange={setView}
                  workspace={workspace}
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={30} minSize={22}>
              <div className="h-full min-h-0 rounded-[28px] border border-black/[0.08] bg-[var(--background-gray-main)] shadow-[0_28px_90px_-58px_rgba(15,23,42,0.45)] dark:border-white/[0.10]">
                <QuestAiManusChatView
                  questId={questId}
                  feed={workspace.feed}
                  composer={composer}
                  loading={workspace.loading}
                  restoring={workspace.restoring}
                  historyTruncated={workspace.historyTruncated}
                  historyLimit={workspace.historyLimit}
                  historyExpanded={workspace.historyExpanded}
                  historyLoadingFull={workspace.historyLoadingFull}
                  streaming={workspace.streaming}
                  activeToolCount={workspace.activeToolCount}
                  error={workspace.error}
                  connectionState={workspace.connectionState}
                  onComposerChange={setComposer}
                  onSubmit={async (value) => {
                    await workspace.submit(value)
                    setComposer('')
                  }}
                  onStop={() => void workspace.stopRun()}
                  onLoadFullHistory={() => void workspace.loadFullHistory()}
                  showSurfaceToggleInline
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  )
}

export default QuestProjectWorkspace
