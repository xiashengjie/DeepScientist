'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adminManualUpdateUserPoints,
  adminCancelPlan,
  adminChangePlan,
  adminExtendPlan,
  adminGrantPlan,
  confirmPointsAutoCharge,
  getAdminEntitlementRules,
  getAdminPointsLedger,
  getAdminPlanCatalog,
  getAdminPlanHistory,
  getAdminPointsConfig,
  getPublicPricing,
  getAdminPointsUserSnapshot,
  getAdminUpgradeInterestUsers,
  getPointsAutoChargePreferences,
  getPointsHistory,
  getPointsInsights,
  getPointsMembership,
  getPointsSummary,
  markUpgradeInterest,
  updateAdminEntitlementRules,
  updateAdminPlanCatalog,
  updateAdminPointsConfig,
  updatePointsAutoChargePreference,
  updatePointsAlerts,
  getPointsActivities,
  getPointsInviteLink,
  redeemActivationCode,
  completeGithubStarActivity,
  getAdminActivationCampaigns,
  upsertAdminActivationCampaign,
  toggleAdminActivationCampaign,
  generateAdminActivationCodes,
  getAdminActivationClaims,
} from '@/lib/api/points'
import { supportsPoints } from '@/lib/runtime/quest-runtime'

export const pointsKeys = {
  all: ['points'] as const,
  summary: () => [...pointsKeys.all, 'summary'] as const,
  membership: () => [...pointsKeys.all, 'membership'] as const,
  history: (params?: { skip?: number; limit?: number }) => [...pointsKeys.all, 'history', params] as const,
  insights: (params?: { days?: number }) => [...pointsKeys.all, 'insights', params] as const,
  autoChargePreferences: () => [...pointsKeys.all, 'auto-charge-preferences'] as const,
  activities: () => [...pointsKeys.all, 'activities'] as const,
  inviteLink: () => [...pointsKeys.all, 'invite-link'] as const,
  adminConfig: () => [...pointsKeys.all, 'admin', 'config'] as const,
  adminPlanCatalog: () => [...pointsKeys.all, 'admin', 'plan-catalog'] as const,
  adminEntitlementRules: () => [...pointsKeys.all, 'admin', 'entitlement-rules'] as const,
  adminPlanHistory: (params?: { skip?: number; limit?: number; user_id?: string }) =>
    [...pointsKeys.all, 'admin', 'plan-history', params] as const,
  adminLedger: (params?: { skip?: number; limit?: number }) =>
    [...pointsKeys.all, 'admin', 'ledger', params] as const,
  adminUpgradeInterest: (params?: { skip?: number; limit?: number }) =>
    [...pointsKeys.all, 'admin', 'upgrade-interest', params] as const,
  adminUserSnapshot: (userId?: string) => [...pointsKeys.all, 'admin', 'user-snapshot', userId] as const,
  publicPricing: () => [...pointsKeys.all, 'public-pricing'] as const,
  adminActivationCampaigns: () => [...pointsKeys.all, 'admin', 'activation-campaigns'] as const,
  adminActivationClaims: (params?: { skip?: number; limit?: number; campaign_key?: string; user_email?: string }) =>
    [...pointsKeys.all, 'admin', 'activation-claims', params] as const,
}

function isPointsRuntimeEnabled() {
  return supportsPoints()
}

export function usePointsSummary() {
  return useQuery({
    queryKey: pointsKeys.summary(),
    queryFn: getPointsSummary,
    enabled: isPointsRuntimeEnabled(),
  })
}

export function usePointsMembership() {
  return useQuery({
    queryKey: pointsKeys.membership(),
    queryFn: getPointsMembership,
    enabled: isPointsRuntimeEnabled(),
  })
}

export function usePublicPricing() {
  return useQuery({
    queryKey: pointsKeys.publicPricing(),
    queryFn: getPublicPricing,
    staleTime: 60 * 1000,
  })
}

export function usePointsHistory(params?: { skip?: number; limit?: number }) {
  return useQuery({
    queryKey: pointsKeys.history(params),
    queryFn: () => getPointsHistory(params),
    enabled: isPointsRuntimeEnabled(),
  })
}

export function usePointsInsights(params?: { days?: number }) {
  return useQuery({
    queryKey: pointsKeys.insights(params),
    queryFn: () => getPointsInsights(params),
    enabled: isPointsRuntimeEnabled(),
  })
}

export function usePointsAutoChargePreferences() {
  return useQuery({
    queryKey: pointsKeys.autoChargePreferences(),
    queryFn: getPointsAutoChargePreferences,
    enabled: isPointsRuntimeEnabled(),
  })
}

export function usePointsActivities() {
  return useQuery({
    queryKey: pointsKeys.activities(),
    queryFn: getPointsActivities,
    enabled: isPointsRuntimeEnabled(),
  })
}

export function usePointsInviteLink() {
  return useQuery({
    queryKey: pointsKeys.inviteLink(),
    queryFn: getPointsInviteLink,
    enabled: isPointsRuntimeEnabled(),
  })
}

export function useRedeemActivationCode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: redeemActivationCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsKeys.summary() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.membership() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.history() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.activities() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.inviteLink() })
    },
  })
}

export function useCompleteGithubStarActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: completeGithubStarActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsKeys.summary() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.membership() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.history() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.activities() })
    },
  })
}

export function useUpdatePointsAutoChargePreference() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      actionCode,
      enabled,
      max_single_charge,
      max_daily_auto_charge,
      expires_in_days,
      source,
    }: {
      actionCode: string
      enabled: boolean
      max_single_charge?: number
      max_daily_auto_charge?: number
      expires_in_days?: number
      source?: string
    }) =>
      updatePointsAutoChargePreference(actionCode, {
        enabled,
        max_single_charge,
        max_daily_auto_charge,
        expires_in_days,
        source,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsKeys.autoChargePreferences() })
    },
  })
}

export function useConfirmPointsAutoCharge() {
  return useMutation({
    mutationFn: confirmPointsAutoCharge,
  })
}

export function useMarkUpgradeInterest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markUpgradeInterest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsKeys.summary() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.adminUpgradeInterest() })
    },
  })
}

export function useUpdatePointsAlerts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updatePointsAlerts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsKeys.summary() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.membership() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.adminPlanHistory() })
    },
  })
}

export function useAdminPointsConfig() {
  return useQuery({
    queryKey: pointsKeys.adminConfig(),
    queryFn: getAdminPointsConfig,
  })
}

export function useUpdateAdminPointsConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateAdminPointsConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsKeys.adminConfig() })
    },
  })
}

export function useAdminPlanCatalog() {
  return useQuery({
    queryKey: pointsKeys.adminPlanCatalog(),
    queryFn: getAdminPlanCatalog,
  })
}

export function useUpdateAdminPlanCatalog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateAdminPlanCatalog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsKeys.adminPlanCatalog() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.membership() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.summary() })
    },
  })
}

export function useAdminEntitlementRules() {
  return useQuery({
    queryKey: pointsKeys.adminEntitlementRules(),
    queryFn: getAdminEntitlementRules,
  })
}

export function useUpdateAdminEntitlementRules() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateAdminEntitlementRules,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsKeys.adminEntitlementRules() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.membership() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.summary() })
    },
  })
}


export function useAdminPlanHistory(params?: { skip?: number; limit?: number; user_id?: string }) {
  return useQuery({
    queryKey: pointsKeys.adminPlanHistory(params),
    queryFn: () => getAdminPlanHistory(params),
  })
}

export function useAdminPointsLedger(params?: { skip?: number; limit?: number }) {
  return useQuery({
    queryKey: pointsKeys.adminLedger(params),
    queryFn: () => getAdminPointsLedger(params),
  })
}

export function useAdminUpgradeInterestUsers(params?: { skip?: number; limit?: number }) {
  return useQuery({
    queryKey: pointsKeys.adminUpgradeInterest(params),
    queryFn: () => getAdminUpgradeInterestUsers(params),
  })
}

export function useAdminPointsUserSnapshot(userId?: string) {
  return useQuery({
    queryKey: pointsKeys.adminUserSnapshot(userId),
    queryFn: () => getAdminPointsUserSnapshot(userId || ''),
    enabled: Boolean(userId),
  })
}

export function useAdminManualUpdateUserPoints() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: adminManualUpdateUserPoints,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: pointsKeys.adminUpgradeInterest() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.summary() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.membership() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.adminPlanHistory() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.adminLedger() })
      if (response?.user?.user_id) {
        queryClient.invalidateQueries({ queryKey: pointsKeys.adminUserSnapshot(response.user.user_id) })
      }
    },
  })
}

export function useAdminGrantPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: adminGrantPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsKeys.adminUpgradeInterest() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.summary() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.membership() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.adminPlanHistory() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.adminLedger() })
    },
  })
}

export function useAdminExtendPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: adminExtendPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsKeys.adminUpgradeInterest() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.summary() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.membership() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.adminPlanHistory() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.adminLedger() })
    },
  })
}

export function useAdminChangePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: adminChangePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsKeys.adminUpgradeInterest() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.summary() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.membership() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.adminPlanHistory() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.adminLedger() })
    },
  })
}

export function useAdminCancelPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: adminCancelPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsKeys.adminUpgradeInterest() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.summary() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.membership() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.adminPlanHistory() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.adminLedger() })
    },
  })
}


export function useAdminActivationCampaigns() {
  return useQuery({
    queryKey: pointsKeys.adminActivationCampaigns(),
    queryFn: getAdminActivationCampaigns,
  })
}

export function useUpsertAdminActivationCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      campaignKey,
      payload,
    }: {
      campaignKey: string
      payload: {
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
    }) => upsertAdminActivationCampaign(campaignKey, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsKeys.adminActivationCampaigns() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.activities() })
    },
  })
}

export function useToggleAdminActivationCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ campaignKey, isActive }: { campaignKey: string; isActive: boolean }) =>
      toggleAdminActivationCampaign(campaignKey, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsKeys.adminActivationCampaigns() })
      queryClient.invalidateQueries({ queryKey: pointsKeys.activities() })
    },
  })
}

export function useGenerateAdminActivationCodes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      campaignKey,
      payload,
    }: {
      campaignKey: string
      payload: {
        count: number
        max_uses: number
        expires_in_days?: number
        code_label?: string
        effect_type_override?: 'grant_points' | 'grant_plan' | 'upgrade_or_grant'
        effect_config_override?: Record<string, unknown>
        target_user_email?: string
        require_current_tier?: 'free' | 'plus' | 'pro' | 'max'
      }
    }) => generateAdminActivationCodes(campaignKey, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsKeys.adminActivationCampaigns() })
    },
  })
}

export function useAdminActivationClaims(params?: {
  skip?: number
  limit?: number
  campaign_key?: string
  user_email?: string
}) {
  return useQuery({
    queryKey: pointsKeys.adminActivationClaims(params),
    queryFn: () => getAdminActivationClaims(params),
  })
}
