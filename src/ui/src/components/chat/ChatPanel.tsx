'use client'

/**
 * ChatPanel
 *
 * Legacy entry point for the Copilot UI. The chat experience is powered by ai-manus.
 */

import * as React from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SparklesIcon } from '@/components/ui/workspace-icons'
import dynamic from 'next/dynamic'
import type { AiManusChatActions } from '@/lib/plugins/ai-manus/view-types'

const AiManusChatView = dynamic(() => import('@/lib/plugins/ai-manus/AiManusChatView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
      Loading Copilot…
    </div>
  ),
})

export interface ChatPanelProps {
  projectId: string
  conversationId?: string
  className?: string
  onClose?: () => void
}

export function ChatPanel({ projectId, className, onClose }: ChatPanelProps) {
  const [copilotActions, setCopilotActions] = React.useState<AiManusChatActions | null>(null)

  const handleNewThread = React.useCallback(() => {
    if (!copilotActions) return
    copilotActions.startNewThread()
    window.setTimeout(() => copilotActions.focusComposer(), 0)
  }, [copilotActions])

  return (
    <div className={cn('panel right-panel edge-glow', className)}>
      <div className="panel-header">
        <div className="traffic-lights">
          <div className="light close" onClick={onClose} title="Hide Copilot" />
          <div className="light min" />
          <div className="light max" />
        </div>
        <div className="flex items-center gap-2 font-semibold text-sm">
          <SparklesIcon className="text-[var(--brand)]" />
          Copilot
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleNewThread}
            className="ds-copilot-icon-btn"
            aria-label="New Task"
            data-tooltip="New Task"
            disabled={!copilotActions}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <AiManusChatView
          mode="copilot"
          projectId={projectId}
          onActionsChange={setCopilotActions}
          deferSessionList
        />
      </div>
    </div>
  )
}

export default ChatPanel
