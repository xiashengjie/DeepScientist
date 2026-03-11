import { apiClient } from '@/lib/api/client'
import type {
  AdminPlanActionResponse,
  AdminPlanHistoryResponse,
  AdminPointsConfig,
  AdminPointsLedgerResponse,
  AdminPointsManualUpdateResponse,
  AdminPointsUserSnapshot,
  AdminUpgradeInterestUsersResponse,
  EntitlementRulesResponse,
  PlanCatalogItem,
  PlanCatalogResponse,
  PointsAlertSettingsResponse,
  PointsAutoChargeConfirmResponse,
  PointsAutoChargePreferenceItem,
  PointsAutoChargePreferencesResponse,
  PointsHistoryResponse,
  PointsInsights,
  PointsMembershipResponse,
  PointsPreviewResponse,
  PublicPricingResponse,
  PointsSummary,
  PointsActivitiesResponse,
  PointsInviteLinkResponse,
  PointsActivationRedeemResponse,
  AdminActivationCampaignItem,
  AdminActivationCodeGenerateResponse,
  AdminActivationClaimListResponse,
  UpgradeInterestResponse,
} from '@/lib/types/points'

const API_PREFIX = '/api/v1'

function isLocalPointsFallbackError(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const status = (error as { response?: { status?: number } }).response?.status
  return status === 404 || status === 405 || status === 501
}

function buildLocalPointsSummary(): PointsSummary {
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  return {
    user_id: 'local',
    daily_points_balance: 999999,
    daily_points_granted_today: 0,
    daily_points_consumed_today: 0,
    normal_points_balance: 999999,
    normal_points_cycle_total: 999999,
    normal_points_cycle_used: 0,
    normal_points_cycle_remaining: 999999,
    normal_points_cycle_expires_at: null,
    total_points_balance: 1999998,
    plan_tier: 'max',
    plan_status: 'active',
    plan_started_at: now.toISOString(),
    plan_expires_at: null,
    next_daily_refresh_at_utc: tomorrow,
    low_balance_alert_enabled: false,
    low_balance_threshold: 100,
    low_balance: false,
    feature_entitlements: {
      'projects.read': true,
      'lab.use': true,
      'copilot.use': true,
    },
  }
}

function buildLocalPointsMembership(): PointsMembershipResponse {
  return {
    current_tier: 'max',
    current_status: 'active',
    plan_started_at: new Date().toISOString(),
    plan_expires_at: null,
    plan_catalog: [],
    entitlement_rules: {},
    feature_entitlements: {
      'projects.read': true,
      'lab.use': true,
      'copilot.use': true,
    },
  }
}

export async function getPointsSummary(): Promise<PointsSummary> {
  try {
    const response = await apiClient.get<PointsSummary>(`${API_PREFIX}/points/summary`)
    return response.data
  } catch (error) {
    if (!isLocalPointsFallbackError(error)) {
      throw error
    }
    return buildLocalPointsSummary()
  }
}

export async function getPointsMembership(): Promise<PointsMembershipResponse> {
  try {
    const response = await apiClient.get<PointsMembershipResponse>(`${API_PREFIX}/points/membership`)
    return response.data
  } catch (error) {
    if (!isLocalPointsFallbackError(error)) {
      throw error
    }
    return buildLocalPointsMembership()
  }
}

export async function getPublicPricing(): Promise<PublicPricingResponse> {
  const response = await apiClient.get<PublicPricingResponse>(`${API_PREFIX}/points/public/pricing`)
  return response.data
}

export async function getPointsHistory(params?: { skip?: number; limit?: number }): Promise<PointsHistoryResponse> {
  try {
    const response = await apiClient.get<PointsHistoryResponse>(`${API_PREFIX}/points/history`, {
      params,
    })
    return response.data
  } catch (error) {
    if (!isLocalPointsFallbackError(error)) {
      throw error
    }
    return {
      items: [],
      total: 0,
      skip: params?.skip ?? 0,
      limit: params?.limit ?? 50,
    }
  }
}

export async function getPointsInsights(params?: { days?: number }): Promise<PointsInsights> {
  try {
    const response = await apiClient.get<PointsInsights>(`${API_PREFIX}/points/insights`, {
      params,
    })
    return response.data
  } catch (error) {
    if (!isLocalPointsFallbackError(error)) {
      throw error
    }
    return {
      days: params?.days ?? 30,
      total_consumed: 0,
      total_granted: 0,
      net_delta: 0,
    }
  }
}

export async function previewPointsCost(input: {
  action_code: string
  payload_hint?: Record<string, unknown>
}): Promise<PointsPreviewResponse> {
  const response = await apiClient.post<PointsPreviewResponse>(`${API_PREFIX}/points/preview`, input)
  return response.data
}

export async function getPointsAutoChargePreferences(): Promise<PointsAutoChargePreferencesResponse> {
  try {
    const response = await apiClient.get<PointsAutoChargePreferencesResponse>(`${API_PREFIX}/points/auto-charge/preferences`)
    return response.data
  } catch (error) {
    if (!isLocalPointsFallbackError(error)) {
      throw error
    }
    return { items: [] }
  }
}

export async function updatePointsAutoChargePreference(
  actionCode: string,
  input: {
    enabled: boolean
    max_single_charge?: number
    max_daily_auto_charge?: number
    expires_in_days?: number
    source?: string
  }
): Promise<PointsAutoChargePreferenceItem> {
  const response = await apiClient.put<PointsAutoChargePreferenceItem>(
    `${API_PREFIX}/points/auto-charge/preferences/${encodeURIComponent(actionCode)}`,
    input
  )
  return response.data
}

export async function confirmPointsAutoCharge(input: {
  action_code: string
  ref_id: string
  estimated_cost: number
  subscribe_auto_charge?: boolean
  max_single_charge?: number
  max_daily_auto_charge?: number
  expires_in_days?: number
  source?: string
}): Promise<PointsAutoChargeConfirmResponse> {
  const response = await apiClient.post<PointsAutoChargeConfirmResponse>(`${API_PREFIX}/points/auto-charge/confirm`, input)
  return response.data
}

export async function markUpgradeInterest(input: {
  target_plan?: 'free' | 'plus' | 'pro' | 'max'
  source?: string
}): Promise<UpgradeInterestResponse> {
  const response = await apiClient.post<UpgradeInterestResponse>(`${API_PREFIX}/points/upgrade-interest`, input)
  return response.data
}

export async function updatePointsAlerts(input: {
  enabled: boolean
  threshold: number
}): Promise<PointsAlertSettingsResponse> {
  const response = await apiClient.post<PointsAlertSettingsResponse>(`${API_PREFIX}/points/alerts`, input)
  return response.data
}

export async function getPointsActivities(): Promise<PointsActivitiesResponse> {
  try {
    const response = await apiClient.get<PointsActivitiesResponse>(`${API_PREFIX}/points/activities`)
    return response.data
  } catch (error) {
    if (!isLocalPointsFallbackError(error)) {
      throw error
    }
    return { items: [], invite: null }
  }
}

export async function getPointsInviteLink(): Promise<PointsInviteLinkResponse> {
  try {
    const response = await apiClient.get<PointsInviteLinkResponse>(`${API_PREFIX}/points/activities/invite-link`)
    return response.data
  } catch (error) {
    if (!isLocalPointsFallbackError(error)) {
      throw error
    }
    return {
      invitation_code: 'local',
      invitation_link: '',
      invite_count: 0,
      total_inviter_reward_points: 0,
    }
  }
}

export async function completeGithubStarActivity(): Promise<PointsActivationRedeemResponse> {
  const response = await apiClient.post<PointsActivationRedeemResponse>(`${API_PREFIX}/points/activities/github-star/complete`)
  return response.data
}

export async function redeemActivationCode(input: {
  code: string
  source?: string
}): Promise<PointsActivationRedeemResponse> {
  const response = await apiClient.post<PointsActivationRedeemResponse>(`${API_PREFIX}/points/activation/redeem`, {
    code: input.code,
    source: input.source || 'points_modal',
  })
  return response.data
}

export async function getAdminPointsConfig(): Promise<AdminPointsConfig> {
  const response = await apiClient.get<AdminPointsConfig>(`${API_PREFIX}/admin/points/config`)
  return response.data
}

export async function updateAdminPointsConfig(input: AdminPointsConfig): Promise<AdminPointsConfig> {
  const response = await apiClient.put<AdminPointsConfig>(`${API_PREFIX}/admin/points/config`, input)
  return response.data
}

export async function getAdminPlanCatalog(): Promise<PlanCatalogResponse> {
  const response = await apiClient.get<PlanCatalogResponse>(`${API_PREFIX}/admin/points/plan-catalog`)
  return response.data
}

export async function updateAdminPlanCatalog(input: { items: PlanCatalogItem[] }): Promise<PlanCatalogResponse> {
  const response = await apiClient.put<PlanCatalogResponse>(`${API_PREFIX}/admin/points/plan-catalog`, input)
  return response.data
}

export async function getAdminEntitlementRules(): Promise<EntitlementRulesResponse> {
  const response = await apiClient.get<EntitlementRulesResponse>(`${API_PREFIX}/admin/points/entitlement-rules`)
  return response.data
}

export async function updateAdminEntitlementRules(input: {
  rules: Record<string, ('free' | 'plus' | 'pro' | 'max')[]>
}): Promise<EntitlementRulesResponse> {
  const response = await apiClient.put<EntitlementRulesResponse>(`${API_PREFIX}/admin/points/entitlement-rules`, input)
  return response.data
}


export async function getAdminPlanHistory(params?: {
  skip?: number
  limit?: number
  user_id?: string
}): Promise<AdminPlanHistoryResponse> {
  const response = await apiClient.get<AdminPlanHistoryResponse>(`${API_PREFIX}/admin/points/plan/history`, {
    params,
  })
  return response.data
}

export async function getAdminPointsLedger(params?: {
  skip?: number
  limit?: number
}): Promise<AdminPointsLedgerResponse> {
  const response = await apiClient.get<AdminPointsLedgerResponse>(`${API_PREFIX}/admin/points/ledger`, {
    params,
  })
  return response.data
}

export async function getAdminUpgradeInterestUsers(params?: {
  skip?: number
  limit?: number
}): Promise<AdminUpgradeInterestUsersResponse> {
  const response = await apiClient.get<AdminUpgradeInterestUsersResponse>(
    `${API_PREFIX}/admin/points/upgrade-interest-users`,
    { params }
  )
  return response.data
}

export async function getAdminPointsUserSnapshot(userId: string): Promise<AdminPointsUserSnapshot> {
  const response = await apiClient.get<AdminPointsUserSnapshot>(`${API_PREFIX}/admin/points/user/snapshot`, {
    params: { user_id: userId },
  })
  return response.data
}

export async function adminManualUpdateUserPoints(input: {
  user_id: string
  plan_tier: 'free' | 'plus' | 'pro' | 'max'
  plan_status: 'active' | 'scheduled' | 'expired' | 'cancelled'
  plan_expires_at?: string | null
  daily_points_balance: number
  normal_points_balance: number
  reason: string
}): Promise<AdminPointsManualUpdateResponse> {
  const response = await apiClient.post<AdminPointsManualUpdateResponse>(
    `${API_PREFIX}/admin/points/user/manual-update`,
    input
  )
  return response.data
}

export async function adminGrantPlan(input: {
  user_id: string
  plan_tier: 'free' | 'plus' | 'pro' | 'max'
  months?: number
  reason: string
  idempotency_key?: string
}): Promise<AdminPlanActionResponse> {
  const response = await apiClient.post<AdminPlanActionResponse>(`${API_PREFIX}/admin/points/plan/grant`, input)
  return response.data
}

export async function adminExtendPlan(input: {
  user_id: string
  months?: number
  reason: string
  idempotency_key?: string
}): Promise<AdminPlanActionResponse> {
  const response = await apiClient.post<AdminPlanActionResponse>(`${API_PREFIX}/admin/points/plan/extend`, input)
  return response.data
}

export async function adminChangePlan(input: {
  user_id: string
  new_plan_tier: 'free' | 'plus' | 'pro' | 'max'
  reason: string
  idempotency_key?: string
}): Promise<AdminPlanActionResponse> {
  const response = await apiClient.post<AdminPlanActionResponse>(`${API_PREFIX}/admin/points/plan/change`, input)
  return response.data
}

export async function adminCancelPlan(input: {
  user_id: string
  keep_granted_points: boolean
  reason: string
  idempotency_key?: string
}): Promise<AdminPlanActionResponse> {
  const response = await apiClient.post<AdminPlanActionResponse>(`${API_PREFIX}/admin/points/plan/cancel`, input)
  return response.data
}


export async function getAdminActivationCampaigns(): Promise<AdminActivationCampaignItem[]> {
  const response = await apiClient.get<{ items: AdminActivationCampaignItem[] }>(`${API_PREFIX}/admin/points/activation/campaigns`)
  return response.data.items || []
}

export async function upsertAdminActivationCampaign(
  campaignKey: string,
  input: {
    title: string
    subtitle?: string
    description?: string
    thumbnail_url?: string
    trigger_type: string
    effect_type: string
    effect_config?: Record<string, unknown>
    is_active: boolean
    allow_repeat: boolean
    max_claims_per_user: number
    starts_at?: string | null
    ends_at?: string | null
  }
): Promise<AdminActivationCampaignItem> {
  const response = await apiClient.put<AdminActivationCampaignItem>(
    `${API_PREFIX}/admin/points/activation/campaigns/${encodeURIComponent(campaignKey)}`,
    input
  )
  return response.data
}

export async function toggleAdminActivationCampaign(
  campaignKey: string,
  isActive: boolean
): Promise<AdminActivationCampaignItem> {
  const response = await apiClient.patch<AdminActivationCampaignItem>(
    `${API_PREFIX}/admin/points/activation/campaigns/${encodeURIComponent(campaignKey)}/toggle`,
    { is_active: isActive }
  )
  return response.data
}

export async function generateAdminActivationCodes(
  campaignKey: string,
  input: {
    count: number
    max_uses: number
    expires_in_days?: number
    code_label?: string
    effect_type_override?: 'grant_points' | 'grant_plan' | 'upgrade_or_grant'
    effect_config_override?: Record<string, unknown>
    target_user_email?: string
    require_current_tier?: 'free' | 'plus' | 'pro' | 'max'
  }
): Promise<AdminActivationCodeGenerateResponse> {
  const response = await apiClient.post<AdminActivationCodeGenerateResponse>(
    `${API_PREFIX}/admin/points/activation/campaigns/${encodeURIComponent(campaignKey)}/codes`,
    input
  )
  return response.data
}

export async function getAdminActivationClaims(params?: {
  skip?: number
  limit?: number
  campaign_key?: string
  user_email?: string
}): Promise<AdminActivationClaimListResponse> {
  const response = await apiClient.get<AdminActivationClaimListResponse>(
    `${API_PREFIX}/admin/points/activation/claims`,
    { params }
  )
  return response.data
}
