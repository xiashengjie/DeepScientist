'use client'

import { AgentCommentBlock } from '@/components/feed/AgentCommentBlock'
import type { EventMetadata } from '@/lib/types/chat-events'
import type { ToolContent } from '@/lib/plugins/ai-manus/types'
import { ToolUse } from '@/lib/plugins/ai-manus/components/ToolUse'
import { McpBashExecView } from '@/components/chat/toolViews/McpBashExecView'
import type { AgentComment } from '@/types'

function parseStructuredValue(value?: string) {
  if (!value) return null
  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    return null
  }
}

export function QuestBashExecOperation({
  questId,
  itemId,
  toolCallId,
  toolName,
  label,
  status,
  args,
  output,
  createdAt,
  metadata,
  comment,
  monitorPlanSeconds,
  monitorStepIndex,
  nextCheckAfterSeconds,
}: {
  questId: string
  itemId: string
  toolCallId?: string
  toolName?: string
  label: 'tool_call' | 'tool_result'
  status?: string
  args?: string
  output?: string
  createdAt?: string
  metadata?: Record<string, unknown>
  comment?: AgentComment | null
  monitorPlanSeconds?: number[]
  monitorStepIndex?: number | null
  nextCheckAfterSeconds?: number | null
}) {
  const timestamp = createdAt ? Date.parse(createdAt) : Date.now()
  const resolvedTimestamp = Number.isFinite(timestamp) ? timestamp : Date.now()
  const parsedArgs = parseStructuredValue(args)
  const parsedOutput = parseStructuredValue(output)
  const eventMetadata: EventMetadata = {
    surface: 'copilot',
    quest_id: questId,
    session_id:
      typeof metadata?.session_id === 'string' && metadata.session_id.trim()
        ? metadata.session_id
        : `quest:${questId}`,
    sender_type: 'agent',
    sender_label: 'DeepScientist',
    sender_name: 'DeepScientist',
    ...(metadata as EventMetadata | undefined),
  }
  const toolContent: ToolContent = {
    event_id: itemId,
    timestamp: resolvedTimestamp,
    tool_call_id: toolCallId || itemId,
    name: toolName || 'bash_exec',
    function: 'mcp__bash_exec__bash_exec',
    status: label === 'tool_call' ? 'calling' : 'called',
    args: parsedArgs ?? (args ? { raw: args } : {}),
    content:
      label === 'tool_result'
        ? {
            ...(parsedOutput ? { result: parsedOutput } : {}),
            ...(output && !parsedOutput ? { text: output } : {}),
            ...(status ? { status } : {}),
          }
        : {},
    metadata: eventMetadata,
  }

  return (
    <div className="flex flex-col gap-2">
      <ToolUse tool={toolContent} compact={false} collapsible projectId={questId} />
      {comment ? (
        <AgentCommentBlock
          comment={comment}
          monitorPlanSeconds={monitorPlanSeconds}
          monitorStepIndex={monitorStepIndex}
          nextCheckAfterSeconds={nextCheckAfterSeconds}
        />
      ) : null}
      <div className="overflow-hidden rounded-[12px]">
        <McpBashExecView
          toolContent={toolContent}
          live={label === 'tool_call' || status === 'running' || status === 'terminating'}
          sessionId={eventMetadata.session_id}
          projectId={questId}
          readOnly={false}
          panelMode="inline"
        />
      </div>
    </div>
  )
}

export default QuestBashExecOperation
