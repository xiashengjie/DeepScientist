import { apiClient } from '@/lib/api/client'

const AUTOFIGURE_EXPORT_TIMEOUT_MS = 80_000
const AUTOFIGURE_PDF_PARSE_TIMEOUT_MS = 160_000
const AUTOFIGURE_SESSION_RUN_TIMEOUT_MS = 180_000

export type AutoFigureEditWorkspace = {
  id: string
  name: string
  description?: string | null
}

export type AutoFigureEditWorkspaceEntry = {
  workspace_id: string
  workspace_name: string
  workspace_description?: string | null
  resolved_session_id?: string | null
  resolved_session_status?: string | null
  has_session: boolean
}

export type AutoFigureEditWorkspaceListItem = AutoFigureEditWorkspace & {
  updated_at?: string | null
  thumbnail_file_id?: string | null
  thumbnail_url?: string | null
  last_session_id?: string | null
  last_session_status?: string | null
}

export type AutoFigureEditWorkspaceListResponse = {
  items: AutoFigureEditWorkspaceListItem[]
}

export type AutoFigureEditWorkspaceCreatePayload = {
  name?: string
  description?: string
}

export type AutoFigureEditReferenceUpload = {
  file_id: string
  name: string
  mime_type?: string | null
  size?: number
  path: string
  url: string
}

export type AutoFigureEditPdfParseResponse = {
  text: string
  page_count: number
  char_count: number
  truncated: boolean
}

export type AutoFigureEditStylePreset = {
  id: string
  code: string
  name_en: string
  name_zh?: string | null
  description_en?: string | null
  description_zh?: string | null
  warning_en?: string | null
  warning_zh?: string | null
  preview_image_url: string
  reference_asset_name: string
  aliases: string[]
  badge_type?: string
  badge_text_en?: string | null
  badge_text_zh?: string | null
  sort_order: number
  is_default: boolean
}

export type AutoFigureEditStylePresetListResponse = {
  items: AutoFigureEditStylePreset[]
}

export type AutoFigureEditRuntimeDefaultsResponse = {
  default_model: string
  default_image_model: string
  default_svg_model: string
  openrouter_base_url: string
  runtime_service_enabled: boolean
  deepscientist_cost_1k: number
  deepscientist_cost_2k: number
  deepscientist_cost_4k: number
}

export type AutoFigureEditSessionConfig = {
  provider: 'google'
  google_api_interface?: 'vertex' | 'ai_studio'
  style_preset?: string
  base_url?: string
  image_model?: string
  svg_model?: string
  sam_backend?: string
  optimize_iterations?: number
  reference_file_id?: string
}

export type AutoFigureEditSessionCreatePayload = {
  input_content: string
  input_type?: 'text'
  workspace_id: string
  project_id?: string
  config: AutoFigureEditSessionConfig
}

export type AutoFigureEditSessionRunPayload = {
  client_request_id?: string
  confirmation_token?: string
  runtime_provider?: 'deepscientist' | 'openrouter' | 'custom'
  runtime_resolution?: '1K' | '2K' | '4K'
  runtime_base_url?: string
  runtime_model?: string
  runtime_image_model?: string
  runtime_svg_model?: string
  use_user_api_key?: boolean
  user_api_key?: string
}

export type AutoFigureEditSessionRunResponse = {
  session_id: string
  status: string
  points_estimated_cost?: number
  points_actual_cost?: number
  points_balance_after?: number
  points_settlement_status?: 'previewed' | 'charged' | 'failed' | 'refunded' | string
  queue_position?: number
  queue_ahead_count?: number
  queue_total_count?: number
  estimated_wait_seconds?: number
}

export type AutoFigureEditQueueStatusResponse = {
  session_id: string
  status: string
  retryable?: boolean
  queue_position?: number
  queue_ahead_count?: number
  queue_total_count?: number
  estimated_wait_seconds?: number
  average_runtime_seconds?: number
}

export type AutoFigureDownloadFeedbackFigureRating = {
  scientific_semantic_correctness: number
  information_completeness: number
  visual_presentation_quality: number
  style_consistency: number
  usability: 0 | 1
  critical_scientific_error: 0 | 1
}

export type AutoFigureDownloadFeedbackSvgConversionRating = {
  conversion_correctness: number
}

export type AutoFigureDownloadFeedbackPayload = {
  figure: AutoFigureDownloadFeedbackFigureRating
  svg_conversion: AutoFigureDownloadFeedbackSvgConversionRating
  figure_file_id?: string
  final_svg_file_id?: string
  feedback_comment?: string
}

export type AutoFigureDownloadFeedbackResponse = {
  success: boolean
  session_id: string
  submitted_at: string
}

export type AutoFigureEditExportReadinessResponse = {
  session_id: string
  feedback_submitted: boolean
  can_submit_feedback: boolean
  can_export_pdf: boolean
  can_export_bundle: boolean
  message?: string | null
}

export type AutoFigureEditPdfExportPayload = {
  svg_content: string
  selection_only?: boolean
}

export type AutoFigureEditSessionRevisionSummary = {
  revision_id: string
  session_id: string
  seq: number
  parent_revision_id?: string | null
  source: string
  action?: string | null
  client_edit_id?: string | null
  svg_sha256: string
  svg_size: number
  created_at?: string | null
}

export type AutoFigureEditSessionRevisionDetail = AutoFigureEditSessionRevisionSummary & {
  svg_content: string
  metadata: Record<string, unknown>
}

export type AutoFigureEditSessionRevisionListResponse = {
  session_id: string
  total: number
  items: AutoFigureEditSessionRevisionSummary[]
}

export type AutoFigureEditSessionRevisionCommitPayload = {
  svg_content: string
  base_revision_id?: string
  client_edit_id?: string
  action?: string
  metadata?: Record<string, unknown>
}

export type AutoFigureEditSessionRevisionCommitResponse = {
  created: boolean
  revision: AutoFigureEditSessionRevisionSummary
}

export async function listAutoFigureEditWorkspaces(): Promise<AutoFigureEditWorkspaceListItem[]> {
  const response = await apiClient.get('/api/v1/autofigure-edit/workspaces')
  const payload = response.data as AutoFigureEditWorkspaceListResponse
  return payload.items || []
}

export async function createAutoFigureEditWorkspace(
  payload: AutoFigureEditWorkspaceCreatePayload = {}
): Promise<AutoFigureEditWorkspace> {
  const response = await apiClient.post('/api/v1/autofigure-edit/workspaces', payload)
  return response.data as AutoFigureEditWorkspace
}

export async function deleteAutoFigureEditWorkspace(workspaceId: string): Promise<void> {
  await apiClient.delete(`/api/v1/autofigure-edit/workspaces/${workspaceId}`)
}

export async function ensureAutoFigureEditWorkspace(): Promise<AutoFigureEditWorkspace> {
  const response = await apiClient.post('/api/v1/autofigure-edit/workspace/ensure')
  return response.data as AutoFigureEditWorkspace
}

export async function getAutoFigureEditWorkspace(
  workspaceId: string
): Promise<AutoFigureEditWorkspace> {
  const response = await apiClient.get(`/api/v1/autofigure-edit/workspace/${workspaceId}`)
  return response.data as AutoFigureEditWorkspace
}

export async function getAutoFigureEditWorkspaceEntry(
  workspaceId: string
): Promise<AutoFigureEditWorkspaceEntry> {
  const response = await apiClient.get(`/api/v1/autofigure-edit/workspace/${workspaceId}/entry`)
  return response.data as AutoFigureEditWorkspaceEntry
}

export async function uploadAutoFigureEditReference(
  workspaceId: string,
  file: File
): Promise<AutoFigureEditReferenceUpload> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post(
    `/api/v1/autofigure-edit/workspace/${workspaceId}/reference`,
    formData,
    {
      headers: {
        'Content-Type': undefined,
      },
    }
  )
  return response.data as AutoFigureEditReferenceUpload
}

export async function parseAutoFigureEditPdf(
  file: File,
  options?: {
    onUploadProgress?: (progress: number) => void
  }
): Promise<AutoFigureEditPdfParseResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post('/api/v1/autofigure-edit/pdf/parse', formData, {
    headers: {
      'Content-Type': undefined,
    },
    timeout: AUTOFIGURE_PDF_PARSE_TIMEOUT_MS,
    onUploadProgress: (event) => {
      if (!options?.onUploadProgress || !event.total) return
      const percent = Math.round((event.loaded * 100) / event.total)
      options.onUploadProgress(Math.min(100, Math.max(0, percent)))
    },
  })
  return response.data as AutoFigureEditPdfParseResponse
}

export async function listAutoFigureEditStylePresets(): Promise<AutoFigureEditStylePreset[]> {
  const response = await apiClient.get('/api/v1/autofigure-edit/style-presets')
  const payload = response.data as AutoFigureEditStylePresetListResponse
  return payload.items || []
}

export async function getAutoFigureEditRuntimeDefaults(): Promise<AutoFigureEditRuntimeDefaultsResponse> {
  const response = await apiClient.get('/api/v1/autofigure-edit/runtime-defaults')
  return response.data as AutoFigureEditRuntimeDefaultsResponse
}

export async function createAutoFigureEditSession(
  payload: AutoFigureEditSessionCreatePayload
): Promise<{ session_id: string; status: string }> {
  const response = await apiClient.post('/api/v1/autofigure-edit/session/create', payload)
  return response.data as { session_id: string; status: string }
}

export async function runAutoFigureEditSession(
  sessionId: string,
  payload: AutoFigureEditSessionRunPayload
): Promise<AutoFigureEditSessionRunResponse> {
  const response = await apiClient.post(`/api/v1/autofigure-edit/session/${sessionId}/run`, payload, {
    timeout: AUTOFIGURE_SESSION_RUN_TIMEOUT_MS,
  })
  return response.data as AutoFigureEditSessionRunResponse
}

export async function cancelAutoFigureEditSession(
  sessionId: string
): Promise<AutoFigureEditSessionRunResponse> {
  const response = await apiClient.post(`/api/v1/autofigure-edit/session/${sessionId}/cancel`)
  return response.data as AutoFigureEditSessionRunResponse
}

export async function retryAutoFigureEditSession(
  sessionId: string
): Promise<AutoFigureEditSessionRunResponse> {
  const response = await apiClient.post(`/api/v1/autofigure-edit/session/${sessionId}/retry`, undefined, {
    timeout: AUTOFIGURE_SESSION_RUN_TIMEOUT_MS,
  })
  return response.data as AutoFigureEditSessionRunResponse
}

export async function getAutoFigureEditSessionQueueStatus(
  sessionId: string
): Promise<AutoFigureEditQueueStatusResponse> {
  const response = await apiClient.get(`/api/v1/autofigure-edit/session/${sessionId}/queue-status`)
  return response.data as AutoFigureEditQueueStatusResponse
}

export async function submitAutoFigureEditDownloadFeedback(
  sessionId: string,
  payload: AutoFigureDownloadFeedbackPayload
): Promise<AutoFigureDownloadFeedbackResponse> {
  const response = await apiClient.post(
    `/api/v1/autofigure-edit/session/${sessionId}/download-feedback`,
    payload
  )
  return response.data as AutoFigureDownloadFeedbackResponse
}

export async function exportAutoFigureEditSessionPdf(
  sessionId: string,
  payload: AutoFigureEditPdfExportPayload
): Promise<Blob> {
  const response = await apiClient.post(
    `/api/v1/autofigure-edit/session/${sessionId}/export-pdf`,
    payload,
    {
      responseType: 'blob',
      timeout: AUTOFIGURE_EXPORT_TIMEOUT_MS,
    }
  )
  return response.data as Blob
}

export async function getAutoFigureEditExportReadiness(
  sessionId: string
): Promise<AutoFigureEditExportReadinessResponse> {
  const response = await apiClient.get(`/api/v1/autofigure-edit/session/${sessionId}/export-readiness`, {
    params: { _ts: Date.now() },
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  })
  return response.data as AutoFigureEditExportReadinessResponse
}

export async function exportAutoFigureEditSessionBundle(sessionId: string): Promise<Blob> {
  const response = await apiClient.get(`/api/v1/autofigure-edit/session/${sessionId}/export-bundle`, {
    params: { _ts: Date.now() },
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
    responseType: 'blob',
    timeout: AUTOFIGURE_EXPORT_TIMEOUT_MS,
  })
  return response.data as Blob
}

export async function listAutoFigureEditSessionRevisions(
  sessionId: string
): Promise<AutoFigureEditSessionRevisionListResponse> {
  const response = await apiClient.get(`/api/v1/autofigure-edit/session/${sessionId}/revisions`, {
    params: { _ts: Date.now() },
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  })
  return response.data as AutoFigureEditSessionRevisionListResponse
}

export async function getAutoFigureEditSessionRevision(
  sessionId: string,
  revisionId: string
): Promise<AutoFigureEditSessionRevisionDetail> {
  const response = await apiClient.get(
    `/api/v1/autofigure-edit/session/${sessionId}/revisions/${revisionId}`,
    {
      params: { _ts: Date.now() },
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    }
  )
  return response.data as AutoFigureEditSessionRevisionDetail
}

export async function commitAutoFigureEditSessionRevision(
  sessionId: string,
  payload: AutoFigureEditSessionRevisionCommitPayload
): Promise<AutoFigureEditSessionRevisionCommitResponse> {
  const response = await apiClient.post(
    `/api/v1/autofigure-edit/session/${sessionId}/revisions`,
    payload
  )
  return response.data as AutoFigureEditSessionRevisionCommitResponse
}

// Backward-compatible aliases
export type AutoFigureEditProject = AutoFigureEditWorkspace
export type AutoFigureEditProjectListItem = AutoFigureEditWorkspaceListItem
export type AutoFigureEditProjectListResponse = AutoFigureEditWorkspaceListResponse
export type AutoFigureEditProjectCreatePayload = AutoFigureEditWorkspaceCreatePayload

export const listAutoFigureEditProjects = listAutoFigureEditWorkspaces
export const createAutoFigureEditProject = createAutoFigureEditWorkspace
export const deleteAutoFigureEditProject = deleteAutoFigureEditWorkspace
export const ensureAutoFigureEditProject = ensureAutoFigureEditWorkspace
export const getAutoFigureEditProject = getAutoFigureEditWorkspace
