// Admin API Types (aligned with backend /api/v1/admin)

// System Configuration
export interface SystemConfig {
  id: string
  key: string
  category: string
  value: unknown
  description?: string | null
  is_sensitive: boolean
  is_readonly: boolean
  updated_at?: string | null
}

export interface UpdateConfigInput {
  key: string
  value: unknown
  category?: string
  description?: string
  is_sensitive?: boolean
}

export interface AdminReviewAgentStopInput {
  reason?: string
}

export interface AdminReviewAgentStopResponse {
  success: boolean
  workspace_id: string
  status: string
  session_id?: string | null
  previous_status?: string | null
  stop_requested: boolean
}

export interface AdminReviewWorkspaceListParams {
  skip?: number
  limit?: number
  status?: string
  run_status?: string
  q?: string
}

export interface AdminReviewWorkspaceSummary {
  workspace_id: string
  review_id?: string | null
  workspace_status: string
  run_id?: string | null
  run_status?: string | null
  annotation_status?: string | null
  owner_user_id: string
  owner_email?: string | null
  owner_username?: string | null
  project_id?: string | null
  title: string
  source_pdf_name: string
  created_at?: string | null
  updated_at?: string | null
}

export interface AdminReviewWorkspaceListResponse {
  items: AdminReviewWorkspaceSummary[]
  total: number
  skip: number
  limit: number
}

export type AgentEngineValue = 'codex' | 'claude' | 'claude_code'

export interface AgentEngineResponse {
  agent_engine: AgentEngineValue
}

export interface AgentEngineUpdate {
  agent_engine: AgentEngineValue
}

export interface RegistrationConfigResponse {
  invitation_required: boolean
  scholar_verification_required: boolean
}

export interface RegistrationConfigUpdate {
  invitation_required: boolean
  scholar_verification_required: boolean
}

export interface AdminTestEmailRequest {
  to_email?: string
  subject?: string
  message?: string
}

export interface AdminTestEmailResponse {
  email_id: string
  status: string
  to_email: string
  subject: string
  sent_at?: string | null
  last_error?: string | null
}

// Outbound Email (admin-only)
export type OutboundEmailStatus = 'pending' | 'sending' | 'sent' | 'failed'

export interface AdminOutboundEmailSummary {
  id: string
  kind: string
  status: OutboundEmailStatus | string
  to_email: string
  subject: string
  body_preview?: string | null
  user_id?: string | null
  broadcast_id?: string | null
  scheduled_at?: string | null
  sent_at?: string | null
  attempts: number
  last_error?: string | null
  created_at: string
  updated_at: string
}

export interface AdminOutboundEmailDetail extends AdminOutboundEmailSummary {
  body_text?: string | null
  body_html?: string | null
}

export interface AdminOutboundEmailListParams extends PaginationParams {
  status?: string
  kind?: string
  user_id?: string
  broadcast_id?: string
  q?: string
}

export interface AdminOutboundEmailCreateRequest {
  kind?: string
  subject: string
  body_text: string
  body_html?: string | null
  send_to_all_users?: boolean
  target_user_ids?: string[] | null
  target_user_emails?: string[] | null
  to_emails?: string[] | null
  scheduled_at?: string | null
}

export interface AdminOutboundEmailCreateResponse {
  created: number
}

// MinerU Configuration
export interface MineruConfigResponse {
  api_token_configured: boolean
  api_token_masked?: string | null
  api_url?: string | null
  public_backend_url?: string | null
  updated_at?: string | null
}

export interface MineruConfigUpdate {
  api_token?: string
  api_url?: string
  public_backend_url?: string
}

// AI Provider
export interface AIProvider {
  id: string
  name: string
  display_name: string
  api_base_url?: string | null
  has_api_key: boolean
  default_model?: string | null
  available_models: string[]
  settings: Record<string, unknown>
  rate_limit_rpm?: number | null
  rate_limit_tpm?: number | null
  is_active: boolean
  is_default: boolean
  updated_at?: string | null
}

export interface CreateAIProviderInput {
  name: string
  display_name: string
  api_base_url: string
  api_key?: string
  api_key_secondary?: string | string[]
  default_model: string
  available_models?: string[]
  settings?: Record<string, unknown>
  rate_limit_rpm?: number
  rate_limit_tpm?: number
  is_default?: boolean
}

export interface UpdateAIProviderInput {
  display_name?: string
  api_base_url?: string
  api_key?: string | null
  api_key_secondary?: string | string[] | null
  default_model?: string
  available_models?: string[]
  settings?: Record<string, unknown>
  rate_limit_rpm?: number | null
  rate_limit_tpm?: number | null
  is_active?: boolean
  is_default?: boolean
}

// User Management
export type UserRole = 'user' | 'admin'
export type UserType = 'normal' | 'supported'

export interface User {
  id: string
  email: string
  username: string
  role: UserRole
  user_type: UserType
  is_active: boolean
  google_id?: string | null
  google_name?: string | null
  google_picture?: string | null
  avatar_url?: string | null
  created_at: string
  last_login_at?: string | null
  nationality?: string | null
  institution?: string | null
  title?: string | null
  degree?: string | null
  google_scholar_url?: string | null
  openreview_url?: string | null
  dblp_url?: string | null
  orcid?: string | null
}

export interface UpdateUserInput {
  role?: UserRole
  user_type?: UserType
  is_active?: boolean
}

// Invitation Codes
export type InvitationCodeKind = 'system' | 'referral'

export interface Invitation {
  id: string
  code: string
  user_type: UserType
  code_kind: InvitationCodeKind
  display_name?: string | null
  entry_enabled?: boolean
  effect_type?: 'plus_signup' | 'grant_points' | 'grant_plan' | 'none' | null
  effect_config?: Record<string, unknown>
  max_uses: number
  current_uses: number
  is_active: boolean
  skip_scholar_verification?: boolean
  created_by?: string | null
  owner_user_id?: string | null
  created_at: string
  expires_at?: string | null
}

export interface CreateInvitationInput {
  code?: string
  user_type?: UserType
  code_kind?: InvitationCodeKind
  display_name?: string
  entry_enabled?: boolean
  effect_type?: 'plus_signup' | 'grant_points' | 'grant_plan' | 'none'
  effect_config?: Record<string, unknown>
  max_uses?: number
  expires_in_days?: number
  skip_scholar_verification?: boolean
  owner_user_id?: string
}

// Audit Logs
export interface AuditLog {
  id: string
  admin_id: string
  admin_email: string
  action: string
  resource_type: string
  resource_id?: string | null
  details: Record<string, unknown>
  ip_address?: string | null
  created_at: string
}

export interface AuditLogFilter {
  admin_id?: string
  action?: string
  resource_type?: string
}

// Server Logs (admin-only)
export type AdminLogSource = 'backend' | 'frontend'

export interface AdminLogSourceInfo {
  source: AdminLogSource | string
  filename: string
  exists: boolean
  size_bytes?: number | null
  updated_at?: string | null
}

export interface AdminLogSourcesResponse {
  items: AdminLogSourceInfo[]
}

export interface AdminLogTailResponse {
  source: AdminLogSource | string
  filename: string
  lines: string[]
  truncated: boolean
  updated_at?: string | null
}

// CLI Admin
export interface AdminCliServer {
  id: string
  project_id: string
  project_name: string
  owner_user_id?: string | null
  name?: string | null
  hostname: string
  ip_address?: string | null
  os_info?: string | null
  device_fingerprint?: string | null
  server_root?: string | null
  gpu_count: number
  gpu_info?: Array<Record<string, unknown>> | null
  memory_gb: number
  disk_gb: number
  status: string
  pending_unbind: boolean
  revoked_at?: string | null
  last_seen_at?: string | null
  last_rtt_ms?: number | null
  sync_status?: Record<string, unknown> | null
  registered_at: string
  agent_token_issued_at?: string | null
  agent_token_expires_at?: string | null
}

export interface AdminCliServerListResponse {
  items: AdminCliServer[]
}

// Lab Admin
export interface AdminLabOverview {
  projects_total: number
  agents_total: number
  agents_idle: number
  agents_working: number
  agents_blocked: number
  quests_total: number
  quests_active: number
  servers_total: number
  servers_online: number
  updated_at: string
}

export interface AdminLabAgentSummary {
  agent_instance_id: string
  project_id: string
  project_name?: string | null
  agent_id: string
  display_name?: string | null
  mention_label?: string | null
  status?: string | null
  frozen: boolean
  direct_session_id?: string | null
  active_quest_id?: string | null
  active_quest_node_id?: string | null
  cli_server_id?: string | null
  template_id?: string | null
  template_key?: string | null
  source?: string | null
  created_at: string
  updated_at?: string | null
}

export interface AdminLabAgentListResponse {
  items: AdminLabAgentSummary[]
  total: number
  skip: number
  limit: number
}

export interface AdminLabQuestSummary {
  quest_id: string
  project_id: string
  project_name?: string | null
  title: string
  status: string
  baseline_root_id?: string | null
  node_count: number
  assigned_agent_count: number
  created_at: string
}

export interface AdminLabQuestListResponse {
  items: AdminLabQuestSummary[]
  total: number
  skip: number
  limit: number
}

export interface AdminLabQuestDetail {
  quest_id: string
  project_id: string
  project_name?: string | null
  title: string
  description: string
  status: string
  baseline_root_id?: string | null
  pi_agent_instance_id?: string | null
  pi_state?: string | null
  cli_server_id?: string | null
  quest_repo_path?: string | null
  git_head_branch?: string | null
  created_at: string
}

export interface AdminLabQuestNodeSummary {
  node_id: string
  node_key: string
  title?: string | null
  status: string
  order_index: number
  report_updated_at?: string | null
  started_at?: string | null
  ended_at?: string | null
}

export interface AdminLabQuestDetailResponse {
  quest: AdminLabQuestDetail
  nodes: AdminLabQuestNodeSummary[]
  blockers: { count: number }
  agents: AdminLabAgentSummary[]
}

export interface AdminLabActionRequest {
  reason?: string
}

export interface AdminLabAgentActionResponse {
  agent_instance_id: string
  status: string
  frozen: boolean
}

export interface AdminAgentCreateQueueItem {
  request_id: string
  project_id: string
  project_name?: string | null
  agent_instance_id: string
  agent_id?: string | null
  template_key: string
  display_name?: string | null
  cli_server_id?: string | null
  created_at: string
}

export interface AdminAgentCreateQueueResponse {
  items: AdminAgentCreateQueueItem[]
  total: number
  skip: number
  limit: number
}

export interface AdminAgentCreateQueueAckRequest {
  project_id: string
  request_id: string
}

export interface AdminAgentCreateQueueAckResponse {
  project_id: string
  request_id: string
  deleted: boolean
}

export interface AdminAgentSyncQueueItem {
  server_id: string
  project_id: string
  project_name?: string | null
  status: string
  last_seen_at?: string | null
  sync_lag_events?: number | null
  last_synced_at?: string | null
  last_event_commit?: string | null
  agent_sync_pending?: number | null
  agent_sync_oldest_at?: string | null
  agent_sync_newest_at?: string | null
  sync_status?: Record<string, unknown> | null
}

export interface AdminAgentSyncQueueResponse {
  items: AdminAgentSyncQueueItem[]
}

export interface AdminAgentSyncRetryRequest {
  server_id: string
}

export interface AdminAgentSyncRetryResponse {
  server_id: string
  success: boolean
}

export interface AdminAgentTemplateSummary {
  template_id: string
  template_key: string
  name: string
  name_zh?: string | null
  label?: string | null
  role?: string | null
  purpose?: string | null
  description?: string | null
  icon?: string | null
  color?: string | null
  logo_svg_path?: string | null
  prompt_scope?: string | null
  agent_engine?: string | null
  execution_target?: string | null
  source?: string | null
  default_skills?: string[] | null
  default_traits_json?: Record<string, unknown> | null
  recommended_subagents?: string[] | null
  name_prompt_pool?: string[] | null
  capability_prompt_pool?: string[] | null
  strength_prompt_pool?: string[] | null
  motto_prompt_pool?: string[] | null
  typical_dod_md?: string | null
  prompt_template_md?: string | null
  init_question?: string | null
  init_answer?: string | null
  prompt_path?: string | null
  version?: string | null
  sort_order: number
  enabled: boolean
  created_at: string
  updated_at?: string | null
}

export interface AdminAgentTemplateListResponse {
  items: AdminAgentTemplateSummary[]
  total: number
  skip: number
  limit: number
}

export interface AdminAgentTemplateUpdateInput {
  name?: string
  name_zh?: string | null
  label?: string | null
  role?: string | null
  purpose?: string
  description?: string | null
  icon?: string | null
  color?: string | null
  logo_svg_path?: string | null
  prompt_scope?: string | null
  agent_engine?: string | null
  execution_target?: string | null
  default_skills?: string[] | null
  default_traits_json?: Record<string, unknown> | null
  recommended_subagents?: string[] | null
  name_prompt_pool?: string[] | null
  capability_prompt_pool?: string[] | null
  strength_prompt_pool?: string[] | null
  motto_prompt_pool?: string[] | null
  typical_dod_md?: string | null
  prompt_template_md?: string | null
  init_question?: string | null
  init_answer?: string | null
  prompt_path?: string | null
  version?: string | null
  sort_order?: number | null
  enabled?: boolean
}

// Broadcasts (admin-only)
export type BroadcastLevel = 'info' | 'warning' | 'error'
export type BroadcastTier = 'basic' | 'premium'
export type BroadcastTargetScope = 'all' | 'projects_list' | 'project_workspace' | 'cli_only'
export type BroadcastTriggerMode = 'manual' | 'event'
export type BroadcastTriggerEvent = 'user_registered'

export interface AdminBroadcastListParams {
  skip?: number
  limit?: number
  trigger_mode?: BroadcastTriggerMode
  trigger_event?: BroadcastTriggerEvent
  tier?: BroadcastTier
  is_active?: boolean
  send_email?: boolean
  q?: string
}

export interface AdminBroadcast {
  id: string
  admin_id?: string | null
  message: string
  title?: string | null
  image_url?: string | null
  level: BroadcastLevel
  is_active: boolean
  show_to_users: boolean
  send_email?: boolean
  email_subject?: string | null
  email_body?: string | null
  email_target_user_ids?: string[] | null
  tier?: BroadcastTier
  target_scope?: BroadcastTargetScope
  trigger_mode?: BroadcastTriggerMode
  trigger_event?: BroadcastTriggerEvent | null
  trigger_ref_key?: string | null
  channels?: string[]
  target_user_id?: string | null
  target_project_id?: string | null
  content_markdown?: string | null
  content_file_id?: string | null
  starts_at?: string | null
  created_at: string
  updated_at: string
  expires_at?: string | null
}

export interface AdminBroadcastListResponse {
  items: AdminBroadcast[]
  total: number
  skip: number
  limit: number
}

export interface CreateBroadcastInput {
  message: string
  level?: BroadcastLevel
  show_to_users?: boolean
  is_active?: boolean
  send_email?: boolean
  email_subject?: string | null
  email_body?: string | null
  email_target_user_ids?: string[] | null
  expires_at?: string | null
  tier?: BroadcastTier
  target_scope?: BroadcastTargetScope
  trigger_mode?: BroadcastTriggerMode
  trigger_event?: BroadcastTriggerEvent | null
  channels?: string[]
  target_user_id?: string | null
  target_project_id?: string | null
  title?: string | null
  image_url?: string | null
  content_markdown?: string | null
  content_file_id?: string | null
  starts_at?: string | null
}

export interface UpdateBroadcastInput {
  message?: string
  level?: BroadcastLevel
  show_to_users?: boolean
  is_active?: boolean
  send_email?: boolean
  email_subject?: string | null
  email_body?: string | null
  email_target_user_ids?: string[] | null
  expires_at?: string | null
  tier?: BroadcastTier
  target_scope?: BroadcastTargetScope
  trigger_mode?: BroadcastTriggerMode
  trigger_event?: BroadcastTriggerEvent | null
  channels?: string[]
  target_user_id?: string | null
  target_project_id?: string | null
  title?: string | null
  image_url?: string | null
  content_markdown?: string | null
  content_file_id?: string | null
  starts_at?: string | null
}

// Feedback (admin-only)
export type FeedbackCategory = 'bug' | 'feature' | 'improvement' | 'question' | 'info' | 'other'
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical'
export type FeedbackStatus = 'new' | 'pending' | 'in_progress' | 'resolved'

export interface AdminFeedback {
  id: string
  user_id: string
  user_email?: string | null
  type: FeedbackCategory
  priority: FeedbackPriority
  title: string
  description: string
  improvement_suggestion?: string | null
  project_id?: string | null
  page_path?: string | null
  meta: Record<string, unknown>
  screenshot_url?: string | null
  status: FeedbackStatus
  admin_response?: string | null
  resolved_at?: string | null
  resolved_by?: string | null
  created_at: string
  updated_at: string
}

export interface AdminFeedbackListResponse {
  items: AdminFeedback[]
  total: number
  skip: number
  limit: number
}

export interface UpdateFeedbackInput {
  status?: FeedbackStatus
  admin_response?: string | null
}

// Dashboard Statistics
export interface AdminStats {
  total_users: number;
  total_providers: number;
  active_invitations: number;
  total_audit_logs: number;
}

// Usage Analytics (daily aggregates)
export interface AdminUsageDailyPoint {
  date: string;
  value: number;
}

export interface AdminUsageDailyMetric {
  key: string;
  label: string;
  unit: string;
  total: number;
  points: AdminUsageDailyPoint[];
}

export interface AdminUsageDailyResponse {
  start_date: string;
  end_date: string;
  days: number;
  metrics: AdminUsageDailyMetric[];
}

export interface AdminUsageDailyParams {
  days?: number;
  start_date?: string;
  end_date?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

// AutoFigure Admin
export interface AutoFigureAdminSession {
  session_id: string;
  status: string;
  user_id?: string | null;
  user_email?: string | null;
  user_username?: string | null;
  project_id?: string | null;
  project_name?: string | null;
  input_type?: string | null;
  content_type?: string | null;
  session_name?: string | null;
  source_file_name?: string | null;
  current_iteration: number;
  iterations_count: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AutoFigureAdminSessionListResponse {
  items: AutoFigureAdminSession[];
  total: number;
  skip: number;
  limit: number;
}

export interface AutoFigureAdminSessionDetail {
  session_id: string;
  status: string;
  error?: string | null;
  input_content?: string | null;
  input_type: string;
  extracted_methodology?: string | null;
  config: Record<string, unknown>;
  iterations: unknown[];
  current_iteration: number;
  final_xml?: string | null;
  enhanced_images?: unknown[] | null;
  enhancement_config?: Record<string, unknown> | null;
  user_id?: string | null;
  user_email?: string | null;
  user_username?: string | null;
  project_id?: string | null;
  project_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AutoFigureAdminSessionsParams extends PaginationParams {
  user_id?: string;
  project_id?: string;
  status?: string;
}

export interface AutoFigureEditAdminSession {
  session_id: string;
  status: string;
  error?: string | null;
  user_id?: string | null;
  user_email?: string | null;
  user_username?: string | null;
  workspace_id?: string | null;
  workspace_name?: string | null;
  project_id?: string | null;
  project_name?: string | null;
  input_type?: string | null;
  artifact_count: number;
  download_feedback_submitted: boolean;
  figure_scientific_semantic_correctness?: number | null;
  figure_information_completeness?: number | null;
  figure_visual_presentation_quality?: number | null;
  figure_style_consistency?: number | null;
  figure_usability?: number | null;
  figure_critical_scientific_error?: number | null;
  svg_conversion_correctness?: number | null;
  feedback_comment?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AutoFigureEditAdminSessionListResponse {
  items: AutoFigureEditAdminSession[];
  total: number;
  skip: number;
  limit: number;
}

export interface AutoFigureEditAdminSessionDetail {
  session_id: string;
  status: string;
  error?: string | null;
  user_id?: string | null;
  user_email?: string | null;
  user_username?: string | null;
  workspace_id?: string | null;
  workspace_name?: string | null;
  project_id?: string | null;
  project_name?: string | null;
  input_type?: string | null;
  artifact_count: number;
  artifacts: unknown[];
  config: Record<string, unknown>;
  download_feedback_submitted: boolean;
  download_feedback?: Record<string, unknown> | null;
  feedback_comment?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AutoFigureEditAdminRevisionSummary {
  revision_id: string;
  session_id: string;
  seq: number;
  parent_revision_id?: string | null;
  source: string;
  action?: string | null;
  client_edit_id?: string | null;
  svg_sha256: string;
  svg_size: number;
  created_by_user_id?: string | null;
  created_by_user_email?: string | null;
  created_at?: string | null;
}

export interface AutoFigureEditAdminRevisionDetail extends AutoFigureEditAdminRevisionSummary {
  svg_content: string;
  metadata: Record<string, unknown>;
}

export interface AutoFigureEditAdminRevisionListResponse {
  session_id: string;
  total: number;
  skip: number;
  limit: number;
  items: AutoFigureEditAdminRevisionSummary[];
}

export interface AutoFigureEditAdminRatingMetricStats {
  count: number;
  average?: number | null;
  distribution: Record<string, number>;
}

export interface AutoFigureEditAdminStatsResponse {
  total_sessions: number;
  rated_sessions: number;
  rated_user_count: number;
  rating_submission_rate: number;
  status_counts: Record<string, number>;
  metrics: Record<string, AutoFigureEditAdminRatingMetricStats>;
}

export interface AutoFigureEditPricingConfig {
  resolution_1k_cost: number
  resolution_2k_cost: number
  resolution_4k_cost: number
}

export interface AutoFigureEditPricingConfigUpdateInput {
  resolution_1k_cost: number
  resolution_2k_cost: number
  resolution_4k_cost: number
}

export type AutoFigureEditStyleBadgeType = 'none' | 'new' | 'temporary' | 'beta' | 'hot'

export interface AutoFigureEditStylePreset {
  id: string
  code: string
  name_en: string
  name_zh?: string | null
  description_en?: string | null
  description_zh?: string | null
  warning_en?: string | null
  warning_zh?: string | null
  preview_image_url: string
  has_uploaded_image?: boolean
  reference_asset_name: string
  aliases: string[]
  badge_type: AutoFigureEditStyleBadgeType | string
  badge_text_en?: string | null
  badge_text_zh?: string | null
  sort_order: number
  is_active: boolean
  is_default: boolean
  created_at?: string | null
  updated_at?: string | null
}

export interface AutoFigureEditStylePresetListResponse {
  items: AutoFigureEditStylePreset[]
}

export interface AutoFigureEditStylePresetCreateInput {
  code: string
  name_en: string
  name_zh?: string
  description_en?: string
  description_zh?: string
  warning_en?: string
  warning_zh?: string
  reference_asset_name?: string
  aliases?: string[]
  badge_type?: AutoFigureEditStyleBadgeType | string
  badge_text_en?: string
  badge_text_zh?: string
  sort_order?: number
  is_active?: boolean
  is_default?: boolean
}

export interface AutoFigureEditStylePresetUpdateInput {
  code?: string
  name_en?: string
  name_zh?: string
  description_en?: string
  description_zh?: string
  warning_en?: string
  warning_zh?: string
  reference_asset_name?: string
  aliases?: string[]
  badge_type?: AutoFigureEditStyleBadgeType | string
  badge_text_en?: string
  badge_text_zh?: string
  sort_order?: number
  is_active?: boolean
  is_default?: boolean
}

export interface AutoFigureEditAdminSessionsParams extends PaginationParams {
  user_id?: string;
  workspace_id?: string;
  status?: string;
  feedback_submitted?: boolean;
}

// Project Monitoring
export interface AdminProjectSummary {
  id: string;
  name: string;
  owner_id: string;
  owner_email?: string | null;
  is_public: boolean;
  storage_used: number;
  file_count: number;
  member_count: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface AdminProjectListResponse {
  items: AdminProjectSummary[];
  total: number;
  skip: number;
  limit: number;
}

export interface AdminProjectMember {
  user_id: string;
  user_email?: string | null;
  role: string;
  joined_at: string;
  is_active: boolean;
}

export interface AdminShareLinkSummary {
  id: string;
  token_masked?: string | null;
  permission: string;
  allow_copy: boolean;
  is_active: boolean;
  access_count: number;
  last_accessed_at?: string | null;
  expires_at?: string | null;
  created_at?: string | null;
}

export interface AdminProjectAccessLog {
  id: string;
  project_id: string;
  project_name?: string | null;
  share_link_id?: string | null;
  access_type: string;
  user_id?: string | null;
  user_email?: string | null;
  ip_address?: string | null;
  accessed_at: string;
}

export interface AdminProjectAccessLogListResponse {
  items: AdminProjectAccessLog[];
  total: number;
  skip: number;
  limit: number;
}

export interface AdminProjectDetail {
  project: AdminProjectSummary;
  members: AdminProjectMember[];
  share_links: AdminShareLinkSummary[];
  access_logs: AdminProjectAccessLog[];
}

// File/Storage Monitoring
export interface AdminFileSummary {
  id: string;
  project_id: string;
  project_name?: string | null;
  name: string;
  type: string;
  mime_type?: string | null;
  size?: number | null;
  storage_key_masked?: string | null;
  storage_key?: string | null;
  created_by?: string | null;
  created_by_email?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface AdminFileListResponse {
  items: AdminFileSummary[];
  total: number;
  skip: number;
  limit: number;
}

export interface AdminFileVersionSummary {
  id: string;
  file_id: string;
  project_id: string;
  project_name?: string | null;
  version: number;
  size: number;
  storage_key_masked?: string | null;
  storage_key?: string | null;
  created_by?: string | null;
  created_by_email?: string | null;
  created_at: string;
}

export interface AdminFileVersionListResponse {
  items: AdminFileVersionSummary[];
  total: number;
  skip: number;
  limit: number;
}

export interface AdminUploadTaskSummary {
  id: string;
  project_id: string;
  project_name?: string | null;
  file_name: string;
  mime_type?: string | null;
  total_size: number;
  status: string;
  total_chunks: number;
  uploaded_chunks_count: number;
  created_by?: string | null;
  created_by_email?: string | null;
  created_at: string;
  updated_at: string;
  expires_at?: string | null;
}

export interface AdminUploadTaskListResponse {
  items: AdminUploadTaskSummary[];
  total: number;
  skip: number;
  limit: number;
}

// CLI Monitoring
export interface AdminCliSessionSummary {
  id: string;
  server_id: string;
  project_id: string;
  project_name?: string | null;
  actor_user_id?: string | null;
  actor_user_email?: string | null;
  session_type: string;
  connected_at: string;
  disconnected_at?: string | null;
  last_seq?: number | null;
  last_ack?: number | null;
  expires_at?: string | null;
}

export interface AdminCliSessionListResponse {
  items: AdminCliSessionSummary[];
  total: number;
  skip: number;
  limit: number;
}

export interface AdminCliLogObjectSummary {
  id: string;
  server_id: string;
  project_id: string;
  project_name?: string | null;
  object_key_masked?: string | null;
  object_key?: string | null;
  batch_id?: string | null;
  format: string;
  schema_version: string;
  compression: string;
  redacted: boolean;
  time_start: string;
  time_end: string;
  entry_count: number;
  object_size?: number | null;
  sha256: string;
  prev_sha256?: string | null;
}

export interface AdminCliLogObjectListResponse {
  items: AdminCliLogObjectSummary[];
  total: number;
  skip: number;
  limit: number;
}

export interface AdminCliMetricSummary {
  id: string;
  server_id: string;
  project_id: string;
  project_name?: string | null;
  timestamp: string;
  cpu_percent?: number | null;
  mem_percent?: number | null;
  disk_percent?: number | null;
  rtt_ms?: number | null;
}

export interface AdminCliMetricListResponse {
  items: AdminCliMetricSummary[];
  total: number;
  skip: number;
  limit: number;
}

// Plugin Monitoring
export interface AdminPluginSummary {
  id: string;
  name: string;
  version?: string | null;
  description?: string | null;
  permissions: string[];
  tool_count: number;
  risk_level: string;
  loaded: boolean;
}

export interface AdminPluginListResponse {
  items: AdminPluginSummary[];
}

export interface AdminPluginToolSummary {
  name: string;
  tool_type: string;
  plugin_id?: string | null;
  permissions: string[];
}

export interface AdminPluginToolListResponse {
  items: AdminPluginToolSummary[];
}

// AI Usage Monitoring
export interface AdminAIUsageCost {
  input_cost: number;
  output_cost: number;
  total_cost: number;
}

export interface AdminAIUsageRecord {
  id: string;
  user_id?: string | null;
  user_email?: string | null;
  project_id?: string | null;
  project_name?: string | null;
  session_id?: string | null;
  source: string;
  provider?: string | null;
  model?: string | null;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cached_tokens: number;
  reasoning_tokens: number;
  created_at: string;
  estimated_cost?: AdminAIUsageCost | null;
}

export interface AdminAIUsageListResponse {
  items: AdminAIUsageRecord[];
  total: number;
  skip: number;
  limit: number;
}

export interface AdminAIUsageTotals {
  requests_total: number;
  input_tokens_total: number;
  output_tokens_total: number;
  total_tokens_total: number;
  cached_tokens_total: number;
  reasoning_tokens_total: number;
}

export interface AdminAIUsageUserTotal {
  user_id: string;
  user_email?: string | null;
  requests_total: number;
  input_tokens_total: number;
  output_tokens_total: number;
  total_tokens_total: number;
  cached_tokens_total: number;
  reasoning_tokens_total: number;
  updated_at: string;
}

export interface AdminAIUsageSummaryResponse {
  totals: AdminAIUsageTotals;
  users: AdminAIUsageUserTotal[];
  users_total: number;
  skip: number;
  limit: number;
}

// System Health / Events
export interface AdminSystemHealthResponse {
  status: string;
  db_status: string;
  storage_status: string;
  cli_online: number;
  cli_offline: number;
  uptime_seconds: number;
  checked_at: string;
}

export interface AdminSystemEvent {
  id: string;
  severity: string;
  source: string;
  event_type: string;
  message: string;
  details: Record<string, unknown>;
  created_at: string;
  resolved_at?: string | null;
}

export interface AdminSystemEventListResponse {
  items: AdminSystemEvent[];
  total: number;
  skip: number;
  limit: number;
}

// Export Center
export interface AdminExportCreateInput {
  export_type: string;
  export_format?: 'json' | 'csv';
  reason?: string;
  filters?: Record<string, unknown>;
  limit?: number;
}

export interface AdminExportRecord {
  id: string;
  admin_id: string;
  export_type: string;
  status: string;
  export_format: string;
  reason?: string | null;
  filters: Record<string, unknown>;
  file_path?: string | null;
  file_size?: number | null;
  expires_at?: string | null;
  completed_at?: string | null;
  error_message?: string | null;
  download_count: number;
  created_at: string;
}

export interface AdminExportListResponse {
  items: AdminExportRecord[];
  total: number;
  skip: number;
  limit: number;
}

export interface AdminExportAccessLog {
  id: string;
  export_id: string;
  admin_id?: string | null;
  action: string;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface AdminExportAccessLogListResponse {
  items: AdminExportAccessLog[];
  total: number;
  skip: number;
  limit: number;
}

// Search & Saved Views
export interface AdminSearchResultItem {
  result_type: string;
  result_id: string;
  label: string;
  description?: string | null;
  metadata: Record<string, unknown>;
}

export interface AdminSearchResponse {
  items: AdminSearchResultItem[];
  total: number;
}

export interface AdminSearchQuery {
  id: string;
  admin_id: string;
  query: string;
  scope: string;
  results_count: number;
  filters: Record<string, unknown>;
  created_at: string;
}

export interface AdminSearchQueryListResponse {
  items: AdminSearchQuery[];
  total: number;
  skip: number;
  limit: number;
}

export interface AdminSavedViewCreateInput {
  name: string;
  module: string;
  description?: string;
  filters?: Record<string, unknown>;
  is_shared?: boolean;
}

export interface AdminSavedView {
  id: string;
  admin_id: string;
  name: string;
  module: string;
  description?: string | null;
  filters: Record<string, unknown>;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminSavedViewListResponse {
  items: AdminSavedView[];
  total: number;
  skip: number;
  limit: number;
}
