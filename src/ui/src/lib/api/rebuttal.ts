import { apiClient } from '@/lib/api/client'
import type { UILanguage } from '@/lib/i18n/types'
import type {
  RebuttalAnnotationAgentControlResponse,
  RebuttalAnnotationAgentEventsResponse,
  RebuttalAnnotationAgentStartResponse,
  RebuttalAnnotationAgentStatusResponse,
  RebuttalMarkdownReparseResponse,
  RebuttalEventsResponse,
  RebuttalQueueStatusResponse,
  RebuttalResultResponse,
  RebuttalResultExportStatusResponse,
  RebuttalShareLink,
  RebuttalShareValidationResponse,
  RebuttalSharedResultResponse,
  RebuttalRunCreateResponse,
  RebuttalRunStatusResponse,
  RebuttalWorkspaceCreateResponse,
  RebuttalWorkspaceDetailResponse,
  RebuttalWorkspaceListResponse,
  RebuttalChatModel,
} from '@/lib/types/rebuttal'

const API_PREFIX = '/api/v1/rebuttal'
const REBUTTAL_EXPORT_TIMEOUT_MS = 180_000

export interface RebuttalExportPayload {
  blob: Blob
  filename: string
  contentType: string
}

export async function listRebuttalWorkspaces(params?: {
  skip?: number
  limit?: number
}): Promise<RebuttalWorkspaceListResponse> {
  const response = await apiClient.get<RebuttalWorkspaceListResponse>(`${API_PREFIX}/workspaces`, { params })
  return response.data
}

export async function createRebuttalWorkspace(input: {
  file: File
  review_comments_file?: File
  title?: string
  novelty_check_end_date?: string
  chat_model?: RebuttalChatModel
  client_request_id?: string
  confirmation_token?: string
}): Promise<RebuttalWorkspaceCreateResponse> {
  const form = new FormData()
  form.append('pdf_file', input.file)
  if (input.review_comments_file) form.append('review_comments_file', input.review_comments_file)
  if (input.title) form.append('title', input.title)
  if (input.novelty_check_end_date) form.append('novelty_check_end_date', input.novelty_check_end_date)
  if (input.chat_model) form.append('chat_model', input.chat_model)
  if (input.client_request_id) form.append('client_request_id', input.client_request_id)
  if (input.confirmation_token) form.append('confirmation_token', input.confirmation_token)

  const response = await apiClient.post<RebuttalWorkspaceCreateResponse>(`${API_PREFIX}/workspaces`, form, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export async function getRebuttalWorkspace(workspaceId: string): Promise<RebuttalWorkspaceDetailResponse> {
  const response = await apiClient.get<RebuttalWorkspaceDetailResponse>(`${API_PREFIX}/workspaces/${workspaceId}`)
  return response.data
}

export async function deleteRebuttalWorkspace(workspaceId: string): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ success: boolean }>(`${API_PREFIX}/workspaces/${workspaceId}`)
  return response.data
}

export async function restartRebuttalRun(input: {
  workspace_id: string
  client_request_id?: string
  confirmation_token?: string
}): Promise<RebuttalRunCreateResponse> {
  const form = new FormData()
  if (input.client_request_id) form.append('client_request_id', input.client_request_id)
  if (input.confirmation_token) form.append('confirmation_token', input.confirmation_token)

  const response = await apiClient.post<RebuttalRunCreateResponse>(
    `${API_PREFIX}/workspaces/${input.workspace_id}/runs`,
    form,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  return response.data
}

export async function getLatestRebuttalRunStatus(
  workspaceId: string
): Promise<RebuttalRunStatusResponse> {
  const response = await apiClient.get<RebuttalRunStatusResponse>(
    `${API_PREFIX}/workspaces/${workspaceId}/runs/latest`
  )
  return response.data
}

export async function getRebuttalQueueStatus(input: {
  workspace_id: string
  run_id?: string
}): Promise<RebuttalQueueStatusResponse> {
  const response = await apiClient.get<RebuttalQueueStatusResponse>(
    `${API_PREFIX}/workspaces/${input.workspace_id}/queue-status`,
    {
      params: input.run_id ? { run_id: input.run_id } : undefined,
    }
  )
  return response.data
}

export async function getRebuttalAnnotationAgentStatus(
  workspaceId: string
): Promise<RebuttalAnnotationAgentStatusResponse> {
  const response = await apiClient.get<RebuttalAnnotationAgentStatusResponse>(
    `${API_PREFIX}/workspaces/${workspaceId}/annotation-agent`
  )
  return response.data
}

export async function startRebuttalAnnotationAgent(
  workspaceId: string,
  input?: {
    client_request_id?: string
    confirmation_token?: string
    ui_language?: UILanguage
  }
): Promise<RebuttalAnnotationAgentStartResponse> {
  const form = new FormData()
  if (input?.client_request_id) form.append('client_request_id', input.client_request_id)
  if (input?.confirmation_token) form.append('confirmation_token', input.confirmation_token)
  if (input?.ui_language) form.append('ui_language', input.ui_language)

  const response = await apiClient.post<RebuttalAnnotationAgentStartResponse>(
    `${API_PREFIX}/workspaces/${workspaceId}/annotation-agent/start`,
    form,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  return response.data
}

export async function controlRebuttalAnnotationAgent(input: {
  workspace_id: string
  action: 'stop'
}): Promise<RebuttalAnnotationAgentControlResponse> {
  const response = await apiClient.post<RebuttalAnnotationAgentControlResponse>(
    `${API_PREFIX}/workspaces/${input.workspace_id}/annotation-agent/control`,
    {
      action: input.action,
    }
  )
  return response.data
}

export async function listRebuttalAnnotationAgentEvents(input: {
  workspace_id: string
  after_seq?: number
  limit?: number
}): Promise<RebuttalAnnotationAgentEventsResponse> {
  const response = await apiClient.get<RebuttalAnnotationAgentEventsResponse>(
    `${API_PREFIX}/workspaces/${input.workspace_id}/annotation-agent/events`,
    {
      params: {
        after_seq: input.after_seq ?? 0,
        limit: input.limit ?? 200,
      },
    }
  )
  return response.data
}

export async function listRebuttalRunEvents(input: {
  workspace_id: string
  run_id: string
  after_seq?: number
  limit?: number
}): Promise<RebuttalEventsResponse> {
  const response = await apiClient.get<RebuttalEventsResponse>(
    `${API_PREFIX}/workspaces/${input.workspace_id}/runs/${input.run_id}/events`,
    {
      params: {
        after_seq: input.after_seq ?? 0,
        limit: input.limit ?? 200,
      },
    }
  )
  return response.data
}

export async function getRebuttalResult(input: {
  workspace_id: string
  run_id?: string
}): Promise<RebuttalResultResponse> {
  const response = await apiClient.get<RebuttalResultResponse>(
    `${API_PREFIX}/workspaces/${input.workspace_id}/result`,
    {
      params: input.run_id ? { run_id: input.run_id } : undefined,
    }
  )
  return response.data
}

export async function getRebuttalResultExportStatus(input: {
  workspace_id: string
  run_id?: string
}): Promise<RebuttalResultExportStatusResponse> {
  const response = await apiClient.get<RebuttalResultExportStatusResponse>(
    `${API_PREFIX}/workspaces/${input.workspace_id}/result/export-status`,
    {
      params: input.run_id ? { run_id: input.run_id } : undefined,
    }
  )
  return response.data
}

export async function retryRebuttalResultExport(input: {
  workspace_id: string
  run_id?: string
}): Promise<RebuttalResultExportStatusResponse> {
  const response = await apiClient.post<RebuttalResultExportStatusResponse>(
    `${API_PREFIX}/workspaces/${input.workspace_id}/result/export/retry`,
    undefined,
    {
      params: input.run_id ? { run_id: input.run_id } : undefined,
    }
  )
  return response.data
}

export function buildRebuttalPdfUrl(workspaceId: string): string {
  return `${API_PREFIX}/workspaces/${workspaceId}/pdf`
}


export async function getRebuttalPdfBlob(workspaceId: string): Promise<Blob> {
  const response = await apiClient.get(`${API_PREFIX}/workspaces/${workspaceId}/pdf`, {
    responseType: 'blob',
    timeout: REBUTTAL_EXPORT_TIMEOUT_MS,
  })
  return response.data as Blob
}

export function buildRebuttalMarkdownUrl(workspaceId: string): string {
  return `${API_PREFIX}/workspaces/${workspaceId}/markdown`
}

export async function getRebuttalMarkdown(workspaceId: string): Promise<string> {
  const response = await apiClient.get(`${API_PREFIX}/workspaces/${workspaceId}/markdown`, {
    responseType: 'text',
  })
  return typeof response.data === 'string' ? response.data : String(response.data ?? '')
}

export async function restartRebuttalMarkdownParse(
  workspaceId: string
): Promise<RebuttalMarkdownReparseResponse> {
  const response = await apiClient.post<RebuttalMarkdownReparseResponse>(
    `${API_PREFIX}/workspaces/${workspaceId}/markdown/reparse`
  )
  return response.data
}

export async function exportRebuttalResult(input: {
  workspace_id: string
  run_id?: string
  format?: 'json' | 'markdown' | 'pdf'
}): Promise<RebuttalExportPayload> {
  const response = await apiClient.get(`${API_PREFIX}/workspaces/${input.workspace_id}/result/export`, {
    params: {
      ...(input.run_id ? { run_id: input.run_id } : {}),
      export_format: input.format || 'json',
    },
    responseType: 'blob',
    timeout: REBUTTAL_EXPORT_TIMEOUT_MS,
  })

  const contentDisposition = String(response.headers?.['content-disposition'] || '')
  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/)
  const fallbackExt = input.format === 'markdown' ? 'md' : input.format === 'pdf' ? 'pdf' : 'json'
  const filename = filenameMatch?.[1] || `rebuttal-result.${fallbackExt}`

  return {
    blob: response.data as Blob,
    filename,
    contentType: String(response.headers?.['content-type'] || ''),
  }
}



export async function listRebuttalShareLinks(workspaceId: string): Promise<RebuttalShareLink[]> {
  const response = await apiClient.get<{ items: RebuttalShareLink[] }>(
    `${API_PREFIX}/workspaces/${workspaceId}/share-links`
  )
  return response.data.items || []
}

export async function createRebuttalShareLink(input: {
  workspace_id: string
  expires_at?: string | null
}): Promise<RebuttalShareLink> {
  const response = await apiClient.post<RebuttalShareLink>(
    `${API_PREFIX}/workspaces/${input.workspace_id}/share-links`,
    {
      expires_at: input.expires_at ?? null,
    }
  )
  return response.data
}

export async function updateRebuttalShareLink(input: {
  workspace_id: string
  link_id: string
  is_active?: boolean
  expires_at?: string | null
}): Promise<RebuttalShareLink> {
  const response = await apiClient.patch<RebuttalShareLink>(
    `${API_PREFIX}/workspaces/${input.workspace_id}/share-links/${input.link_id}`,
    {
      ...(typeof input.is_active === 'boolean' ? { is_active: input.is_active } : {}),
      ...(input.expires_at !== undefined ? { expires_at: input.expires_at } : {}),
    }
  )
  return response.data
}

export async function regenerateRebuttalShareLink(input: {
  workspace_id: string
  link_id: string
}): Promise<RebuttalShareLink> {
  const response = await apiClient.post<RebuttalShareLink>(
    `${API_PREFIX}/workspaces/${input.workspace_id}/share-links/${input.link_id}/regenerate`
  )
  return response.data
}

export async function validateRebuttalShareToken(token: string): Promise<RebuttalShareValidationResponse> {
  const response = await apiClient.get<RebuttalShareValidationResponse>(`${API_PREFIX}/share/${token}`)
  return response.data
}

export async function getSharedRebuttalResult(token: string): Promise<RebuttalSharedResultResponse> {
  const response = await apiClient.get<RebuttalSharedResultResponse>(`${API_PREFIX}/share/${token}/result`)
  return response.data
}

export async function getSharedRebuttalResultExportStatus(token: string): Promise<RebuttalResultExportStatusResponse> {
  const response = await apiClient.get<RebuttalResultExportStatusResponse>(
    `${API_PREFIX}/share/${token}/result/export-status`
  )
  return response.data
}

export async function retrySharedRebuttalResultExport(token: string): Promise<RebuttalResultExportStatusResponse> {
  const response = await apiClient.post<RebuttalResultExportStatusResponse>(
    `${API_PREFIX}/share/${token}/result/export/retry`
  )
  return response.data
}

export async function getSharedRebuttalPdfBlob(token: string): Promise<Blob> {
  const response = await apiClient.get(`${API_PREFIX}/share/${token}/pdf`, {
    responseType: 'blob',
    timeout: REBUTTAL_EXPORT_TIMEOUT_MS,
  })
  return response.data as Blob
}

export async function exportSharedRebuttalResult(input: {
  token: string
  format?: 'json' | 'pdf'
}): Promise<RebuttalExportPayload> {
  const response = await apiClient.get(`${API_PREFIX}/share/${input.token}/result/export`, {
    params: {
      export_format: input.format || 'json',
    },
    responseType: 'blob',
    timeout: REBUTTAL_EXPORT_TIMEOUT_MS,
  })

  const contentDisposition = String(response.headers?.['content-disposition'] || '')
  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/)
  const fallbackExt = input.format === 'pdf' ? 'pdf' : 'json'
  const filename = filenameMatch?.[1] || `shared-rebuttal-result.${fallbackExt}`

  return {
    blob: response.data as Blob,
    filename,
    contentType: String(response.headers?.['content-type'] || ''),
  }
}
