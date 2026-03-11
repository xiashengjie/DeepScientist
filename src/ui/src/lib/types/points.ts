export type PointsPlanTier = 'free' | 'plus' | 'pro' | 'max'
export type PointsPlanStatus = 'active' | 'scheduled' | 'expired' | 'cancelled'

export interface PointsSummary {
  user_id: string
  daily_points_balance: number
  daily_points_granted_today: number
  daily_points_consumed_today: number
  normal_points_balance: number
  normal_points_cycle_total: number
  normal_points_cycle_used: number
  normal_points_cycle_remaining: number
  normal_points_cycle_expires_at?: string | null
  total_points_balance: number
  plan_tier: PointsPlanTier
  plan_status: PointsPlanStatus
  plan_started_at?: string | null
  plan_expires_at?: string | null
  next_daily_refresh_at_utc: string
  low_balance_alert_enabled: boolean
  low_balance_threshold: number
  low_balance: boolean
  feature_entitlements?: Record<string, boolean>
}

export interface PointsHistoryItem {
  id: string
  user_id: string
  action: string
  points_type: string
  delta: number
  before_daily: number
  after_daily: number
  before_normal: number
  after_normal: number
  daily_used: number
  normal_used: number
  reason?: string | null
  ref_type?: string | null
  ref_id?: string | null
  actor_type: string
  actor_id?: string | null
  created_at: string
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
  is_review_session?: boolean
  merged_entry_count?: number
  review_id?: string | null
  review_link?: string | null
  action_codes?: string[]
}

export interface PointsHistoryResponse {
  items: PointsHistoryItem[]
  total: number
  skip: number
  limit: number
}

export interface PointsInsights {
  days: number
  total_consumed: number
  total_granted: number
  net_delta: number
}

export interface PointsPreviewResponse {
  action_code: string
  estimated_cost: number
  required_minimum: number
  can_afford: boolean
  balance_before: number
  balance_after_estimated: number
}

export interface PointsAutoChargePreferenceItem {
  action_code: string
  enabled: boolean
  max_single_charge: number
  max_daily_auto_charge: number
  daily_spent_utc: number
  daily_reset_date_utc?: string | null
  source: string
  granted_at?: string | null
  revoked_at?: string | null
  expires_at?: string | null
}

export interface PointsAutoChargePreferencesResponse {
  items: PointsAutoChargePreferenceItem[]
}

export interface PointsAutoChargeConfirmResponse {
  action_code: string
  ref_id: string
  estimated_cost: number
  confirmation_token: string
  auto_charge_enabled: boolean
  message: string
}

export interface UpgradeInterestResponse {
  status: string
  already_marked: boolean
  message: string
  marked_at?: string | null
}

export interface PointsAlertSettingsResponse {
  enabled: boolean
  threshold: number
}

export interface PlanCatalogItem {
  tier: PointsPlanTier
  display_name: string
  price_usd_monthly: number
  monthly_normal_grant: number
  monthly_grant_expires: boolean
  daily_bonus: number
  is_active: boolean
}

export interface PlanCatalogResponse {
  items: PlanCatalogItem[]
}

export interface EntitlementRulesResponse {
  rules: Record<string, PointsPlanTier[]>
}

export interface PublicPricingActionCost {
  action_code: string
  display_name: string
  estimated_cost: number
  note?: string | null
}

export interface PublicPricingTokenRates {
  input_points_per_1m_tokens: number
  output_points_per_1m_tokens: number
}

export interface PublicPricingLegalEntity {
  brand_name: string
  legal_name_en: string
  legal_name_zh: string
  unified_social_credit_code: string
}

export interface PublicPricingLinks {
  pricing: string
  terms: string
  refund: string
  privacy: string
  pricing_sheet_download: string
}

export interface PublicPricingResponse {
  plans: PlanCatalogItem[]
  entitlement_rules: Record<string, PointsPlanTier[]>
  action_costs: PublicPricingActionCost[]
  token_pricing: PublicPricingTokenRates
  daily_base_amount: number
  legal_entity: PublicPricingLegalEntity
  links: PublicPricingLinks
  service_availability: string
  mainland_china_supported: boolean
  last_updated: string
}

export interface PointsMembershipResponse {
  current_tier: PointsPlanTier
  current_status: PointsPlanStatus
  plan_started_at?: string | null
  plan_expires_at?: string | null
  plan_catalog: PlanCatalogItem[]
  entitlement_rules: Record<string, PointsPlanTier[]>
  feature_entitlements: Record<string, boolean>
}

export interface PointsActivationSettlement {
  campaign_key: string
  campaign_title: string
  message: string
  action: string
  status: string
  plan_tier_before: PointsPlanTier
  plan_tier_after: PointsPlanTier
  daily_points_before: number
  daily_points_after: number
  normal_points_before: number
  normal_points_after: number
  total_points_before: number
  total_points_after: number
  delta_daily_points: number
  delta_normal_points: number
  delta_total_points: number
}

export interface PointsActivationRedeemResponse {
  status: string
  message: string
  already_claimed: boolean
  settlement?: PointsActivationSettlement | null
}

export interface PointsActivityItem {
  campaign_key: string
  title: string
  subtitle?: string | null
  description?: string | null
  thumbnail_url?: string | null
  trigger_type: string
  is_active: boolean
  completed: boolean
  claim_count: number
  max_claims_per_user: number
  reward_preview?: string | null
  github_repositories: string[]
  latest_settlement?: PointsActivationSettlement | null
}

export interface PointsInviteLinkResponse {
  invitation_code: string
  invitation_link: string
  invite_count: number
  total_inviter_reward_points: number
  latest_invitee_email?: string | null
}

export interface PointsActivitiesResponse {
  items: PointsActivityItem[]
  invite?: PointsInviteLinkResponse | null
}

export interface AdminActivationCampaignItem {
  id: string
  campaign_key: string
  title: string
  subtitle?: string | null
  description?: string | null
  thumbnail_url?: string | null
  trigger_type: string
  effect_type: string
  effect_config: Record<string, unknown>
  is_active: boolean
  allow_repeat: boolean
  max_claims_per_user: number
  starts_at?: string | null
  ends_at?: string | null
  created_at: string
  updated_at?: string | null
  is_official?: boolean
  reward_preview?: string | null
}

export interface AdminActivationClaimItem {
  id: string
  campaign_key: string
  user_id: string
  user_email?: string | null
  source: string
  source_ref?: string | null
  status: string
  message?: string | null
  settlement: Record<string, unknown>
  created_at: string
}

export interface AdminActivationCodeGeneratedItem {
  id: string
  code: string
  code_hint: string
  max_uses: number
  expires_at?: string | null
}

export interface AdminActivationCodeGenerateResponse {
  campaign_key: string
  generated: AdminActivationCodeGeneratedItem[]
}

export interface AdminActivationClaimListResponse {
  items: AdminActivationClaimItem[]
  total: number
  skip: number
  limit: number
}

export interface AdminPointsConfig {
  daily_base_amount: number
  signup_bonus_amount: number
  image_generation_cost: number
  signup_plus_activity_enabled: boolean
  signup_plus_activity_duration_days: number
  signup_event_template_id?: string | null
  signup_event_template_active?: boolean | null
}

export interface AdminPointsWalletState {
  plan_tier: PointsPlanTier
  plan_status: PointsPlanStatus
  plan_started_at?: string | null
  plan_expires_at?: string | null
  daily_points_balance: number
  normal_points_balance: number
  total_points_balance: number
}

export interface AdminReferralInviteeItem {
  user_id: string
  email: string
  invitation_code?: string | null
}

export interface AdminPointsUserSnapshot {
  user_id: string
  email: string
  username: string
  role: string
  is_active: boolean
  upgrade_interest_status: string
  registration_invitation_code?: string | null
  registration_inviter_user_id?: string | null
  registration_inviter_label?: string | null
  invited_users?: AdminReferralInviteeItem[]
  wallet: AdminPointsWalletState
}

export interface AdminPointsManualUpdateResponse {
  user: AdminPointsUserSnapshot
  before: AdminPointsWalletState
  after: AdminPointsWalletState
  broadcast_id?: string | null
}

export interface AdminPlanActionResponse {
  user_id: string
  plan_tier: PointsPlanTier
  plan_status: PointsPlanStatus
  plan_started_at?: string | null
  plan_expires_at?: string | null
  broadcast_id?: string | null
}

export interface AdminPlanMutationInputBase {
  user_id: string
  reason: string
  idempotency_key?: string
}

export interface AdminUpgradeInterestUser {
  id: string
  email: string
  username: string
  upgrade_interest_status: string
  upgrade_interest_marked_at?: string | null
  upgrade_interest_source?: string | null
}

export interface AdminUpgradeInterestUsersResponse {
  items: AdminUpgradeInterestUser[]
  total: number
  skip: number
  limit: number
}


export interface AdminPlanHistoryItem {
  id: string
  user_id: string
  action: string
  old_plan_tier?: string | null
  new_plan_tier?: string | null
  old_plan_status?: string | null
  new_plan_status?: string | null
  old_expires_at?: string | null
  new_expires_at?: string | null
  reason?: string | null
  actor_type: string
  actor_id?: string | null
  created_at: string
}

export interface AdminPlanHistoryResponse {
  items: AdminPlanHistoryItem[]
  total: number
  skip: number
  limit: number
}

export interface AdminPointsLedgerResponse {
  items: PointsHistoryItem[]
  total: number
  skip: number
  limit: number
}
