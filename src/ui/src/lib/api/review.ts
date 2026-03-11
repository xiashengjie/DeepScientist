import { apiClient } from '@/lib/api/client'
import type { UILanguage } from '@/lib/i18n/types'
import type {
  ReviewChatModel,
  ReviewAnnotationAgentControlResponse,
  ReviewAnnotationAgentEventsResponse,
  ReviewAnnotationAgentStartResponse,
  ReviewAnnotationAgentStatusResponse,
  ReviewMarkdownReparseResponse,
  ReviewEventsResponse,
  ReviewQueueStatusResponse,
  ReviewProviderConfigResponse,
  ReviewResultResponse,
  ReviewResultExportStatusResponse,
  ReviewShareLink,
  ReviewShareValidationResponse,
  ReviewSharedResultResponse,
  ReviewRunCreateResponse,
  ReviewRunStatusResponse,
  ReviewWorkspaceCreateResponse,
  ReviewWorkspaceDetailResponse,
  ReviewWorkspaceListResponse,
} from '@/lib/types/review'

const API_PREFIX = '/api/v1/review'
const REVIEW_EXPORT_TIMEOUT_MS = 180_000
const REVIEW_WORKSPACE_UPLOAD_TIMEOUT_MS = 160_000

export interface ReviewExportPayload {
  blob: Blob
  filename: string
  contentType: string
}

export async function listReviewWorkspaces(params?: {
  skip?: number
  limit?: number
}): Promise<ReviewWorkspaceListResponse> {
  const response = await apiClient.get<ReviewWorkspaceListResponse>(`${API_PREFIX}/workspaces`, { params })
  return response.data
}

export async function createReviewWorkspace(input: {
  file: File
  title?: string
  novelty_check_end_date?: string
  chat_model?: ReviewChatModel
  client_request_id?: string
  confirmation_token?: string
  onUploadProgress?: (progress: number) => void
}): Promise<ReviewWorkspaceCreateResponse> {
  const form = new FormData()
  form.append('pdf_file', input.file)
  if (input.title) form.append('title', input.title)
  if (input.novelty_check_end_date) form.append('novelty_check_end_date', input.novelty_check_end_date)
  if (input.chat_model) form.append('chat_model', input.chat_model)
  if (input.client_request_id) form.append('client_request_id', input.client_request_id)
  if (input.confirmation_token) form.append('confirmation_token', input.confirmation_token)

  const response = await apiClient.post<ReviewWorkspaceCreateResponse>(`${API_PREFIX}/workspaces`, form, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: REVIEW_WORKSPACE_UPLOAD_TIMEOUT_MS,
    onUploadProgress: (event) => {
      if (!input.onUploadProgress || !event.total) return
      const progress = Math.round((event.loaded * 100) / event.total)
      input.onUploadProgress(Math.min(100, Math.max(0, progress)))
    },
  })
  return response.data
}

export async function getReviewWorkspace(workspaceId: string): Promise<ReviewWorkspaceDetailResponse> {
  const response = await apiClient.get<ReviewWorkspaceDetailResponse>(`${API_PREFIX}/workspaces/${workspaceId}`)
  return response.data
}

export async function deleteReviewWorkspace(workspaceId: string): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ success: boolean }>(`${API_PREFIX}/workspaces/${workspaceId}`)
  return response.data
}

export async function restartReviewRun(input: {
  workspace_id: string
  client_request_id?: string
  confirmation_token?: string
}): Promise<ReviewRunCreateResponse> {
  const form = new FormData()
  if (input.client_request_id) form.append('client_request_id', input.client_request_id)
  if (input.confirmation_token) form.append('confirmation_token', input.confirmation_token)

  const response = await apiClient.post<ReviewRunCreateResponse>(
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

export async function getLatestReviewRunStatus(
  workspaceId: string
): Promise<ReviewRunStatusResponse> {
  const response = await apiClient.get<ReviewRunStatusResponse>(
    `${API_PREFIX}/workspaces/${workspaceId}/runs/latest`
  )
  return response.data
}

export async function getReviewQueueStatus(input: {
  workspace_id: string
  run_id?: string
}): Promise<ReviewQueueStatusResponse> {
  const response = await apiClient.get<ReviewQueueStatusResponse>(
    `${API_PREFIX}/workspaces/${input.workspace_id}/queue-status`,
    {
      params: input.run_id ? { run_id: input.run_id } : undefined,
    }
  )
  return response.data
}

export async function getReviewAnnotationAgentStatus(
  workspaceId: string
): Promise<ReviewAnnotationAgentStatusResponse> {
  const response = await apiClient.get<ReviewAnnotationAgentStatusResponse>(
    `${API_PREFIX}/workspaces/${workspaceId}/annotation-agent`
  )
  return response.data
}

export async function startReviewAnnotationAgent(
  workspaceId: string,
  input?: {
    client_request_id?: string
    confirmation_token?: string
    ui_language?: UILanguage
  }
): Promise<ReviewAnnotationAgentStartResponse> {
  const form = new FormData()
  if (input?.client_request_id) form.append('client_request_id', input.client_request_id)
  if (input?.confirmation_token) form.append('confirmation_token', input.confirmation_token)
  if (input?.ui_language) form.append('ui_language', input.ui_language)

  const response = await apiClient.post<ReviewAnnotationAgentStartResponse>(
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

export async function controlReviewAnnotationAgent(input: {
  workspace_id: string
  action: 'stop'
}): Promise<ReviewAnnotationAgentControlResponse> {
  const response = await apiClient.post<ReviewAnnotationAgentControlResponse>(
    `${API_PREFIX}/workspaces/${input.workspace_id}/annotation-agent/control`,
    {
      action: input.action,
    }
  )
  return response.data
}

export async function listReviewAnnotationAgentEvents(input: {
  workspace_id: string
  after_seq?: number
  limit?: number
}): Promise<ReviewAnnotationAgentEventsResponse> {
  const response = await apiClient.get<ReviewAnnotationAgentEventsResponse>(
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

export async function listReviewRunEvents(input: {
  workspace_id: string
  run_id: string
  after_seq?: number
  limit?: number
}): Promise<ReviewEventsResponse> {
  const response = await apiClient.get<ReviewEventsResponse>(
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

export async function getReviewResult(input: {
  workspace_id: string
  run_id?: string
}): Promise<ReviewResultResponse> {
  const response = await apiClient.get<ReviewResultResponse>(
    `${API_PREFIX}/workspaces/${input.workspace_id}/result`,
    {
      params: input.run_id ? { run_id: input.run_id } : undefined,
    }
  )
  return response.data
}

export async function getReviewResultExportStatus(input: {
  workspace_id: string
  run_id?: string
}): Promise<ReviewResultExportStatusResponse> {
  const response = await apiClient.get<ReviewResultExportStatusResponse>(
    `${API_PREFIX}/workspaces/${input.workspace_id}/result/export-status`,
    {
      params: input.run_id ? { run_id: input.run_id } : undefined,
    }
  )
  return response.data
}

export async function retryReviewResultExport(input: {
  workspace_id: string
  run_id?: string
}): Promise<ReviewResultExportStatusResponse> {
  const response = await apiClient.post<ReviewResultExportStatusResponse>(
    `${API_PREFIX}/workspaces/${input.workspace_id}/result/export/retry`,
    undefined,
    {
      params: input.run_id ? { run_id: input.run_id } : undefined,
    }
  )
  return response.data
}

export function buildReviewPdfUrl(workspaceId: string): string {
  return `${API_PREFIX}/workspaces/${workspaceId}/pdf`
}


export async function getReviewPdfBlob(workspaceId: string): Promise<Blob> {
  const response = await apiClient.get(`${API_PREFIX}/workspaces/${workspaceId}/pdf`, {
    responseType: 'blob',
    timeout: REVIEW_EXPORT_TIMEOUT_MS,
  })
  return response.data as Blob
}

export function buildReviewMarkdownUrl(workspaceId: string): string {
  return `${API_PREFIX}/workspaces/${workspaceId}/markdown`
}

export async function getReviewMarkdown(workspaceId: string): Promise<string> {
  const response = await apiClient.get(`${API_PREFIX}/workspaces/${workspaceId}/markdown`, {
    responseType: 'text',
  })
  return typeof response.data === 'string' ? response.data : String(response.data ?? '')
}

export async function restartReviewMarkdownParse(
  workspaceId: string
): Promise<ReviewMarkdownReparseResponse> {
  const response = await apiClient.post<ReviewMarkdownReparseResponse>(
    `${API_PREFIX}/workspaces/${workspaceId}/markdown/reparse`
  )
  return response.data
}

export async function getReviewProviderConfig(): Promise<ReviewProviderConfigResponse> {
  const response = await apiClient.get<ReviewProviderConfigResponse>(`${API_PREFIX}/provider-config`)
  return response.data
}

export async function exportReviewResult(input: {
  workspace_id: string
  run_id?: string
  format?: 'json' | 'markdown' | 'pdf'
}): Promise<ReviewExportPayload> {
  const response = await apiClient.get(`${API_PREFIX}/workspaces/${input.workspace_id}/result/export`, {
    params: {
      ...(input.run_id ? { run_id: input.run_id } : {}),
      export_format: input.format || 'json',
    },
    responseType: 'blob',
    timeout: REVIEW_EXPORT_TIMEOUT_MS,
  })

  const contentDisposition = String(response.headers?.['content-disposition'] || '')
  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/)
  const fallbackExt = input.format === 'markdown' ? 'md' : input.format === 'pdf' ? 'pdf' : 'json'
  const filename = filenameMatch?.[1] || `review-result.${fallbackExt}`

  return {
    blob: response.data as Blob,
    filename,
    contentType: String(response.headers?.['content-type'] || ''),
  }
}



export async function listReviewShareLinks(workspaceId: string): Promise<ReviewShareLink[]> {
  const response = await apiClient.get<{ items: ReviewShareLink[] }>(
    `${API_PREFIX}/workspaces/${workspaceId}/share-links`
  )
  return response.data.items || []
}

export async function createReviewShareLink(input: {
  workspace_id: string
  expires_at?: string | null
}): Promise<ReviewShareLink> {
  const response = await apiClient.post<ReviewShareLink>(
    `${API_PREFIX}/workspaces/${input.workspace_id}/share-links`,
    {
      expires_at: input.expires_at ?? null,
    }
  )
  return response.data
}

export async function updateReviewShareLink(input: {
  workspace_id: string
  link_id: string
  is_active?: boolean
  expires_at?: string | null
}): Promise<ReviewShareLink> {
  const response = await apiClient.patch<ReviewShareLink>(
    `${API_PREFIX}/workspaces/${input.workspace_id}/share-links/${input.link_id}`,
    {
      ...(typeof input.is_active === 'boolean' ? { is_active: input.is_active } : {}),
      ...(input.expires_at !== undefined ? { expires_at: input.expires_at } : {}),
    }
  )
  return response.data
}

export async function regenerateReviewShareLink(input: {
  workspace_id: string
  link_id: string
}): Promise<ReviewShareLink> {
  const response = await apiClient.post<ReviewShareLink>(
    `${API_PREFIX}/workspaces/${input.workspace_id}/share-links/${input.link_id}/regenerate`
  )
  return response.data
}

export async function validateReviewShareToken(token: string): Promise<ReviewShareValidationResponse> {
  const response = await apiClient.get<ReviewShareValidationResponse>(`${API_PREFIX}/share/${token}`)
  return response.data
}

export async function getSharedReviewResult(token: string): Promise<ReviewSharedResultResponse> {
  const response = await apiClient.get<ReviewSharedResultResponse>(`${API_PREFIX}/share/${token}/result`)
  return response.data
}

export async function getSharedReviewResultExportStatus(token: string): Promise<ReviewResultExportStatusResponse> {
  const response = await apiClient.get<ReviewResultExportStatusResponse>(
    `${API_PREFIX}/share/${token}/result/export-status`
  )
  return response.data
}

export async function retrySharedReviewResultExport(token: string): Promise<ReviewResultExportStatusResponse> {
  const response = await apiClient.post<ReviewResultExportStatusResponse>(
    `${API_PREFIX}/share/${token}/result/export/retry`
  )
  return response.data
}

export async function getSharedReviewPdfBlob(token: string): Promise<Blob> {
  const response = await apiClient.get(`${API_PREFIX}/share/${token}/pdf`, {
    responseType: 'blob',
    timeout: REVIEW_EXPORT_TIMEOUT_MS,
  })
  return response.data as Blob
}

export async function exportSharedReviewResult(input: {
  token: string
  format?: 'json' | 'pdf'
}): Promise<ReviewExportPayload> {
  const response = await apiClient.get(`${API_PREFIX}/share/${input.token}/result/export`, {
    params: {
      export_format: input.format || 'json',
    },
    responseType: 'blob',
    timeout: REVIEW_EXPORT_TIMEOUT_MS,
  })

  const contentDisposition = String(response.headers?.['content-disposition'] || '')
  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/)
  const fallbackExt = input.format === 'pdf' ? 'pdf' : 'json'
  const filename = filenameMatch?.[1] || `shared-review-result.${fallbackExt}`

  return {
    blob: response.data as Blob,
    filename,
    contentType: String(response.headers?.['content-type'] || ''),
  }
}
