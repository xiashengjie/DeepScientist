import type { EventMetadata } from '@/lib/types/chat-events'
import type {
  ChatMessageItem,
  MessageContent,
  ReasoningContent,
  StatusContent,
  ToolContent,
} from '@/lib/plugins/ai-manus/types'
import type { FeedItem } from '@/types'

export type QuestChatSurface = 'chat' | 'studio'

function toTimestamp(value?: string) {
  if (!value) return Date.now()
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : Date.now()
}

function parseStructuredValue(value?: string) {
  if (!value) return null
  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function buildToolArgs(
  item: Extract<FeedItem, { type: 'operation' }>,
  functionName: string,
  parsedArgs: unknown
) {
  const recordArgs = asRecord(parsedArgs)
  if (recordArgs) return recordArgs
  const raw = typeof item.args === 'string' ? item.args : ''
  if (!raw) return {}
  if (functionName === 'shell_exec') {
    return {
      command: raw,
      raw,
    }
  }
  if (functionName === 'web_search') {
    return {
      query: raw,
      raw,
    }
  }
  return { raw }
}

function normalizeToolSegment(value?: string) {
  if (!value) return ''
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function buildSearchResults(value: unknown) {
  const normalizeResult = (entry: unknown) => {
    const record = asRecord(entry)
    if (!record) return null
    const title = asString(record.title) || asString(record.name) || asString(record.label)
    const link =
      asString(record.link) ||
      asString(record.url) ||
      asString(record.href) ||
      asString(record.source)
    const source = asString(record.source) || asString(record.domain) || asString(record.site)
    const snippet =
      asString(record.snippet) ||
      asString(record.summary) ||
      asString(record.description) ||
      asString(record.text) ||
      asString(record.content)
    if (!title && !link && !snippet) return null
    return {
      ...(title ? { title } : {}),
      ...(link ? { link } : {}),
      ...(source ? { source } : {}),
      ...(snippet ? { snippet } : {}),
    }
  }

  const output = asRecord(value)
  const candidates: unknown[] = [
    value,
    output?.results,
    output?.items,
    output?.search_results,
    asRecord(output?.data)?.results,
    asRecord(output?.data)?.items,
    asRecord(output?.response)?.results,
    asRecord(output?.response)?.items,
  ]

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue
    const normalized = candidate
      .map((entry) => normalizeResult(entry))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    if (normalized.length > 0) return normalized
  }

  return []
}

function buildSearchQueries(value: unknown) {
  const output = asRecord(value)
  const directQueries = output?.queries
  const actionQueries = asRecord(output?.action)?.queries
  const candidates = [directQueries, actionQueries]
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue
    const queries = candidate
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter((entry): entry is string => Boolean(entry))
    if (queries.length > 0) return Array.from(new Set(queries))
  }
  return []
}

function isSearchLikeTool(item: Extract<FeedItem, { type: 'operation' }>, functionName: string) {
  const normalizedName = normalizeToolSegment(item.toolName)
  return (
    functionName === 'web_search' ||
    functionName === 'websearch' ||
    functionName === 'info_search_web' ||
    functionName === 'web_news' ||
    normalizedName.includes('search')
  )
}

function normalizeOperationMetadata(
  questId: string,
  item: Extract<FeedItem, { type: 'operation' }>
): EventMetadata {
  const metadata = (item.metadata ?? {}) as EventMetadata
  const sessionId =
    typeof metadata.session_id === 'string' && metadata.session_id.trim()
      ? metadata.session_id
      : `quest:${questId}`
  return {
    ...metadata,
    quest_id: questId,
    session_id: sessionId,
    mcp_server:
      typeof metadata.mcp_server === 'string' ? metadata.mcp_server : item.mcpServer,
    mcp_tool:
      typeof metadata.mcp_tool === 'string' ? metadata.mcp_tool : item.mcpTool,
    bash_id: typeof metadata.bash_id === 'string' ? metadata.bash_id : undefined,
    bash_status:
      typeof metadata.bash_status === 'string' ? metadata.bash_status : item.status,
    bash_mode: typeof metadata.bash_mode === 'string' ? metadata.bash_mode : undefined,
    bash_command:
      typeof metadata.bash_command === 'string' ? metadata.bash_command : undefined,
    bash_workdir:
      typeof metadata.bash_workdir === 'string' ? metadata.bash_workdir : undefined,
  }
}

function canonicalToolFunction(item: Extract<FeedItem, { type: 'operation' }>) {
  if (item.mcpServer && item.mcpTool) {
    return `mcp__${normalizeToolSegment(item.mcpServer)}__${normalizeToolSegment(item.mcpTool)}`
  }
  const normalized = normalizeToolSegment(item.toolName)
  if (normalized === 'shell_command') return 'shell_exec'
  if (normalized === 'web_fetch') return 'webfetch'
  if (normalized === 'web_search' || normalized === 'websearch') return 'web_search'
  return normalized || item.toolName || item.label
}

function buildMetadata(questId: string, extra?: Partial<EventMetadata>): EventMetadata {
  return {
    surface: 'copilot',
    quest_id: questId,
    sender_type: 'agent',
    sender_label: 'DeepScientist',
    sender_name: 'DeepScientist',
    ...extra,
  }
}

function buildArtifactText(item: Extract<FeedItem, { type: 'artifact' }>) {
  const sections = [item.content.trim()]
  const headerBits = [
    item.flowType ? `Flow: ${item.flowType}` : '',
    item.protocolStep ? `Step: ${item.protocolStep}` : '',
    item.branch ? `Branch: \`${item.branch}\`` : '',
    item.workspaceRoot ? `Workspace: \`${item.workspaceRoot}\`` : '',
  ].filter(Boolean)
  if (headerBits.length > 0) {
    sections.push(headerBits.join(' · '))
  }
  if (item.reason?.trim()) {
    sections.push(`Reason: ${item.reason.trim()}`)
  }
  if (item.guidance?.trim()) {
    sections.push(`Next: ${item.guidance.trim()}`)
  }
  if (item.ideaId || item.campaignId || item.sliceId) {
    sections.push(
      [
        item.ideaId ? `Idea: \`${item.ideaId}\`` : '',
        item.campaignId ? `Campaign: \`${item.campaignId}\`` : '',
        item.sliceId ? `Slice: \`${item.sliceId}\`` : '',
      ]
        .filter(Boolean)
        .join(' · ')
    )
  }
  const pathEntries = Object.entries(item.paths ?? {}).filter(([, value]) => value && value.trim())
  if (pathEntries.length > 0) {
    sections.push(
      ['Paths:', ...pathEntries.map(([key, value]) => `- ${key}: \`${value}\``)].join('\n')
    )
  }
  const detailEntries = Object.entries(item.details ?? {}).filter(([, value]) => value != null && value !== '')
  if (detailEntries.length > 0) {
    sections.push(
      [
        'Details:',
        ...detailEntries
          .slice(0, 8)
          .map(([key, value]) => `- ${key}: \`${typeof value === 'string' ? value : JSON.stringify(value)}\``),
      ].join('\n')
    )
  }
  return sections.filter(Boolean).join('\n\n')
}

function buildTextMessage(
  item: Extract<FeedItem, { type: 'message' }>,
  questId: string,
  seq: number
): ChatMessageItem {
  const timestamp = toTimestamp(item.createdAt)
  const content: MessageContent = {
    timestamp,
    content: item.content,
    role: item.role,
    status: item.stream ? 'in_progress' : 'completed',
    metadata: buildMetadata(questId, {
      sender_type: item.role === 'user' ? 'user' : 'agent',
      sender_label: item.role === 'user' ? 'You' : 'DeepScientist',
      sender_name: item.role === 'user' ? 'You' : 'DeepScientist',
      agent_label: item.role === 'assistant' ? 'DeepScientist' : undefined,
      delivery_state: item.deliveryState ?? undefined,
    }),
  }
  return {
    id: item.id,
    type: 'text_delta',
    seq,
    ts: timestamp,
    content,
  }
}

function buildReasoningMessage(
  item: Extract<FeedItem, { type: 'message' }>,
  questId: string,
  seq: number
): ChatMessageItem {
  const timestamp = toTimestamp(item.createdAt)
  const content: ReasoningContent = {
    reasoning_id: item.runId || item.id,
    timestamp,
    content: item.content,
    status: 'completed',
    kind: 'full',
    metadata: buildMetadata(questId, {
      sender_type: 'agent',
      sender_label: 'DeepScientist',
      sender_name: 'DeepScientist',
      agent_label: 'DeepScientist',
      message_kind: 'status',
    }),
  }
  return {
    id: item.id,
    type: 'reasoning',
    seq,
    ts: timestamp,
    content,
  }
}

function shouldRenderAsReasoning(item: Extract<FeedItem, { type: 'message' }>) {
  if (item.reasoning) return true
  return item.eventType === 'runner.agent_message'
}

function normalizeComparableText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function buildArtifactMessage(
  item: Extract<FeedItem, { type: 'artifact' }>,
  questId: string,
  seq: number
): ChatMessageItem {
  const timestamp = toTimestamp(item.createdAt)
  const content: MessageContent = {
    timestamp,
    content: buildArtifactText(item),
    role: 'assistant',
    status: 'completed',
    metadata: buildMetadata(questId, {
      message_kind: 'status',
      reply_state: item.replyMode ?? undefined,
    }),
  }
  return {
    id: item.id,
    type: 'text_delta',
    seq,
    ts: timestamp,
    content,
  }
}

function shouldRenderArtifactInChat(item: Extract<FeedItem, { type: 'artifact' }>) {
  if (item.expectsReply) return true
  if (item.interactionId) return true
  return item.replyMode === 'blocking' || item.replyMode === 'threaded'
}

function buildToolMessage(
  item: Extract<FeedItem, { type: 'operation' }>,
  questId: string,
  seq: number
): ChatMessageItem {
  const timestamp = toTimestamp(item.createdAt)
  const parsedArgs = parseStructuredValue(item.args)
  const parsedOutput = parseStructuredValue(item.output)
  const isFailed = item.status === 'failed'
  const metadata = normalizeOperationMetadata(questId, item)
  const functionName = canonicalToolFunction(item)
  const outputRecord = asRecord(parsedOutput)
  const structuredOutput =
    asRecord(outputRecord?.structured_content) ||
    asRecord(outputRecord?.structuredContent) ||
    outputRecord
  const searchResults = isSearchLikeTool(item, functionName) ? buildSearchResults(parsedOutput) : []
  const searchQueries = isSearchLikeTool(item, functionName)
    ? buildSearchQueries(structuredOutput) || buildSearchQueries(parsedOutput)
    : []
  const metadataSearch = asRecord(metadata.search)
  const query =
    asString(metadataSearch?.query) ||
    asString(structuredOutput?.query) ||
    asString(outputRecord?.query) ||
    asString(asRecord(parsedArgs)?.query) ||
    asString(asRecord(parsedArgs)?.q) ||
    asString(asRecord(parsedArgs)?.text)
  const outputText =
    typeof parsedOutput === 'string'
      ? parsedOutput
      : typeof item.output === 'string' && item.output.trim()
        ? item.output
        : undefined
  const content =
    item.label === 'tool_result'
      ? {
          ...(parsedOutput ? { result: parsedOutput } : {}),
          ...(structuredOutput && structuredOutput !== parsedOutput ? { structured_result: structuredOutput } : {}),
          ...(outputText ? { text: outputText, output: outputText } : {}),
          ...(item.content ? { summary: item.content } : {}),
          ...(item.status ? { status: item.status } : {}),
          ...(asString(outputRecord?.error) ? { error: asString(outputRecord?.error) } : {}),
          ...(query ? { query } : {}),
          ...(searchQueries.length > 0 ? { queries: searchQueries } : {}),
          ...(searchResults.length > 0 ? { results: searchResults } : {}),
          ...(isFailed ? { success: false, error: item.output || item.content } : {}),
        }
      : {}
  const toolContent: ToolContent = {
    event_id: item.id,
    timestamp,
    seq,
    tool_call_id: item.toolCallId || item.id,
    name: item.toolName || item.label,
    function: functionName,
    status: item.label === 'tool_call' ? 'calling' : 'called',
    args: buildToolArgs(item, functionName, parsedArgs),
    content,
    metadata: buildMetadata(questId, metadata),
    error: isFailed ? item.output || item.content : undefined,
  }

  return {
    id: item.toolCallId || item.id,
    type: item.label,
    seq,
    ts: timestamp,
    content: toolContent,
  }
}

function buildStatusMessage(
  item: Extract<FeedItem, { type: 'event' }>,
  questId: string,
  seq: number
): ChatMessageItem {
  const timestamp = toTimestamp(item.createdAt)
  const content: StatusContent = {
    timestamp,
    content: item.content ? `${item.label}: ${item.content}` : item.label,
    status: item.label,
    metadata: buildMetadata(questId, {
      sender_type: 'system',
      sender_label: 'DeepScientist',
      sender_name: 'DeepScientist',
      message_kind: 'status',
    }),
  }
  return {
    id: item.id,
    type: 'status',
    seq,
    ts: timestamp,
    content,
  }
}

export function adaptQuestFeedToChatMessages(
  questId: string,
  feed: FeedItem[],
  surface: QuestChatSurface
) {
  const messages: ChatMessageItem[] = []
  let seq = 0
  const finalAssistantTexts = new Set(
    feed
      .filter(
        (item): item is Extract<FeedItem, { type: 'message' }> =>
          item.type === 'message' &&
          item.role === 'assistant' &&
          item.eventType === 'conversation.message' &&
          Boolean(item.content.trim())
      )
      .map((item) => normalizeComparableText(item.content))
  )

  for (const item of feed) {
    seq += 1
    if (item.type === 'message') {
      if (shouldRenderAsReasoning(item)) {
        if (!finalAssistantTexts.has(normalizeComparableText(item.content))) {
          messages.push(buildReasoningMessage(item, questId, seq))
        }
        continue
      }
      messages.push(buildTextMessage(item, questId, seq))
      continue
    }
    if (item.type === 'artifact') {
      if (surface === 'studio' || shouldRenderArtifactInChat(item)) {
        messages.push(buildArtifactMessage(item, questId, seq))
      }
      continue
    }
    if (item.type === 'operation') {
      messages.push(buildToolMessage(item, questId, seq))
      continue
    }
    if (surface === 'studio' && item.type === 'event') {
      messages.push(buildStatusMessage(item, questId, seq))
    }
  }

  return messages
}
