import { apiClient } from '@/lib/api/client'
import type {
  BashLogEntry,
  BashLogMeta,
  BashSession,
  BashStopResponse,
  BashTranscriptPage,
} from '@/lib/types/bash'

export async function listBashSessions(
  projectId: string,
  params?: {
    status?: string
    agentInstanceIds?: string[]
    agentIds?: string[]
    chatSessionId?: string
    limit?: number
  }
) {
  const response = await apiClient.get(`/api/quests/${projectId}/bash/sessions`, {
    params: {
      status: params?.status,
      agent_instance_ids: params?.agentInstanceIds?.length
        ? params.agentInstanceIds.join(',')
        : undefined,
      agent_ids: params?.agentIds?.length ? params.agentIds.join(',') : undefined,
      chat_session_id: params?.chatSessionId,
      limit: params?.limit,
    },
  })
  return response.data as BashSession[]
}

export async function getBashSession(projectId: string, bashId: string) {
  const response = await apiClient.get(`/api/quests/${projectId}/bash/sessions/${bashId}`)
  return response.data as BashSession
}

export async function getBashLogs(
  projectId: string,
  bashId: string,
  params?: {
    limit?: number
    beforeSeq?: number | null
    order?: 'asc' | 'desc'
  }
) {
  const response = await apiClient.get(`/api/quests/${projectId}/bash/sessions/${bashId}/logs`, {
    params: {
      limit: params?.limit,
      before_seq: params?.beforeSeq ?? undefined,
      order: params?.order ?? undefined,
    },
  })
  const parseHeaderNumber = (value: string | undefined) => {
    if (!value) return null
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : null
  }
  const headers = response.headers ?? {}
  const meta: BashLogMeta = {
    tailLimit: parseHeaderNumber(headers['x-bash-log-tail-limit']),
    tailStartSeq: parseHeaderNumber(headers['x-bash-log-tail-start-seq']),
    latestSeq: parseHeaderNumber(headers['x-bash-log-latest-seq']),
  }
  return { entries: response.data as BashLogEntry[], meta }
}

export async function getBashTranscriptPage(
  projectId: string,
  params: {
    page: number
    pageSize?: number
    bashIds?: string[]
    chatSessionId?: string
    bashId?: string
  }
) {
  const response = await apiClient.get(`/api/quests/${projectId}/bash/transcript`, {
    params: {
      page: params.page,
      page_size: params.pageSize,
      bash_ids: params.bashIds?.length ? params.bashIds.join(',') : undefined,
      chat_session_id: params.chatSessionId,
      bash_id: params.bashId,
    },
  })
  return response.data as BashTranscriptPage
}

export async function stopBashSession(projectId: string, bashId: string, reason?: string) {
  const response = await apiClient.post(`/api/quests/${projectId}/bash/sessions/${bashId}/stop`, {
    reason,
  })
  return response.data as BashStopResponse
}
