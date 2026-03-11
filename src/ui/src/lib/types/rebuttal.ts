export type RebuttalWorkspaceStatus =
  | 'created'
  | 'parsing'
  | 'rebuttaling'
  | 'completed'
  | 'failed'
  | 'canceled'

export type RebuttalRunStatus =
  | 'queued'
  | 'parsing'
  | 'rebuttaling'
  | 'finalizing'
  | 'completed'
  | 'failed'
  | 'canceled'

export type RebuttalChatModel = 'qwen' | 'gpt' | 'gpt-5.4'

export interface RebuttalWorkspaceListItem {
  id: string
  rebuttal_id: string
  title: string
  status: RebuttalWorkspaceStatus
  novelty_check_end_date: string
  chat_model: RebuttalChatModel
  source_pdf_name: string
  project_id?: string | null
  source_file_id?: string | null
  created_at: string
  updated_at: string
  latest_run_id?: string | null
}

export interface RebuttalWorkspaceListResponse {
  items: RebuttalWorkspaceListItem[]
  total: number
  skip: number
  limit: number
}

export interface RebuttalRunSummary {
  id: string
  status: RebuttalRunStatus
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

export interface RebuttalWorkspaceDetailResponse {
  id: string
  rebuttal_id: string
  title: string
  status: RebuttalWorkspaceStatus
  novelty_check_end_date: string
  chat_model: RebuttalChatModel
  source_pdf_name: string
  project_id?: string | null
  source_file_id?: string | null
  created_at: string
  updated_at: string
  latest_run?: RebuttalRunSummary | null
}

export interface RebuttalWorkspaceCreateResponse {
  workspace_id: string
  rebuttal_id: string
  run_id: string
  status: RebuttalWorkspaceStatus
  novelty_check_end_date: string
  chat_model: RebuttalChatModel
  points_estimated_cost: number
  dispatch_state?: 'started' | 'queued'
  queue_position?: number | null
  queue_ahead_count?: number | null
  queue_total_count?: number | null
  estimated_wait_seconds?: number | null
  estimated_ready_seconds?: number | null
  estimated_ready_at?: string | null
  project_id?: string | null
  source_file_id?: string | null
}

export interface RebuttalRunCreateResponse {
  workspace_id: string
  rebuttal_id: string
  run_id: string
  status: RebuttalRunStatus
  points_estimated_cost: number
  dispatch_state?: 'started' | 'queued'
  queue_position?: number | null
  queue_ahead_count?: number | null
  queue_total_count?: number | null
  estimated_wait_seconds?: number | null
  estimated_ready_seconds?: number | null
  estimated_ready_at?: string | null
}

export interface RebuttalQueueStatusResponse {
  workspace_id: string
  rebuttal_id: string
  run_id: string
  status: RebuttalRunStatus
  dispatch_state: 'started' | 'queued'
  queue_position?: number | null
  queue_ahead_count?: number | null
  queue_total_count?: number | null
  max_active: number
  running_count: number
  waited_seconds?: number | null
  estimated_wait_seconds?: number | null
  estimated_ready_seconds?: number | null
  estimated_ready_at?: string | null
  batch_seconds: number
  throughput_per_10m: number
}

export interface RebuttalEventItem {
  id: string
  run_id: string
  seq: number
  event_type: string
  phase?: string | null
  payload: Record<string, unknown>
  created_at: string
}

export interface RebuttalEventsResponse {
  items: RebuttalEventItem[]
  run_id: string
  next_seq: number
}

export interface RebuttalResultResponse {
  workspace_id: string
  rebuttal_id: string
  run_id: string
  status: RebuttalRunStatus
  raw_output?: string | null
  parsed_output?: Record<string, unknown> | null
  final_report_markdown?: string | null
  final_report_updated_at?: string | null
  final_report_source?: string | null
  final_report_version?: number | null
  points_estimated_cost: number
  points_actual_cost?: number | null
}

export type RebuttalResultExportPdfStatus = 'pending' | 'generating' | 'ready' | 'failed'

export interface RebuttalResultExportStatusResponse {
  workspace_id: string
  rebuttal_id: string
  run_id: string
  run_status: RebuttalRunStatus
  pdf_status: RebuttalResultExportPdfStatus
  ready: boolean
  message: string
  error?: string | null
  next_steps?: string[]
  retry_required?: boolean
  retry_endpoint?: string | null
  updated_at?: string | null
  generated_at?: string | null
}

export type RebuttalMarkdownReparseStatus = 'queued' | 'running' | 'completed' | 'failed'

export interface RebuttalMarkdownReparseResponse {
  workspace_id: string
  rebuttal_id: string
  status: RebuttalMarkdownReparseStatus
  markdown_ready: boolean
  phase?: string | null
  message: string
}

export interface RebuttalRunStatusResponse {
  workspace_id: string
  rebuttal_id: string
  run_id: string
  status: RebuttalRunStatus
}

export type RebuttalAnnotationAgentStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'stopped'

export interface RebuttalAnnotationAgentStatusResponse {
  enabled: boolean
  status: RebuttalAnnotationAgentStatus
  session_id?: string | null
  run_status?: string | null
  is_active: boolean
  started_at?: string | null
  updated_at?: string | null
  latest_message?: string | null
}

export interface RebuttalAnnotationAgentStartResponse {
  workspace_id: string
  rebuttal_id: string
  session_id: string
  status: RebuttalAnnotationAgentStatus
  started: boolean
}

export interface RebuttalAnnotationAgentControlResponse {
  success: boolean
  status: RebuttalAnnotationAgentStatus
  session_id?: string | null
}

export interface RebuttalAnnotationAgentEventItem {
  id: string
  session_id: string
  seq: number
  event_type: string
  payload: Record<string, unknown>
  created_at: string
}

export interface RebuttalAnnotationAgentEventsResponse {
  workspace_id: string
  rebuttal_id: string
  session_id?: string | null
  items: RebuttalAnnotationAgentEventItem[]
  next_seq: number
}

export interface RebuttalShareLink {
  id: string
  rebuttal_workspace_id: string
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

export interface RebuttalShareValidationResponse {
  valid: boolean
  error?: string | null
  access?: 'view' | null
  requires_login?: boolean
  rebuttal?: {
    id: string
    rebuttal_id: string
    title: string
    source_pdf_name: string
    updated_at: string
  } | null
  redirect_url?: string | null
}

export interface RebuttalSharedResultResponse {
  rebuttal: {
    id: string
    rebuttal_id: string
    title: string
    source_pdf_name: string
    updated_at: string
  }
  run_id: string
  status: RebuttalRunStatus
  raw_output?: string | null
  parsed_output?: Record<string, unknown> | null
  source_annotations?: Array<Record<string, unknown>> | null
  final_report_markdown?: string | null
  final_report_updated_at?: string | null
  final_report_source?: string | null
  final_report_version?: number | null
}
