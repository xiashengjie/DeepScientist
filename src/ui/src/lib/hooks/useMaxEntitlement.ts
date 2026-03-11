'use client'

import { useMemo } from 'react'
import { usePointsSummary } from '@/lib/hooks/usePoints'
import { isQuestRuntimeSurface } from '@/lib/runtime/quest-runtime'
import { useAuthStore } from '@/lib/stores/auth'

function resolveFeatureEntitlement(args: {
  feature: string
  featureEntitlements?: Record<string, boolean>
  isMaxActive: boolean
  isAdmin: boolean
}) {
  const { feature, featureEntitlements, isAdmin, isMaxActive } = args
  if (isAdmin) {
    return true
  }

  const lookup = (key: string) => {
    if (!featureEntitlements) return undefined
    if (!Object.prototype.hasOwnProperty.call(featureEntitlements, key)) return undefined
    return Boolean(featureEntitlements[key])
  }

  const exact = lookup(feature)
  if (typeof exact === 'boolean') {
    return exact
  }

  const fallbackCandidates: string[] = []
  if (feature.startsWith('projects.')) fallbackCandidates.push('projects.access')
  if (feature.startsWith('sessions.')) fallbackCandidates.push('sessions.use')
  if (feature.startsWith('copilot.')) fallbackCandidates.push('copilot.use')
  if (feature.startsWith('lab.')) fallbackCandidates.push('lab.use')
  if (feature.startsWith('cli.')) fallbackCandidates.push('cli.connect')
  if (feature.startsWith('autofigure.')) fallbackCandidates.push('autofigure.use')

  for (const candidate of fallbackCandidates) {
    const fallback = lookup(candidate)
    if (typeof fallback === 'boolean') {
      return fallback
    }
  }

  if (feature.startsWith('autofigure.')) {
    return true
  }

  return isMaxActive
}

export function useFeatureEntitlement(feature: string) {
  const { user } = useAuthStore()
  const summaryQuery = usePointsSummary()
  const isLocalRuntime = isQuestRuntimeSurface()

  const isAdmin = user?.role === 'admin' || isLocalRuntime
  const planTier = summaryQuery.data?.plan_tier
  const planStatus = summaryQuery.data?.plan_status
  const featureEntitlements = summaryQuery.data?.feature_entitlements

  const isMaxActive = isLocalRuntime || (planTier === 'max' && planStatus === 'active')
  const isEntitled = resolveFeatureEntitlement({
    feature,
    featureEntitlements,
    isMaxActive,
    isAdmin,
  })

  const isEntitlementLoading = useMemo(() => {
    if (isLocalRuntime) return false
    if (isAdmin) return false
    return summaryQuery.isLoading
  }, [isAdmin, isLocalRuntime, summaryQuery.isLoading])

  return {
    ...summaryQuery,
    isAdmin,
    planTier,
    planStatus,
    isMaxActive,
    isEntitlementLoading,
    isEntitled,
    feature,
  }
}

export function useMaxEntitlement(feature = 'deep_scientist_suite.use') {
  const featureQuery = useFeatureEntitlement(feature)

  return {
    ...featureQuery,
    isMaxEntitled: featureQuery.isEntitled,
  }
}
