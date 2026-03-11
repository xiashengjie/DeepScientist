export type ReviewWorkspaceStatus =
  | 'created'
  | 'parsing'
  | 'reviewing'
  | 'completed'
  | 'failed'
  | 'canceled'

export type ReviewRunStatus =
  | 'queued'
  | 'parsing'
  | 'reviewing'
  | 'finalizing'
  | 'completed'
  | 'failed'
  | 'canceled'

export type ReviewChatModel = 'qwen' | 'gpt' | 'gpt-5.4'

export interface ReviewWorkspaceListItem {
  id: string
  review_id: string
  title: string
  status: ReviewWorkspaceStatus
  novelty_check_end_date: string
  chat_model: ReviewChatModel
  source_pdf_name: string
  project_id?: string | null
  source_file_id?: string | null
  created_at: string
  updated_at: string
  latest_run_id?: string | null
}

export interface ReviewWorkspaceListResponse {
  items: ReviewWorkspaceListItem[]
  total: number
  skip: number
  limit: number
}

export interface ReviewRunSummary {
  id: string
  status: ReviewRunStatus
  provider_name?: string | null
  model_name?: string | null
  estimated_cost: number
  actual_cost?: number | null
  error_code?: string | null
  error_message?: string | null
  started_at?: string | null
  finished_at?: string | null
  created_at: string
  updated_at: string
}

export interface ReviewWorkspaceDetailResponse {
  id: string
  review_id: string
  title: string
  status: ReviewWorkspaceStatus
  novelty_check_end_date: string
  chat_model: ReviewChatModel
  source_pdf_name: string
  project_id?: string | null
  source_file_id?: string | null
  created_at: string
  updated_at: string
  latest_run?: ReviewRunSummary | null
  annotation_use_meta_review?: boolean
}

export interface ReviewWorkspaceCreateResponse {
  workspace_id: string
  review_id: string
  run_id: string
  status: ReviewWorkspaceStatus
  novelty_check_end_date: string
  chat_model: ReviewChatModel
  points_estimated_cost: number
  dispatch_state?: 'started' | 'queued'
  queue_position?: number | null
  queue_ahead_count?: number | null
  queue_total_count?: number | null
  queue_tier?: 'priority' | 'standard' | null
  priority_queue_count?: number | null
  standard_queue_count?: number | null
  estimated_wait_seconds?: number | null
  estimated_ready_seconds?: number | null
  estimated_ready_at?: string | null
  project_id?: string | null
  source_file_id?: string | null
}

export interface ReviewRunCreateResponse {
  workspace_id: string
  review_id: string
  run_id: string
  status: ReviewRunStatus
  points_estimated_cost: number
  dispatch_state?: 'started' | 'queued'
  queue_position?: number | null
  queue_ahead_count?: number | null
  queue_total_count?: number | null
  queue_tier?: 'priority' | 'standard' | null
  priority_queue_count?: number | null
  standard_queue_count?: number | null
  estimated_wait_seconds?: number | null
  estimated_ready_seconds?: number | null
  estimated_ready_at?: string | null
}

export interface ReviewQueueStatusResponse {
  workspace_id: string
  review_id: string
  run_id: string
  status: ReviewRunStatus
  dispatch_state: 'started' | 'queued'
  queue_position?: number | null
  queue_ahead_count?: number | null
  queue_total_count?: number | null
  queue_tier?: 'priority' | 'standard' | null
  priority_queue_count?: number | null
  standard_queue_count?: number | null
  max_active: number
  running_count: number
  waited_seconds?: number | null
  estimated_wait_seconds?: number | null
  estimated_ready_seconds?: number | null
  estimated_ready_at?: string | null
  batch_seconds: number
  throughput_per_10m: number
}

export interface ReviewEventItem {
  id: string
  run_id: string
  seq: number
  event_type: string
  phase?: string | null
  payload: Record<string, unknown>
  created_at: string
}

export interface ReviewEventsResponse {
  items: ReviewEventItem[]
  run_id: string
  next_seq: number
}

export interface ReviewResultResponse {
  workspace_id: string
  review_id: string
  run_id: string
  status: ReviewRunStatus
  raw_output?: string | null
  parsed_output?: Record<string, unknown> | null
  final_report_markdown?: string | null
  final_report_updated_at?: string | null
  final_report_source?: string | null
  final_report_version?: number | null
  points_estimated_cost: number
  points_actual_cost?: number | null
}

export type ReviewResultExportPdfStatus = 'pending' | 'generating' | 'ready' | 'failed'

export interface ReviewResultExportStatusResponse {
  workspace_id: string
  review_id: string
  run_id: string
  run_status: ReviewRunStatus
  pdf_status: ReviewResultExportPdfStatus
  ready: boolean
  message: string
  error?: string | null
  next_steps?: string[]
  retry_required?: boolean
  retry_endpoint?: string | null
  updated_at?: string | null
  generated_at?: string | null
}

export type ReviewMarkdownReparseStatus = 'queued' | 'running' | 'completed' | 'failed'

export interface ReviewMarkdownReparseResponse {
  workspace_id: string
  review_id: string
  status: ReviewMarkdownReparseStatus
  markdown_ready: boolean
  phase?: string | null
  message: string
}

export interface ReviewRunStatusResponse {
  workspace_id: string
  review_id: string
  run_id: string
  status: ReviewRunStatus
}

export type ReviewAnnotationAgentStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'stopped'

export interface ReviewAnnotationAgentStatusResponse {
  enabled: boolean
  status: ReviewAnnotationAgentStatus
  session_id?: string | null
  run_status?: string | null
  is_active: boolean
  started_at?: string | null
  updated_at?: string | null
  latest_message?: string | null
}

export interface ReviewAnnotationAgentStartResponse {
  workspace_id: string
  review_id: string
  session_id: string
  status: ReviewAnnotationAgentStatus
  started: boolean
}

export interface ReviewAnnotationAgentControlResponse {
  success: boolean
  status: ReviewAnnotationAgentStatus
  session_id?: string | null
}

export interface ReviewAnnotationAgentEventItem {
  id: string
  session_id: string
  seq: number
  event_type: string
  payload: Record<string, unknown>
  created_at: string
}

export interface ReviewAnnotationAgentEventsResponse {
  workspace_id: string
  review_id: string
  session_id?: string | null
  items: ReviewAnnotationAgentEventItem[]
  next_seq: number
}

export interface ReviewProviderConfigResponse {
  review_model_enabled?: boolean
  provider_name: string
  base_url?: string | null
  endpoint_path: string
  model?: string | null
  configured: boolean
}



export interface ReviewShareLink {
  id: string
  review_workspace_id: string
  token: string
  permission: 'view'
  is_active: boolean
  expires_at?: string | null
  created_by: string
  access_count: number
  last_accessed_at?: string | null
  created_at: string
  updated_at: string
}

export interface ReviewShareValidationResponse {
  valid: boolean
  error?: string | null
  access?: 'view' | null
  requires_login?: boolean
  review?: {
    id: string
    review_id: string
    title: string
    source_pdf_name: string
    updated_at: string
  } | null
  redirect_url?: string | null
}

export interface ReviewSharedResultResponse {
  review: {
    id: string
    review_id: string
    title: string
    source_pdf_name: string
    updated_at: string
  }
  run_id: string
  status: ReviewRunStatus
  raw_output?: string | null
  parsed_output?: Record<string, unknown> | null
  source_annotations?: Array<Record<string, unknown>> | null
  final_report_markdown?: string | null
  final_report_updated_at?: string | null
  final_report_source?: string | null
  final_report_version?: number | null
}
