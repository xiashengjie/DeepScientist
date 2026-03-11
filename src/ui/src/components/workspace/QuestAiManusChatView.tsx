'use client'

import { type RefObject, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, Loader2, MessageSquareText, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCopilotDockCallbacks } from '@/components/workspace/CopilotDockOverlay'
import { ChatScrollProvider } from '@/lib/plugins/ai-manus/lib/chat-scroll-context'
import { buildChatTurns, type ChatTurn, type ChatTurnBlock } from '@/lib/plugins/ai-manus/lib/chat-turns'
import { ChatBox } from '@/lib/plugins/ai-manus/components/ChatBox'
import { ChatMessage } from '@/lib/plugins/ai-manus/components/ChatMessage'
import { ThinkingIndicator } from '@/lib/plugins/ai-manus/components/ThinkingIndicator'
import OrbitLogoStatus from '@/lib/plugins/ai-manus/components/OrbitLogoStatus'
import type { MessageContent } from '@/lib/plugins/ai-manus/types'
import type { FeedItem } from '@/types'
import { adaptQuestFeedToChatMessages, type QuestChatSurface } from './quest-chat-adapter'

const MAX_RENDERED_MESSAGES = 120
const AUTO_FOLLOW_THRESHOLD_PX = 120

type QuestAiManusChatViewProps = {
  questId: string
  feed: FeedItem[]
  composer: string
  loading?: boolean
  restoring?: boolean
  historyTruncated?: boolean
  historyLimit?: number | null
  historyExpanded?: boolean
  historyLoadingFull?: boolean
  streaming?: boolean
  activeToolCount?: number
  error?: string | null
  connectionState?: 'connecting' | 'connected' | 'reconnecting' | 'error'
  inputRef?: RefObject<HTMLTextAreaElement>
  onComposerChange: (value: string) => void
  onSubmit: (value: string) => Promise<void> | void
  onStop?: () => void
  onLoadFullHistory?: () => Promise<void> | void
  showSurfaceToggleInline?: boolean
}

function readStoredSurface(storageKey: string) {
  if (typeof window === 'undefined') {
    return 'chat' as QuestChatSurface
  }
  const stored = window.localStorage.getItem(storageKey)
  return stored === 'studio' ? 'studio' : 'chat'
}

function isAssistantBlock(block: ChatTurnBlock) {
  if (block.role === 'assistant') return true
  if (block.role === 'user') return false
  const message = block.message
  if (message.type === 'text_delta') {
    return (message.content as MessageContent).role === 'assistant'
  }
  switch (message.type) {
    case 'assistant':
    case 'tool':
    case 'tool_call':
    case 'tool_result':
    case 'reasoning':
    case 'step':
    case 'question_prompt':
    case 'clarify_question':
    case 'patch_review':
      return true
    default:
      return false
  }
}

export function QuestAiManusChatView({
  questId,
  feed,
  composer,
  loading = false,
  restoring = false,
  historyTruncated = false,
  historyLimit = null,
  historyExpanded = false,
  historyLoadingFull = false,
  streaming = false,
  activeToolCount = 0,
  error = null,
  connectionState = 'connected',
  inputRef,
  onComposerChange,
  onSubmit,
  onStop,
  onLoadFullHistory,
  showSurfaceToggleInline = true,
}: QuestAiManusChatViewProps) {
  const storageKey = `ds:quest:${questId}:copilot-surface`
  const dockCallbacks = useCopilotDockCallbacks()
  const [surface, setSurface] = useState<QuestChatSurface>(() => readStoredSurface(storageKey))
  const [renderedSurface, setRenderedSurface] = useState<QuestChatSurface>(() => readStoredSurface(storageKey))
  const [showFullHistory, setShowFullHistory] = useState(historyExpanded)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const [toolOpenOverrides, setToolOpenOverrides] = useState<Record<string, boolean>>({})
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const listInnerRef = useRef<HTMLDivElement | null>(null)
  const initialScrollDoneRef = useRef(false)
  const isNearBottomRef = useRef(true)
  const hasNewMessagesRef = useRef(false)
  const lastMessageIdRef = useRef<string | null>(null)

  useEffect(() => {
    const storedSurface = readStoredSurface(storageKey)
    setSurface(storedSurface)
    setRenderedSurface(storedSurface)
  }, [storageKey])

  useEffect(() => {
    setToolOpenOverrides({})
  }, [questId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(storageKey, surface)
  }, [storageKey, surface])

  const surfaceSwitching = renderedSurface !== surface

  const headerActions = useMemo(
    () => (
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={cn('ai-manus-tool-btn gap-1.5 px-3', surface === 'chat' && 'is-active')}
          onClick={() => setSurface('chat')}
        >
          <MessageSquareText className="h-3.5 w-3.5" />
          <span>Chat</span>
        </button>
        <button
          type="button"
          className={cn('ai-manus-tool-btn gap-1.5 px-3', surface === 'studio' && 'is-active')}
          onClick={() => setSurface('studio')}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Studio</span>
        </button>
      </div>
    ),
    [surface]
  )

  useEffect(() => {
    dockCallbacks?.onHeaderExtraChange(headerActions)
    return () => dockCallbacks?.onHeaderExtraChange(null)
  }, [dockCallbacks, headerActions])

  useEffect(() => {
    setShowFullHistory(historyExpanded)
  }, [historyExpanded])

  useEffect(() => {
    if (historyTruncated) {
      setShowFullHistory(false)
    }
  }, [historyTruncated, questId])

  const hasLiveActivity = streaming || activeToolCount > 0
  const messageMaxWidthClass = 'max-w-[768px]'
  const listPaddingClass = 'px-4'
  const listTopPaddingClass = 'pt-[12px]'
  const composerPaddingClass = 'mt-auto px-3 pb-1 pt-3'
  const orbitOffsetClass = 'right-3'
  const listBottomPadding = 120

  const allMessages = useMemo(
    () => (surfaceSwitching ? [] : adaptQuestFeedToChatMessages(questId, feed, renderedSurface)),
    [feed, questId, renderedSurface, surfaceSwitching]
  )

  const visibleMessages = useMemo(() => {
    if (showFullHistory) return allMessages
    if (allMessages.length <= MAX_RENDERED_MESSAGES) return allMessages
    return allMessages.slice(-MAX_RENDERED_MESSAGES)
  }, [allMessages, showFullHistory])

  const hiddenCount = showFullHistory ? 0 : Math.max(0, allMessages.length - visibleMessages.length)
  const displayTurns = useMemo(() => buildChatTurns(visibleMessages), [visibleMessages])
  const toolBlockIds = useMemo(
    () =>
      displayTurns.flatMap((turn) =>
        turn.blocks
          .filter((block) => block.kind === 'tool_call' || block.kind === 'tool_result')
          .map((block) => block.id)
      ),
    [displayTurns]
  )
  const latestToolBlockId = toolBlockIds.length > 0 ? toolBlockIds[toolBlockIds.length - 1] : null
  const streamingMessageId = useMemo(() => {
    for (let index = visibleMessages.length - 1; index >= 0; index -= 1) {
      const message = visibleMessages[index]
      if (message.type !== 'text_delta') continue
      const content = message.content as MessageContent
      if (content.role === 'assistant' && content.status === 'in_progress') {
        return message.id
      }
    }
    return null
  }, [visibleMessages])
  const showThinking = !streamingMessageId && hasLiveActivity

  useEffect(() => {
    const validIds = new Set(toolBlockIds)
    setToolOpenOverrides((current) => {
      const entries = Object.entries(current).filter(([key]) => validIds.has(key))
      if (entries.length === Object.keys(current).length) return current
      return Object.fromEntries(entries)
    })
  }, [toolBlockIds])

  const connectionStatus = useMemo(() => {
    if (error?.trim()) return error.trim()
    if (connectionState === 'connecting') return 'Connecting to quest stream…'
    if (connectionState === 'reconnecting') return 'Reconnecting to quest stream…'
    if (connectionState === 'error') return 'Quest stream needs attention.'
    return null
  }, [connectionState, error])

  const setHasNewMessagesSafe = useCallback((next: boolean) => {
    if (hasNewMessagesRef.current === next) return
    hasNewMessagesRef.current = next
    setHasNewMessages(next)
  }, [])

  useEffect(() => {
    if (surface === renderedSurface) return
    initialScrollDoneRef.current = false
    lastMessageIdRef.current = null
    isNearBottomRef.current = true
    setIsNearBottom(true)
    setHasNewMessagesSafe(false)
    setToolOpenOverrides({})
    const frame = window.requestAnimationFrame(() => {
      setRenderedSurface(surface)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [renderedSurface, setHasNewMessagesSafe, surface])

  const updateNearBottom = useCallback(
    (container: HTMLDivElement | null) => {
      if (!container) return
      const distance = container.scrollHeight - container.scrollTop - container.clientHeight
      const next = distance <= AUTO_FOLLOW_THRESHOLD_PX
      if (next !== isNearBottomRef.current) {
        isNearBottomRef.current = next
        setIsNearBottom(next)
      }
      if (next) {
        setHasNewMessagesSafe(false)
      }
    },
    [setHasNewMessagesSafe]
  )

  const handleScroll = useCallback(() => {
    updateNearBottom(scrollRef.current)
  }, [updateNearBottom])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const container = scrollRef.current
    if (!container) return
    container.scrollTo({ top: container.scrollHeight, behavior })
  }, [])

  const handleJumpToBottom = useCallback(() => {
    scrollToBottom('smooth')
    isNearBottomRef.current = true
    setIsNearBottom(true)
    setHasNewMessagesSafe(false)
  }, [scrollToBottom, setHasNewMessagesSafe])

  const handleLoadFullHistory = useCallback(async () => {
    if (!onLoadFullHistory || historyLoadingFull) return
    await onLoadFullHistory()
  }, [historyLoadingFull, onLoadFullHistory])

  const handleSubmit = useCallback(() => {
    const value = composer.trim()
    if (!value) return
    void onSubmit(value)
  }, [composer, onSubmit])

  useLayoutEffect(() => {
    if (visibleMessages.length === 0) {
      initialScrollDoneRef.current = false
      lastMessageIdRef.current = null
      setHasNewMessagesSafe(false)
      return
    }
    if (initialScrollDoneRef.current) return
    if (!scrollRef.current) return
    scrollToBottom('auto')
    isNearBottomRef.current = true
    setIsNearBottom(true)
    setHasNewMessagesSafe(false)
    initialScrollDoneRef.current = true
  }, [scrollToBottom, setHasNewMessagesSafe, visibleMessages.length])

  useEffect(() => {
    if (!isNearBottomRef.current) return
    if (visibleMessages.length === 0) return
    scrollToBottom('auto')
  }, [displayTurns.length, scrollToBottom, visibleMessages.length])

  useEffect(() => {
    if (visibleMessages.length === 0) return
    const lastId = visibleMessages[visibleMessages.length - 1]?.id ?? null
    if (!lastId || lastId === lastMessageIdRef.current) return
    lastMessageIdRef.current = lastId
    if (!isNearBottomRef.current) {
      setHasNewMessagesSafe(true)
    }
  }, [setHasNewMessagesSafe, visibleMessages])

  const renderBlock = useCallback(
    (block: ChatTurnBlock, showAssistantHeader = false) => {
      const isToolBlock = block.kind === 'tool_call' || block.kind === 'tool_result'
      const inlineToolOpen =
        isToolBlock && latestToolBlockId
          ? toolOpenOverrides[block.id] ?? block.id === latestToolBlockId
          : undefined
      return (
        <ChatMessage
          key={block.id}
          message={block.message}
          projectId={questId}
          sessionId={`quest:${questId}`}
          readOnly={false}
          compact
          showAssistantHeader={showAssistantHeader}
          preferInlineToolView
          inlineToolOpen={inlineToolOpen}
          onInlineToolOpenChange={
            isToolBlock
              ? (open) =>
                  setToolOpenOverrides((current) => {
                    if (current[block.id] === open) return current
                    return { ...current, [block.id]: open }
                  })
              : undefined
          }
          displayStreaming={Boolean(streamingMessageId && block.sourceIds.includes(streamingMessageId))}
          streamActive={streaming}
        />
      )
    },
    [latestToolBlockId, questId, streaming, streamingMessageId, toolOpenOverrides]
  )

  const renderTurn = useCallback(
    (turn: ChatTurn) => {
      const firstAssistantIndex = turn.blocks.findIndex((block) => isAssistantBlock(block))
      return (
        <div key={turn.id} className="flex w-full flex-col gap-[12px]">
          {turn.blocks.map((block, index) => renderBlock(block, index === firstAssistantIndex))}
        </div>
      )
    },
    [renderBlock]
  )

  return (
    <ChatScrollProvider value={{ isNearBottom }}>
        <div className="ai-manus-root ai-manus-copilot ai-manus-embedded flex flex-1 min-h-0 min-w-0 flex-col">
          {showSurfaceToggleInline && !dockCallbacks ? (
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border-light)] px-4 py-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-[var(--text-primary)]">Copilot</div>
                <div className="text-[11px] text-[var(--text-tertiary)]">
                  Chat keeps only interaction artifacts, Studio keeps the full working trace.
                </div>
              </div>
              <div className="shrink-0">{headerActions}</div>
            </div>
          ) : null}
          <div className="relative flex h-full min-h-0 flex-col">
            <div className="relative flex flex-1 min-h-0 flex-col overflow-hidden transition-opacity duration-300 ease-out motion-reduce:transition-none">
              {historyLoadingFull ? (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                  <div className="flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-[var(--background-white-main)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-tertiary)] shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading full history...</span>
                  </div>
                </div>
              ) : null}
              <div
                ref={scrollRef}
                className={cn(
                  'ai-manus-scrollbar ai-manus-copilot-feed flex-1 min-h-0 overflow-x-hidden overflow-y-auto',
                  listPaddingClass
                )}
                onScroll={handleScroll}
              >
                <div
                  ref={listInnerRef}
                  className={cn(
                    'ai-manus-copilot-feed__inner mx-auto flex w-full min-w-0 flex-col gap-[12px] overflow-x-hidden',
                    listTopPaddingClass,
                    messageMaxWidthClass
                  )}
                  style={{ paddingBottom: listBottomPadding }}
                >
                  {historyTruncated ? (
                    <div className="flex w-full justify-center">
                      <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--border-light)] bg-[var(--background-tsp-menu-white)] px-3 py-1 text-[12px] font-medium text-[var(--text-secondary)] shadow-[inset_0px_1px_0px_0px_#FFFFFF]">
                        <span>
                          {typeof historyLimit === 'number' && historyLimit > 0
                            ? `Showing latest ${historyLimit} messages.`
                            : 'Showing recent messages.'}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleLoadFullHistory()}
                          disabled={historyLoadingFull}
                          className="text-[var(--text-primary)] underline decoration-dotted underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {historyLoadingFull ? 'Loading full history...' : 'Load full history'}
                        </button>
                      </div>
                    </div>
                  ) : hiddenCount > 0 ? (
                    <div className="text-center text-[11px] text-[var(--text-tertiary)]">
                      Showing the latest {visibleMessages.length} messages
                    </div>
                  ) : null}

                  {displayTurns.map((turn) => renderTurn(turn))}
                  {showThinking ? <ThinkingIndicator compact /> : null}
                </div>
              </div>

              {hasNewMessages ? (
                <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
                  <button
                    type="button"
                    onClick={handleJumpToBottom}
                    className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[var(--border-main)] bg-[var(--background-white-main)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-primary)] shadow-[0px_8px_20px_-12px_rgba(0,0,0,0.28)] hover:bg-[var(--background-gray-main)]"
                  >
                    New messages
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null}
            </div>

            <div className={cn('relative sticky bottom-0 z-10 flex-shrink-0 overflow-visible', composerPaddingClass)}>
              <div
                aria-hidden
                className="pointer-events-none absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-[var(--background-gray-main)] to-transparent"
              />

              {hasLiveActivity ? (
                <div className={cn('pointer-events-none absolute top-0 z-10 -translate-y-1/2', orbitOffsetClass)}>
                  <OrbitLogoStatus
                    toolCount={activeToolCount}
                    resetKey={`${questId}:${visibleMessages.length}:${streaming}:${activeToolCount}`}
                    className="shrink-0"
                    size="lg"
                    compact
                  />
                </div>
              ) : null}

              <div className="w-full">
                <ChatBox
                  value={composer}
                  onChange={onComposerChange}
                  onSubmit={handleSubmit}
                  onStop={onStop}
                  isRunning={hasLiveActivity}
                  attachments={[]}
                  onAttachmentsChange={() => undefined}
                  attachmentsEnabled={false}
                  recentFiles={[]}
                  recentFilesEnabled={false}
                  recentFilesDisabled
                  showTerminalToggle={false}
                  projectId={null}
                  sessionId={`quest:${questId}`}
                  readOnly={false}
                  inputDisabled={false}
                  compact
                  placeholder="Give DeepScientist a task to work on..."
                  inputRef={inputRef}
                />
              </div>

              {connectionStatus ? (
                <div className="mt-2 text-[12px] text-[var(--text-tertiary)]">{connectionStatus}</div>
              ) : null}
            </div>
          </div>
        </div>
      </ChatScrollProvider>
  )
}

export default QuestAiManusChatView
