import type { ToolEventData, ExecutionTarget } from '@/lib/types/chat-events'

export interface ToolViewProps {
  sessionId?: string
  toolContent: ToolEventData
  live: boolean
  isShare?: boolean
  projectId?: string
  executionTarget?: ExecutionTarget
  cliServerId?: string | null
  readOnly?: boolean
  active?: boolean
  panelMode?: 'tool' | 'terminal' | 'inline'
}
