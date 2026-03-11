'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import axios from 'axios'
import {
  ArrowLeft,
  Activity,
  ArrowUpRight,
  BadgeCheck,
  Bot,
  Circle,
  Copy,
  Clock3,
  Crown,
  FlaskConical,
  FolderKanban,
  Gem,
  Github,
  History,
  LayoutGrid,
  Megaphone,
  Star,
  Sparkles,
  UserPlus,
  Terminal,
  type LucideIcon,
} from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import {
  useMarkUpgradeInterest,
  usePointsAutoChargePreferences,
  usePointsHistory,
  usePointsInsights,
  usePointsMembership,
  usePointsSummary,
  useUpdatePointsAutoChargePreference,
  usePointsActivities,
  useRedeemActivationCode,
  useCompleteGithubStarActivity,
} from '@/lib/hooks/usePoints'
import { RollingPointsNumber } from '@/components/points/RollingPointsNumber'
import { ActivationSettlementCard } from '@/components/points/ActivationSettlementCard'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api/client'
import { useI18n } from '@/lib/i18n/useI18n'
import {
  bindMyGithubPushInstallation,
  getMyIntegrations,
  startMyGithubStarMissionAuthorization,
  startMyGithubPushBinding,
} from '@/lib/api/users'
import type {
  PlanCatalogItem,
  PointsActivationSettlement,
  PointsActivityItem,
  PointsPlanTier,
} from '@/lib/types/points'

type PointsPanelTab = 'usage' | 'membership' | 'history' | 'activities' | 'activation'
type ActivityCampaignKey = 'social_boost' | 'github_star' | 'invite_referral'

const TIER_ORDER: PointsPlanTier[] = ['free', 'plus', 'pro', 'max']

const FEATURE_LABELS: Record<string, string> = {
  'autofigure.use': 'AutoFigure image generation and editing',
  'autofigure.edit.4k': 'AutoFigure image generation and editing with 4K resolution',
  'review.use': 'AI Reviewer (PDF upload, parsing, and structured review)',
  'rebuttal.use': 'AI Rebuttal (PDF upload, parsing, and structured rebuttal)',
  'projects.access': 'Open projects workspace',
  'projects.create': 'Create new projects',
  'projects.read': 'Open existing projects',
  'projects.update': 'Edit project settings',
  'projects.delete': 'Delete projects',
  'projects.list': 'View projects list',
  'projects.members': 'Manage collaborators',
  'projects.share': 'Share projects with teammates',
  'projects.files': 'Manage project files',
  'projects.annotations': 'Review and annotate papers',
  'projects.notebooks': 'Write and edit notebooks',
  'projects.copy': 'Duplicate projects',
  'copilot.use': 'Use Copilot assistant',
  'lab.use': 'Use Lab plugin',
  'cli.connect': 'Connect CLI client',
  'deep_scientist_suite.use': 'Use DeepScientist advanced suite',
  'sessions.use': 'Run AI research sessions',
}

function humanizeFeatureCode(feature: string): string {
  if (!feature) return 'Feature access'
  const normalized = feature.replace(/[._]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!normalized) return 'Feature access'
  return normalized
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function toFeatureLabel(feature: string): string {
  return FEATURE_LABELS[feature] || humanizeFeatureCode(feature)
}

function renderPrivilegeLabel(label: string) {
  const parts = String(label || '').split(/(4K)/g)
  return parts.map((part, index) =>
    part === '4K' ? (
      <span
        key={`${part}-${index}`}
        className="bg-[linear-gradient(120deg,#6f3c3c,#8f4f4f,#7f3939)] bg-clip-text font-semibold text-transparent"
      >
        {part}
      </span>
    ) : (
      part
    )
  )
}

type PrivilegeItem = {
  code: string
  label: string
}

function privilegeItemIcon(code: string) {
  if (code === 'max.never_expire') return <Gem className="h-3.5 w-3.5" />
  if (code.startsWith('projects.')) return <FolderKanban className="h-3.5 w-3.5" />
  if (code.startsWith('autofigure.')) return <FlaskConical className="h-3.5 w-3.5" />
  if (code.startsWith('review.')) return <Bot className="h-3.5 w-3.5" />
  if (code.startsWith('rebuttal.')) return <Bot className="h-3.5 w-3.5" />
  if (code.startsWith('copilot.')) return <Bot className="h-3.5 w-3.5" />
  if (code.startsWith('cli.')) return <Terminal className="h-3.5 w-3.5" />
  if (code.startsWith('lab.')) return <FlaskConical className="h-3.5 w-3.5" />
  if (code.startsWith('deep_scientist_suite.')) return <Gem className="h-3.5 w-3.5" />
  if (code.startsWith('sessions.')) return <BadgeCheck className="h-3.5 w-3.5" />
  return <BadgeCheck className="h-3.5 w-3.5" />
}

const MEMBERSHIP_STYLE: Record<
  PointsPlanTier,
  {
    shell: string
    badge: string
    title: string
  }
> = {
  free: {
    shell: 'border-[#d8d5cf] bg-[#f7f6f4] text-[#3f3b36]',
    badge: 'border-[#c8c4be] bg-white text-[#5d5852]',
    title: 'text-[#3f3b36]',
  },
  plus: {
    shell: 'border-[#c7c8c2] bg-[#edf0ea] text-[#38403a]',
    badge: 'border-[#b5b8b0] bg-white text-[#495148]',
    title: 'text-[#38403a]',
  },
  pro: {
    shell: 'border-[#c8aa6f] bg-[#f7f0e5] text-[#3f3020]',
    badge: 'border-[#b79252] bg-[#fff9ee] text-[#6e4f21]',
    title: 'text-[#3f3020]',
  },
  max: {
    shell: 'border-[#3b3a36] bg-[#1f1f1d] text-[#f6f1e6]',
    badge: 'border-[#6d5b3d] bg-[#2b2a26] text-[#e9d6ad]',
    title: 'text-[#f6f1e6]',
  },
}

const PANEL_TABS: Array<{
  key: PointsPanelTab
  label: string
  desc: string
}> = [
  { key: 'usage', label: 'Usage & Credits', desc: 'Balance, insights, auto-charge' },
  { key: 'membership', label: 'Membership', desc: 'Free / Plus / Pro / Max' },
  { key: 'history', label: 'History', desc: 'All credit records' },
  { key: 'activities', label: 'Activities', desc: 'Missions, invites, rewards' },
  { key: 'activation', label: 'Activation', desc: 'Redeem code and apply rewards' },
]

const ACTIVITY_ORDER: ActivityCampaignKey[] = ['social_boost', 'github_star', 'invite_referral']
const AUTOFIGURE_EDIT_AUTO_CHARGE_ACTION = 'autofigure.edit.run'
const ACTIVITY_CARD_SHELL_CLASS = 'border-gray-300 bg-gray-50 hover:bg-gray-100'
const ACTIVITY_CARD_ICON_CLASS = 'border-gray-300 bg-white text-gray-700'

const ACTIVITY_META: Record<
  ActivityCampaignKey,
  {
    title: string
    subtitle: string
    reward: string
    shellClass: string
    iconClass: string
    icon: LucideIcon
  }
> = {
  social_boost: {
    title: 'Social Promotion Mission',
    subtitle: 'Share AutoFigure on social platforms and verify your post proof.',
    reward: 'Pro package (4000 monthly + 200 daily) or +4000 normal points for Pro/Max.',
    shellClass: ACTIVITY_CARD_SHELL_CLASS,
    iconClass: ACTIVITY_CARD_ICON_CLASS,
    icon: Megaphone,
  },
  github_star: {
    title: 'GitHub Star Mission',
    subtitle: 'Connect GitHub once, then complete starring in one click.',
    reward: 'Reward: +1000 normal points after all required stars are verified.',
    shellClass: ACTIVITY_CARD_SHELL_CLASS,
    iconClass: ACTIVITY_CARD_ICON_CLASS,
    icon: Github,
  },
  invite_referral: {
    title: 'Invite User Mission',
    subtitle: 'Share your invitation link and grow your referral achievements.',
    reward: 'Invitee +500, inviter +1000 per success, and Pro upgrade at 10 invites.',
    shellClass: ACTIVITY_CARD_SHELL_CLASS,
    iconClass: ACTIVITY_CARD_ICON_CLASS,
    icon: UserPlus,
  },
}

function isActivityCampaignKey(value: string): value is ActivityCampaignKey {
  return ACTIVITY_ORDER.includes(value as ActivityCampaignKey)
}

function buildFallbackActivity(campaignKey: ActivityCampaignKey): PointsActivityItem {
  const meta = ACTIVITY_META[campaignKey]
  return {
    campaign_key: campaignKey,
    title: meta.title,
    subtitle: meta.subtitle,
    description: meta.subtitle,
    thumbnail_url: null,
    trigger_type: 'manual',
    is_active: false,
    completed: false,
    claim_count: 0,
    max_claims_per_user: 1,
    reward_preview: meta.reward,
    github_repositories: campaignKey === 'github_star'
      ? ['ResearAI/DeepScientist', 'ResearAI/AutoFigure-Edit', 'ResearAI/AutoFigure']
      : [],
    latest_settlement: null,
  }
}

function formatNumber(value: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(Number(value || 0))
}

function formatDate(value?: string | null, locale: string = 'en-US'): string {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleString(locale)
}

function tierRank(tier: PointsPlanTier | undefined): number {
  if (!tier) return 0
  const index = TIER_ORDER.indexOf(tier)
  return index >= 0 ? index : 0
}

function tierIcon(tier: PointsPlanTier) {
  if (tier === 'max') return <Gem className="h-4 w-4" />
  if (tier === 'pro') return <Crown className="h-4 w-4" />
  if (tier === 'plus') return <Sparkles className="h-4 w-4" />
  return <Circle className="h-4 w-4" />
}

function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as
      | {
          detail?: unknown
          message?: unknown
        }
      | undefined

    const detail = payload?.detail
    if (typeof detail === 'string' && detail.trim()) {
      return detail.trim()
    }

    if (Array.isArray(detail)) {
      for (const item of detail) {
        if (typeof item === 'string' && item.trim()) return item.trim()
        if (item && typeof item === 'object') {
          const nested = (item as { msg?: unknown }).msg
          if (typeof nested === 'string' && nested.trim()) return nested.trim()
        }
      }
    }

    if (typeof payload?.message === 'string' && payload.message.trim()) {
      return payload.message.trim()
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

function shouldStartGithubIdentityAuthorization(detail: string): boolean {
  const normalized = detail.trim().toLowerCase()
  if (!normalized) return false

  return [
    'authorization required',
    'authorize github',
    'authorization has expired',
    'authorization is invalid',
    'authorization is missing',
    'star mission authorization',
    'refresh your github access token',
    'reconnect your account',
    'starring permission',
  ].some((keyword) => normalized.includes(keyword))
}

function shouldStartGithubPushSetup(detail: string): boolean {
  const normalized = detail.trim().toLowerCase()
  if (!normalized) return false

  return [
    'complete github push setup',
    'bind github push',
    'github push setup first',
    'github push first',
    'setup github push',
    'installation permissions are incomplete',
    'reauthorize/reinstall the github app',
    'installed github apps',
    'permissions were updated but not reauthorized',
  ].some((keyword) => normalized.includes(keyword))
}

function buildGithubMissionReturnPath(mode: 'bind_only' | 'auto_verify' = 'bind_only'): string {
  if (typeof window === 'undefined') return '/projects?points_activity=github_star'
  const url = new URL(window.location.href)
  for (const key of [
    'installation_id',
    'setup_action',
    'state',
    'github_push_error',
    'github_login_ticket',
    'github_star_authorized',
    'github_error',
    'github_error_description',
    'github_mission_mode',
  ]) {
    url.searchParams.delete(key)
  }
  url.searchParams.set('points_activity', 'github_star')
  url.searchParams.set('github_mission_mode', mode)
  return `${url.pathname}${url.search}`
}

function hasGithubMissionQuery(params: URLSearchParams): boolean {
  const raw = (params.get('points_activity') || '').trim().toLowerCase()
  return raw === 'github_star' || raw.startsWith('github_star?')
}

function hasActivitiesAutoOpenQuery(params: URLSearchParams): boolean {
  const raw = (params.get('points_activity') || '').trim().toLowerCase()
  return raw === 'activities'
}

function getGithubMissionQueryParam(params: URLSearchParams, key: string): string | null {
  const direct = params.get(key)
  if (direct) return direct

  const rawActivity = (params.get('points_activity') || '').trim()
  const queryIndex = rawActivity.indexOf('?')
  if (queryIndex < 0) return null

  const nested = new URLSearchParams(rawActivity.slice(queryIndex + 1))
  return nested.get(key)
}

function buildGithubMissionAutoOpenKey(params: URLSearchParams): string | null {
  const parts: string[] = []
  const rawActivity = (params.get('points_activity') || '').trim()
  const hasMissionActivity = hasGithubMissionQuery(params)
  const githubLoginTicket = (params.get('github_login_ticket') || '').trim()
  const githubStarAuthorized = (params.get('github_star_authorized') || '').trim()
  const githubError = (params.get('github_error') || '').trim()
  const githubErrorDescription = (params.get('github_error_description') || '').trim()
  const githubPushError = (getGithubMissionQueryParam(params, 'github_push_error') || '').trim()
  const installationId = (getGithubMissionQueryParam(params, 'installation_id') || '').trim()
  const state = (getGithubMissionQueryParam(params, 'state') || '').trim()
  const missionMode = (getGithubMissionQueryParam(params, 'github_mission_mode') || '').trim().toLowerCase()

  if (hasMissionActivity) {
    parts.push(`activity:${rawActivity || 'github_star'}`)
  }
  if (githubLoginTicket) parts.push(`ticket:${githubLoginTicket}`)
  if (githubStarAuthorized) parts.push(`star_auth:${githubStarAuthorized}`)
  if (githubError) parts.push(`error:${githubError}`)
  if (githubErrorDescription) parts.push(`error_desc:${githubErrorDescription}`)
  if (githubPushError) parts.push(`push_error:${githubPushError}`)
  if (installationId) parts.push(`installation:${installationId}`)
  if (state) parts.push(`state:${state}`)
  if (missionMode) parts.push(`mode:${missionMode}`)

  return parts.length ? parts.join('|') : null
}

function hasGithubMissionCallbackSignal(params: URLSearchParams): boolean {
  return Boolean(
    (params.get('github_login_ticket') || '').trim() ||
      (params.get('github_star_authorized') || '').trim() ||
      (params.get('github_error') || '').trim() ||
      (getGithubMissionQueryParam(params, 'github_push_error') || '').trim() ||
      (getGithubMissionQueryParam(params, 'installation_id') || '').trim() ||
      (getGithubMissionQueryParam(params, 'state') || '').trim()
  )
}

const ACTIVATION_CODE_ALLOWED_RE = /^[A-Z0-9-]+$/

function normalizeActivationCodeInput(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 32)
}

function isActivationCodeShapeValid(value: string): boolean {
  const normalized = value.trim().toUpperCase()
  return normalized.length >= 6 && ACTIVATION_CODE_ALLOWED_RE.test(normalized)
}

function resolvePatternStyle(tier: PointsPlanTier): CSSProperties | undefined {
  if (tier === 'pro') {
    return {
      backgroundImage:
        'radial-gradient(circle at 14% 18%, rgba(189,146,74,0.22), transparent 35%), radial-gradient(circle at 85% 78%, rgba(189,146,74,0.18), transparent 40%), repeating-linear-gradient(45deg, rgba(164,126,63,0.17), rgba(164,126,63,0.17) 2px, transparent 2px, transparent 9px)',
    }
  }
  if (tier === 'max') {
    return {
      backgroundImage:
        'radial-gradient(circle at 18% 22%, rgba(201,171,116,0.22), transparent 36%), radial-gradient(circle at 82% 70%, rgba(201,171,116,0.2), transparent 42%), repeating-linear-gradient(135deg, rgba(124,103,68,0.18), rgba(124,103,68,0.18) 1px, transparent 1px, transparent 8px)',
    }
  }
  return undefined
}

export function PointsOverviewSheet({
  open,
  onOpenChange,
  source,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  source: 'projects_topbar' | 'workspace_topbar'
}) {
  const { addToast } = useToast()
  const { t, language } = useI18n('points')
  const { t: tCommon } = useI18n('common')
  const tp = useCallback(
    (text: string, variables?: Record<string, string | number>) => t(text, variables, text),
    [t]
  )
  const locale = language === 'zh-CN' ? 'zh-CN' : 'en-US'
  const planLabel = useCallback(
    (planTier?: string): string => {
      if (planTier === 'plus') return tCommon('plan_tier_plus')
      if (planTier === 'pro') return tCommon('plan_tier_pro')
      if (planTier === 'max') return tCommon('plan_tier_max')
      return tCommon('plan_tier_free')
    },
    [tCommon]
  )
  const [activeTab, setActiveTab] = useState<PointsPanelTab>('usage')

  const { data: summary, isLoading: summaryLoading } = usePointsSummary()
  const membershipQuery = usePointsMembership()
  const { data: history, isLoading: historyLoading } = usePointsHistory({ skip: 0, limit: 80 })
  const { data: insights } = usePointsInsights({ days: 30 })
  const activitiesQuery = usePointsActivities()

  const autoChargePreferences = usePointsAutoChargePreferences()
  const updateAutoChargePreference = useUpdatePointsAutoChargePreference()
  const markUpgrade = useMarkUpgradeInterest()
  const redeemActivation = useRedeemActivationCode()
  const completeGithubStar = useCompleteGithubStarActivity()

  const [selectedActivity, setSelectedActivity] = useState<ActivityCampaignKey | null>(null)
  const [activationCodeInput, setActivationCodeInput] = useState('')
  const [activationMessage, setActivationMessage] = useState('')
  const [latestSettlement, setLatestSettlement] = useState<PointsActivationSettlement | null>(null)
  const [activationResultHighlight, setActivationResultHighlight] = useState(false)
  const [activityNotice, setActivityNotice] = useState('')
  const [githubBindingInProgress, setGithubBindingInProgress] = useState(false)
  const [githubAutoVerifyPending, setGithubAutoVerifyPending] = useState(false)
  const [githubPushBound, setGithubPushBound] = useState<boolean | null>(null)
  const [wechatQrPreviewOpen, setWechatQrPreviewOpen] = useState(false)
  const githubBoundTicketRef = useRef('')
  const githubIdentityTicketRef = useRef('')
  const githubMissionAutoOpenHandledKeysRef = useRef<Set<string>>(new Set())
  const githubMissionFocusHandledKeysRef = useRef<Set<string>>(new Set())
  const githubMissionPlainActivityAutoOpenedRef = useRef(false)

  const clearGithubMissionUrlParams = useCallback(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    let changed = false
    for (const key of [
      'points_activity',
      'github_mission_mode',
      'installation_id',
      'setup_action',
      'state',
      'github_push_error',
      'github_login_ticket',
      'github_star_authorized',
      'github_error',
      'github_error_description',
    ]) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key)
        changed = true
      }
    }
    if (changed) {
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  const handleSheetOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        clearGithubMissionUrlParams()
        setWechatQrPreviewOpen(false)
      }
      onOpenChange(nextOpen)
    },
    [clearGithubMissionUrlParams, onOpenChange]
  )

  useEffect(() => {
    if (!open) return

    let focusGithubMission = false
    let focusActivitiesTab = false
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      focusActivitiesTab = hasActivitiesAutoOpenQuery(params)
      const missionKey = buildGithubMissionAutoOpenKey(params)
      const callbackSignal = hasGithubMissionCallbackSignal(params)
      const missionActivity = hasGithubMissionQuery(params)
      const shouldSkipFocus =
        missionActivity &&
        !callbackSignal &&
        githubMissionFocusHandledKeysRef.current.has('activity:github_star')
      if (!shouldSkipFocus && missionKey && !githubMissionFocusHandledKeysRef.current.has(missionKey)) {
        focusGithubMission = true
        githubMissionFocusHandledKeysRef.current.add(missionKey)
        if (missionActivity) {
          githubMissionFocusHandledKeysRef.current.add('activity:github_star')
        }
      }
    }

    setActiveTab(focusGithubMission || focusActivitiesTab ? 'activities' : 'usage')
    setSelectedActivity(focusGithubMission ? 'github_star' : null)
    setActivationCodeInput('')
    setActivationMessage('')
    setLatestSettlement(null)
    setActivationResultHighlight(false)
    setActivityNotice(focusGithubMission ? tp('GitHub callback detected. Preparing GitHub Star Mission...') : '')
    setGithubBindingInProgress(false)
    setGithubAutoVerifyPending(false)
    setGithubPushBound(null)
  }, [open, tp])

  useEffect(() => {
    if (open || typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const autoOpenKey = buildGithubMissionAutoOpenKey(params)
    const callbackSignal = hasGithubMissionCallbackSignal(params)
    const missionActivity = hasGithubMissionQuery(params)
    const activitiesAutoOpen = hasActivitiesAutoOpenQuery(params)
    const activitiesAutoOpenKey = activitiesAutoOpen ? 'activity:activities' : null
    if (!autoOpenKey && !activitiesAutoOpenKey) return
    if (missionActivity && !callbackSignal && githubMissionPlainActivityAutoOpenedRef.current) return
    if (autoOpenKey && githubMissionAutoOpenHandledKeysRef.current.has(autoOpenKey)) {
      if (!activitiesAutoOpenKey || githubMissionAutoOpenHandledKeysRef.current.has(activitiesAutoOpenKey)) {
        return
      }
    }
    if (activitiesAutoOpenKey && githubMissionAutoOpenHandledKeysRef.current.has(activitiesAutoOpenKey) && !autoOpenKey) {
      return
    }
    if (autoOpenKey) {
      githubMissionAutoOpenHandledKeysRef.current.add(autoOpenKey)
    }
    if (activitiesAutoOpenKey) {
      githubMissionAutoOpenHandledKeysRef.current.add(activitiesAutoOpenKey)
    }
    if (missionActivity) {
      githubMissionAutoOpenHandledKeysRef.current.add('activity:github_star')
      if (!callbackSignal) {
        githubMissionPlainActivityAutoOpenedRef.current = true
      }
    }
    onOpenChange(true)
  }, [open, onOpenChange])

  useEffect(() => {
    if (!activationResultHighlight) return
    const timer = window.setTimeout(() => {
      setActivationResultHighlight(false)
    }, 2000)
    return () => window.clearTimeout(timer)
  }, [activationResultHighlight])

  const activitiesByKey = useMemo(() => {
    const map = new Map<ActivityCampaignKey, PointsActivityItem>()
    for (const row of activitiesQuery.data?.items || []) {
      if (!isActivityCampaignKey(row.campaign_key)) continue
      map.set(row.campaign_key, row)
    }
    for (const campaignKey of ACTIVITY_ORDER) {
      if (!map.has(campaignKey)) {
        map.set(campaignKey, buildFallbackActivity(campaignKey))
      }
    }
    return map
  }, [activitiesQuery.data?.items])

  const activityCards = useMemo(() => {
    return ACTIVITY_ORDER.map((campaignKey) => activitiesByKey.get(campaignKey) as PointsActivityItem)
  }, [activitiesByKey])

  const selectedActivityItem = selectedActivity ? activitiesByKey.get(selectedActivity) || null : null

  const recentActivationSettlement = useMemo(() => {
    if (latestSettlement) return latestSettlement
    for (const campaignKey of ACTIVITY_ORDER) {
      const settlement = activitiesByKey.get(campaignKey)?.latest_settlement || null
      if (settlement) return settlement
    }
    return null
  }, [latestSettlement, activitiesByKey])

  const githubRepositories = useMemo(() => {
    if (selectedActivity !== 'github_star') return []
    if (Array.isArray(selectedActivityItem?.github_repositories) && selectedActivityItem.github_repositories.length) {
      return selectedActivityItem.github_repositories.filter(Boolean)
    }
    return ['ResearAI/DeepScientist', 'ResearAI/AutoFigure-Edit', 'ResearAI/AutoFigure']
  }, [selectedActivity, selectedActivityItem?.github_repositories])

  const total = summary?.total_points_balance ?? 0
  const daily = summary?.daily_points_balance ?? 0
  const normal = summary?.normal_points_balance ?? 0
  const dailyGrantedToday = summary?.daily_points_granted_today ?? 0
  const dailyConsumedToday = summary?.daily_points_consumed_today ?? 0
  const normalCycleTotal = summary?.normal_points_cycle_total ?? 0
  const normalCycleUsed = summary?.normal_points_cycle_used ?? 0
  const normalCycleRemaining = summary?.normal_points_cycle_remaining ?? 0
  const normalCycleExpiresAt = summary?.normal_points_cycle_expires_at || null

  const planBadgeClass = useMemo(() => {
    if (summary?.plan_tier === 'max') return 'bg-black text-white border-black'
    if (summary?.plan_tier === 'pro') return 'bg-zinc-800 text-white border-zinc-800'
    if (summary?.plan_tier === 'plus') return 'bg-white text-gray-700 border-gray-300'
    return 'bg-white text-gray-700 border-gray-300'
  }, [summary?.plan_tier])

  const autoChargePref = useMemo(() => {
    return autoChargePreferences.data?.items?.find((item) => item.action_code === AUTOFIGURE_EDIT_AUTO_CHARGE_ACTION)
  }, [autoChargePreferences.data?.items])

  const planMap = useMemo(() => {
    const map = new Map<PointsPlanTier, PlanCatalogItem>()
    for (const row of membershipQuery.data?.plan_catalog || []) {
      map.set(row.tier, row)
    }
    return map
  }, [membershipQuery.data?.plan_catalog])

  const currentTier = membershipQuery.data?.current_tier || summary?.plan_tier
  const currentRank = tierRank(currentTier)

  const rightsByTier = useMemo(() => {
    const rules = membershipQuery.data?.entitlement_rules || {}
    const result: Record<PointsPlanTier, PrivilegeItem[]> = {
      free: [],
      plus: [],
      pro: [],
      max: [],
    }

    for (const [feature, tiers] of Object.entries(rules)) {
      for (const tier of tiers) {
        if (TIER_ORDER.includes(tier as PointsPlanTier)) {
          let label = toFeatureLabel(feature)
          if (feature === 'autofigure.edit.4k' && tier === 'plus') {
            label = tp('Limited-time 4K resolution for AutoFigure image generation and editing')
          }
          result[tier as PointsPlanTier].push({ code: feature, label })
        }
      }
    }

    for (const tier of TIER_ORDER) {
      const dedup = new Map<string, PrivilegeItem>()
      for (const item of result[tier]) {
        dedup.set(item.code, item)
      }
      if (tier === 'plus') {
        dedup.set('autofigure.max_tasks.plus', {
          code: 'autofigure.max_tasks.plus',
          label: tp('Max unfinished AutoFigure-Edit tasks: 1'),
        })
      }
      if (tier === 'max') {
        dedup.set('max.never_expire', {
          code: 'max.never_expire',
          label: tp('Monthly credits never expire'),
        })
      }
      result[tier] = Array.from(dedup.values()).slice(0, 12)
    }

    return result
  }, [membershipQuery.data?.entitlement_rules, tp])

  const currentRights = useMemo(() => {
    const entitlementMap = membershipQuery.data?.feature_entitlements || summary?.feature_entitlements || {}
    const items = Object.entries(entitlementMap)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([feature]) => {
        if (feature === 'autofigure.edit.4k' && currentTier === 'plus') {
          return {
            code: feature,
            label: tp('Limited-time 4K resolution for AutoFigure image generation and editing'),
          }
        }
        return { code: feature, label: toFeatureLabel(feature) }
      })

    const dedup = new Map<string, PrivilegeItem>()
    for (const item of items) {
      dedup.set(item.code, item)
    }
    if (currentTier === 'plus') {
      dedup.set('autofigure.max_tasks.plus', {
        code: 'autofigure.max_tasks.plus',
        label: tp('Max unfinished AutoFigure-Edit tasks: 1'),
      })
    }
    if (currentTier === 'max') {
      dedup.set('max.never_expire', {
        code: 'max.never_expire',
        label: tp('Monthly credits never expire'),
      })
    }

    return Array.from(dedup.values()).sort((left, right) => left.label.localeCompare(right.label))
  }, [membershipQuery.data?.feature_entitlements, summary?.feature_entitlements, currentTier, tp])

  const dailyUsagePercent = useMemo(() => {
    if (dailyGrantedToday <= 0) return 0
    const used = Math.min(dailyGrantedToday, Math.max(0, dailyConsumedToday))
    return Math.round((used / dailyGrantedToday) * 100)
  }, [dailyConsumedToday, dailyGrantedToday])

  const hasNormalCycleProgress = normalCycleTotal > 0 && Boolean(normalCycleExpiresAt)

  const normalCycleUsagePercent = useMemo(() => {
    if (!hasNormalCycleProgress || normalCycleTotal <= 0) return 0
    const used = Math.min(normalCycleTotal, Math.max(0, normalCycleUsed))
    return Math.round((used / normalCycleTotal) * 100)
  }, [hasNormalCycleProgress, normalCycleTotal, normalCycleUsed])

  const handleJoinWaitlist = async (targetPlan: PointsPlanTier) => {
    try {
      const response = await markUpgrade.mutateAsync({
        target_plan: targetPlan,
        source,
      })

      const nextMessage = response.already_marked
        ? tp('You are already on the waitlist. We saved your interest before.')
        : tp('You have joined the waitlist for {plan}.', { plan: planLabel(targetPlan) })

      addToast({
        type: 'success',
        title: tp('Waitlist updated'),
        description: nextMessage,
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: tp('Failed to join waitlist'),
        description: error instanceof Error ? error.message : tp('Please try again later.'),
      })
    }
  }

  const copyInviteLink = async () => {
    const link = activitiesQuery.data?.invite?.invitation_link || ''
    if (!link) {
      addToast({ type: 'error', title: tp('Invite link unavailable'), description: tp('Please refresh and retry.') })
      return
    }

    try {
      await navigator.clipboard.writeText(link)
      addToast({ type: 'success', title: tp('Invite link copied'), description: tp('Share it and start earning rewards.') })
    } catch {
      addToast({ type: 'error', title: tp('Copy failed'), description: tp('Please copy the link manually.') })
    }
  }

  const refreshGithubPushBoundStatus = useCallback(
    async ({ showToastOnError = false }: { showToastOnError?: boolean } = {}) => {
      try {
        const integrations = await getMyIntegrations({ syncGithubPush: true })
        const bound = Boolean(integrations.github_push?.installation_bound)
        setGithubPushBound(bound)
        return bound
      } catch (error) {
        const detail = extractApiErrorMessage(error, tp('Unable to refresh GitHub Push binding status.'))
        setGithubPushBound(null)
        if (showToastOnError) {
          addToast({
            type: 'error',
            title: tp('GitHub status refresh failed'),
            description: detail,
          })
        }
        return null
      }
    },
    [addToast, tp]
  )

  const startGithubPushSetupFlow = async (mode: 'bind_only' | 'auto_verify' = 'bind_only') => {
    setGithubBindingInProgress(true)
    try {
      const response = await startMyGithubPushBinding(buildGithubMissionReturnPath(mode))
      if (!response.authorization_url) {
        throw new Error(tp('Missing GitHub authorization URL.'))
      }
      window.location.href = response.authorization_url
    } catch (error) {
      addToast({
        type: 'error',
        title: tp('Failed to start GitHub Push setup'),
        description: error instanceof Error ? error.message : tp('Please retry in a moment.'),
      })
      setGithubBindingInProgress(false)
    }
  }

  const startGithubStarMissionAuthorizationFlow = async () => {
    const response = await startMyGithubStarMissionAuthorization(buildGithubMissionReturnPath('auto_verify'))
    if (!response.authorization_url) {
      throw new Error(tp('Missing GitHub authorization URL.'))
    }
    window.location.href = response.authorization_url
  }

  const completeGithubStarWithSmartAuth = async ({
    allowAuthorizeFallback = true,
    allowPushSetupFallback = true,
  }: {
    allowAuthorizeFallback?: boolean
    allowPushSetupFallback?: boolean
  } = {}) => {
    try {
      const response = await completeGithubStar.mutateAsync()
      setLatestSettlement(response.settlement || null)
      setActivityNotice(response.message || tp('GitHub Star Mission completed successfully.'))
      setGithubPushBound(true)
      addToast({
        type: 'success',
        title: tp('GitHub Star Mission completed'),
        description: response.message || tp('Reward has been settled successfully.'),
      })
      return response
    } catch (error) {
      const detail = extractApiErrorMessage(error, tp('Unable to complete GitHub Star Mission.'))

      if (allowPushSetupFallback && shouldStartGithubPushSetup(detail)) {
        setGithubPushBound(false)
        setActivityNotice(tp('GitHub Push setup is required. Redirecting to GitHub...'))
        await startGithubPushSetupFlow('auto_verify')
        return null
      }

      if (allowAuthorizeFallback && shouldStartGithubIdentityAuthorization(detail)) {
        setActivityNotice(tp('GitHub Star Mission authorization is required. Redirecting to GitHub...'))
        await startGithubStarMissionAuthorizationFlow()
        return null
      }

      setActivityNotice(detail)
      addToast({
        type: 'error',
        title: tp('GitHub Star Mission failed'),
        description: detail,
      })
      return null
    }
  }

  useEffect(() => {
    if (!open || activeTab !== 'activities' || selectedActivity !== 'github_star') return
    void refreshGithubPushBoundStatus()
  }, [open, activeTab, selectedActivity, refreshGithubPushBoundStatus])

  useEffect(() => {
    if (!open || activeTab !== 'activities') return
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const installationIdRaw = getGithubMissionQueryParam(params, 'installation_id')
    const state = getGithubMissionQueryParam(params, 'state')
    const missionModeRaw = (getGithubMissionQueryParam(params, 'github_mission_mode') || 'bind_only').trim().toLowerCase()
    const shouldAutoVerifyAfterBind = missionModeRaw === 'auto_verify'
    if (!installationIdRaw) return

    const ticket = `${installationIdRaw}:${state || ''}`
    if (githubBoundTicketRef.current === ticket) return
    githubBoundTicketRef.current = ticket

    const installationId = Number(installationIdRaw)
    if (!Number.isFinite(installationId) || installationId <= 0) {
      setActivityNotice(tp('Invalid GitHub installation ID returned in callback.'))
      return
    }

    setSelectedActivity('github_star')
    setActivityNotice(
      shouldAutoVerifyAfterBind
        ? tp('GitHub Push setup detected. Finalizing mission verification...')
        : tp('GitHub Push setup detected. Finalizing binding...')
    )

    void (async () => {
      try {
        await bindMyGithubPushInstallation({
          installation_id: Math.trunc(installationId),
          state: state || undefined,
        })
        setGithubPushBound(true)

        if (shouldAutoVerifyAfterBind) {
          setActivityNotice(tp('GitHub Push bound successfully. Starting automatic verification...'))
          await completeGithubStarWithSmartAuth({ allowAuthorizeFallback: true })
        } else {
          setActivityNotice(tp('GitHub Push bound successfully. Click Manual Verify & Settle to finish the mission.'))
          addToast({
            type: 'success',
            title: tp('GitHub bound'),
            description: tp('Binding completed. Continue with Manual Verify & Settle.'),
          })
        }
      } catch (error) {
        const detail = extractApiErrorMessage(error, tp('Failed to process the GitHub setup callback.'))
        setActivityNotice(detail)
        addToast({ type: 'error', title: tp('GitHub setup callback failed'), description: detail })
      } finally {
        const url = new URL(window.location.href)
        url.searchParams.delete('installation_id')
        url.searchParams.delete('setup_action')
        url.searchParams.delete('state')
        url.searchParams.delete('github_mission_mode')

        const rawActivity = (url.searchParams.get('points_activity') || '').trim()
        if (rawActivity.toLowerCase().startsWith('github_star?')) {
          url.searchParams.set('points_activity', 'github_star')
        }

        window.history.replaceState({}, '', url.toString())
      }
    })()
  }, [open, activeTab, addToast])

  useEffect(() => {
    if (!open || activeTab !== 'activities') return
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const githubPushError = getGithubMissionQueryParam(params, 'github_push_error')
    if (!githubPushError) return

    setSelectedActivity('github_star')
    const message = tp('GitHub Push setup was not completed. Click the one-click mission button to retry.')
    setActivityNotice(message)
    addToast({
      type: 'error',
      title: tp('GitHub Push setup not completed'),
      description: message,
    })

    const url = new URL(window.location.href)
    url.searchParams.delete('github_push_error')
    window.history.replaceState({}, '', url.toString())
  }, [open, activeTab, addToast, tp])

  useEffect(() => {
    if (!open || activeTab !== 'activities') return
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const githubError = params.get('github_error')
    const githubErrorDescription = params.get('github_error_description')
    const githubTicket = params.get('github_login_ticket')
    const githubStarAuthorized = params.get('github_star_authorized')

    if (githubError && !githubTicket && !githubStarAuthorized) {
      const message = githubErrorDescription?.trim() || githubError
      setSelectedActivity('github_star')
      setActivityNotice(message)
      addToast({ type: 'error', title: tp('GitHub authorization failed'), description: message })

      const url = new URL(window.location.href)
      url.searchParams.delete('github_error')
      url.searchParams.delete('github_error_description')
      url.searchParams.delete('github_star_authorized')
      url.searchParams.delete('points_activity')
      window.history.replaceState({}, '', url.toString())
      return
    }

    const starMissionAuthorized =
      githubStarAuthorized === '1' || githubStarAuthorized?.trim().toLowerCase() === 'true'
    if (starMissionAuthorized) {
      setSelectedActivity('github_star')
      setActivityNotice(tp('GitHub Star Mission authorization confirmed. Completing mission...'))

      void (async () => {
        try {
          await completeGithubStarWithSmartAuth({ allowAuthorizeFallback: false })
        } catch (error) {
          const message = extractApiErrorMessage(error, tp('Failed to finalize GitHub Star Mission authorization.'))
          setActivityNotice(message)
          addToast({ type: 'error', title: tp('GitHub authorization failed'), description: message })
        } finally {
          const url = new URL(window.location.href)
          url.searchParams.delete('github_star_authorized')
          url.searchParams.delete('github_error')
          url.searchParams.delete('github_error_description')
          url.searchParams.delete('points_activity')
          window.history.replaceState({}, '', url.toString())
        }
      })()
      return
    }

    if (!githubTicket || githubIdentityTicketRef.current === githubTicket) return
    githubIdentityTicketRef.current = githubTicket

    setSelectedActivity('github_star')
    setActivityNotice(tp('GitHub authorization confirmed. Completing mission...'))

    void (async () => {
      try {
        await apiClient.post('/api/v1/auth/github/complete-login', { ticket: githubTicket })
        await completeGithubStarWithSmartAuth({ allowAuthorizeFallback: false })
      } catch (error) {
        const message = extractApiErrorMessage(error, tp('Failed to finalize GitHub authorization for this mission.'))
        setActivityNotice(message)
        addToast({ type: 'error', title: tp('GitHub authorization failed'), description: message })
      } finally {
        const url = new URL(window.location.href)
        url.searchParams.delete('github_login_ticket')
        url.searchParams.delete('github_error')
        url.searchParams.delete('github_error_description')
        url.searchParams.delete('points_activity')
        window.history.replaceState({}, '', url.toString())
      }
    })()
  }, [open, activeTab, addToast, tp])

  const handleRedeemActivationCode = async () => {
    const code = activationCodeInput.trim().toUpperCase()
    if (!code) {
      setActivationMessage(tp('Please enter an activation code first.'))
      return
    }

    if (!isActivationCodeShapeValid(code)) {
      setActivationMessage(tp('Invalid activation code format. Use letters, numbers, and hyphens only.'))
      setLatestSettlement(null)
      return
    }

    setActivationCodeInput(code)

    try {
      const response = await redeemActivation.mutateAsync({
        code,
        source: 'points_modal',
      })
      setActivationMessage(response.message || tp('Activation completed.'))
      setActivityNotice(response.message || tp('Activation completed.'))
      setLatestSettlement(response.settlement || null)
      if (response.settlement) {
        setActivationResultHighlight(true)
      }
      addToast({
        type: 'success',
        title: tp('Activation processed'),
        description: response.message || tp('Reward has been settled successfully.'),
      })
    } catch (error) {
      const message = extractApiErrorMessage(error, tp('Activation failed. Please retry.'))
      setActivationMessage(message)
      setActivityNotice(message)
      setLatestSettlement(null)
      setActivationResultHighlight(false)
      addToast({ type: 'error', title: tp('Activation failed'), description: message })
    }
  }

  const runGithubStarSmartFlow = async ({ source }: { source: 'one_click' | 'manual' }) => {
    setGithubAutoVerifyPending(true)
    try {
      setActivityNotice(
        source === 'one_click'
          ? tp('Running one-click mission flow...')
          : tp('Running manual verification...')
      )
      const bound = await refreshGithubPushBoundStatus()
      if (bound === false) {
        setActivityNotice(tp('GitHub Push is not bound yet. Redirecting to one-click binding...'))
        await startGithubPushSetupFlow('auto_verify')
        return
      }

      await completeGithubStarWithSmartAuth({
        allowAuthorizeFallback: true,
        allowPushSetupFallback: true,
      })
      await refreshGithubPushBoundStatus()
    } finally {
      setGithubAutoVerifyPending(false)
    }
  }

  const handleCompleteGithubStar = async () => {
    await runGithubStarSmartFlow({ source: 'one_click' })
  }

  const handleAutoVerifyGithubStar = async () => {
    await runGithubStarSmartFlow({ source: 'manual' })
  }

  const handleSelectActivity = (campaignKey: ActivityCampaignKey) => {
    setSelectedActivity(campaignKey)
    setActivityNotice('')

    if (campaignKey === 'social_boost') {
      setActivationCodeInput('')
      setActivationMessage('')
    }

    if (campaignKey === 'github_star') {
      setActivityNotice(
        tp(
          'Click Complete Mission in One Click. The system verifies first and only redirects when required. If callback does not return, use Manual Verify & Settle.'
        )
      )
    }
  }

  const handleBackToActivityCards = () => {
    setSelectedActivity(null)
    setActivityNotice('')
  }

  const toggleAutoCharge = async () => {
    try {
      const nextEnabled = !(autoChargePref?.enabled ?? false)
      await updateAutoChargePreference.mutateAsync({
        actionCode: AUTOFIGURE_EDIT_AUTO_CHARGE_ACTION,
        enabled: nextEnabled,
        max_single_charge: autoChargePref?.max_single_charge ?? 500,
        max_daily_auto_charge: autoChargePref?.max_daily_auto_charge ?? 5000,
        source: 'points_sheet',
      })
      addToast({
        type: 'success',
        title: nextEnabled ? tp('Auto-charge enabled') : tp('Auto-charge disabled'),
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: tp('Failed to update auto-charge'),
        description: error instanceof Error ? error.message : tp('Please retry.'),
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => handleSheetOpenChange(false)}
      title={tp('Usage & Credits')}
      description={tp('Monitor credits, review membership, and inspect usage history in one place.')}
      size="xl"
      className="w-[96vw] max-w-none lg:w-[85vw]"
    >
      <div className="grid h-[78vh] grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-gray-200 bg-white/90 p-2">
          <div className="space-y-2">
            {PANEL_TABS.map((tab) => {
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-left transition',
                    active
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    <span>{tp(tab.label)}</span>
                    {tab.key === 'activities' ? (
                      <Star
                        className={cn(
                          'h-3.5 w-3.5 text-[#9A8252] transition-opacity',
                          active ? 'fill-[#9A8252] opacity-100' : 'fill-[#9A8252]/70 opacity-90'
                        )}
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                  <div className={cn('mt-0.5 text-[11px]', active ? 'text-white/80' : 'text-gray-500')}>
                    {tp(tab.desc)}
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="min-h-0 overflow-y-auto rounded-xl border border-gray-200 bg-white/95 p-4">
          {activeTab === 'usage' ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{tp('Token Dashboard')}</div>
                    <div className="text-xs text-gray-500">{tp('Balance, insights, and auto-charge controls.')}</div>
                  </div>
                  <Badge className={cn('inline-flex items-center gap-1.5', planBadgeClass)}>
                    {summary?.plan_tier === 'max' ? <Gem className="h-3 w-3" /> : null}
                    {summary?.plan_tier === 'pro' ? <Crown className="h-3 w-3" /> : null}
                    {summary?.plan_tier === 'plus' ? <Sparkles className="h-3 w-3" /> : null}
                    {summary?.plan_tier === 'free' ? <Circle className="h-3 w-3" /> : null}
                    {summary?.plan_tier?.toUpperCase() || tCommon('plan_tier_free').toUpperCase()}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <div className="text-[11px] text-gray-500">{tp('Total Balance')}</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">
                      <RollingPointsNumber value={total} className="text-2xl font-semibold" />
                    </div>
                    <div className="mt-2 text-[11px] text-gray-500">{tp('Auto alert is triggered below 500 credits.')}</div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <div className="text-[11px] text-gray-500">{tp('Daily (refresh at UTC 00:00)')}</div>
                    <div className="mt-1 text-xl font-semibold text-gray-900">{formatNumber(daily, locale)}</div>
                    <div className="mt-1 text-[11px] text-gray-500">
                      {tp('Used today: {used} / {granted}', {
                        used: formatNumber(dailyConsumedToday, locale),
                        granted: formatNumber(dailyGrantedToday, locale),
                      })}
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full bg-black" style={{ width: `${Math.min(100, Math.max(0, dailyUsagePercent))}%` }} />
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500">
                      {dailyGrantedToday > 0
                        ? tp("{percent}% of today's daily credits consumed", { percent: dailyUsagePercent })
                        : tp('No daily credits granted for today')}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <div className="text-[11px] text-gray-500">{tp('Normal')}</div>
                    <div className="mt-1 text-xl font-semibold text-gray-900">{formatNumber(normal, locale)}</div>
                    {hasNormalCycleProgress ? (
                      <>
                        <div className="mt-1 text-[11px] text-gray-500">
                          {tp('Monthly batch used: {used} / {total}', {
                            used: formatNumber(normalCycleUsed, locale),
                            total: formatNumber(normalCycleTotal, locale),
                          })}
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full bg-black"
                            style={{ width: `${Math.min(100, Math.max(0, normalCycleUsagePercent))}%` }}
                          />
                        </div>
                        <div className="mt-1 text-[11px] text-gray-500">
                          {tp('Expires: {expires} · Remaining {remaining}', {
                            expires: formatDate(normalCycleExpiresAt, locale),
                            remaining: formatNumber(normalCycleRemaining, locale),
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="mt-2 text-[11px] text-gray-500">
                        {tp('Permanent normal points (no cycle progress bar).')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-gray-700">
                    <Activity className="h-3.5 w-3.5" />
                  </div>
                  <div className="mt-2 text-[11px] text-gray-500">{tp('Consumed (30d)')}</div>
                  <div className="text-lg font-semibold">{formatNumber(insights?.total_consumed ?? 0, locale)}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-gray-700">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                  <div className="mt-2 text-[11px] text-gray-500">{tp('Granted (30d)')}</div>
                  <div className="text-lg font-semibold">{formatNumber(insights?.total_granted ?? 0, locale)}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-gray-700">
                    <Clock3 className="h-3.5 w-3.5" />
                  </div>
                  <div className="mt-2 text-[11px] text-gray-500">{tp('Net (30d)')}</div>
                  <div className="text-lg font-semibold">{formatNumber(insights?.net_delta ?? 0, locale)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{tp('Auto-charge (AutoFigure-Edit)')}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {tp('Allow automatic settlement for repeated AutoFigure-Edit runs.')}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className={cn(
                        autoChargePref?.enabled
                          ? 'border-black bg-black text-white hover:bg-black/90 hover:text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      )}
                      onClick={toggleAutoCharge}
                      disabled={updateAutoChargePreference.isPending}
                    >
                      {autoChargePref?.enabled ? tp('Enabled') : tp('Disabled')}
                    </Button>
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    {autoChargePref?.enabled
                      ? tp('Daily spent: {spent} / {limit}', {
                          spent: formatNumber(autoChargePref.daily_spent_utc, locale),
                          limit: formatNumber(autoChargePref.max_daily_auto_charge, locale),
                        })
                      : tp('Enable to skip repeated confirmations while still respecting server-side limits.')}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{tp('Upgrade Membership')}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {tp('Open membership comparison and join waitlist without leaving this popup.')}
                    </div>
                  </div>
                  <Button
                    className="h-12 min-w-[220px] bg-black px-6 text-base font-semibold text-white hover:bg-black/90"
                    onClick={() => setActiveTab('membership')}
                  >
                    {tp('Upgrade Now')}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'membership' ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{tp('Membership Tiers')}</div>
                    <div className="text-xs text-gray-500">
                      {tp('Clear plan comparison with human-readable benefits and current entitlements.')}
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700">
                    {tierIcon(currentTier || 'free')}
                    <span className="font-semibold uppercase">
                      {planLabel(currentTier || 'free')}
                    </span>
                    <span className="text-gray-400">·</span>
                    <span>{tp(membershipQuery.data?.current_status || summary?.plan_status || 'active')}</span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs text-gray-700">
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2">
                    <div className="text-[11px] text-gray-500">{tp('Plan start')}</div>
                    <div className="font-medium">{formatDate(membershipQuery.data?.plan_started_at, locale)}</div>
                  </div>
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2">
                    <div className="text-[11px] text-gray-500">{tp('Plan expiry')}</div>
                    <div className="font-medium">{formatDate(membershipQuery.data?.plan_expires_at, locale)}</div>
                  </div>
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2">
                    <div className="text-[11px] text-gray-500">{tp('Current rights')}</div>
                    <div className="font-medium">{currentRights.length}</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2 text-xs text-gray-700">
                  {currentRights.length ? (
                    currentRights.slice(0, 8).map((item) => (
                      <div key={item.code} className="flex items-start gap-1.5 rounded-md border border-dashed border-gray-200 bg-white px-2.5 py-1.5">
                        <span className="mt-0.5 text-gray-500">{privilegeItemIcon(item.code)}</span>
                        <span>{renderPrivilegeLabel(tp(item.label))}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-start gap-1.5 rounded-md border border-dashed border-gray-200 bg-white px-2.5 py-1.5">
                      <span className="mt-0.5 text-gray-500">{privilegeItemIcon('core')}</span>
                      <span>{tp('Core account access')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
                {TIER_ORDER.map((tier) => {
                  const plan = planMap.get(tier)
                  const styles = MEMBERSHIP_STYLE[tier]
                  const isCurrent = currentTier === tier
                  const isHigher = tierRank(tier) > currentRank
                  const patternStyle = resolvePatternStyle(tier)
                  const disabledByConfig = plan?.is_active === false

                  return (
                    <div key={tier} className={`relative overflow-hidden rounded-2xl border p-4 ${styles.shell}`}>
                      {patternStyle ? <div className="pointer-events-none absolute inset-0 opacity-30" style={patternStyle} /> : null}

                      <div className="relative z-10 flex h-full flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <div className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs ${styles.badge}`}>
                              {tierIcon(tier)}
                              <span>{plan?.display_name || planLabel(tier)}</span>
                            </div>
                            {isCurrent ? (
                              <span className="rounded-full bg-black px-2 py-0.5 text-[10px] text-white">{tp('Current')}</span>
                            ) : null}
                          </div>

                          <div className={`mt-3 text-2xl font-semibold ${styles.title}`}>
                            {tp('{price} / month', {
                              price: `$${formatNumber(plan?.price_usd_monthly || 0, locale)}`,
                            })}
                          </div>

                          <div className="my-3 border-t border-dashed border-current/30" />

                            <div className="space-y-1.5 text-sm">
                              <div>
                              {tp('Monthly credits')}: <span className="font-semibold">{formatNumber(plan?.monthly_normal_grant || 0, locale)}</span>
                              </div>
                              <div>
                                {tp('Daily credits')}: <span className="font-semibold">{formatNumber(plan?.daily_bonus || 0, locale)}</span>
                              </div>
                              <div>
                                {tp('Credits model')}:{' '}
                                <span className="font-semibold">
                                  {tp('Monthly + Daily')}
                                </span>
                              </div>
                            </div>

                          <div className="my-3 border-t border-dashed border-current/30" />

                          <ul className="space-y-1.5 text-sm leading-relaxed">
                            {(rightsByTier[tier] || []).length ? (
                              rightsByTier[tier].map((item) => (
                                <li key={`${tier}-${item.code}`} className="flex items-start gap-1.5">
                                  <span className="mt-0.5 opacity-80">{privilegeItemIcon(item.code)}</span>
                                  <span>{renderPrivilegeLabel(tp(item.label))}</span>
                                </li>
                              ))
                            ) : (
                              <li className="flex items-start gap-1.5">
                                <span className="mt-0.5 opacity-80">{privilegeItemIcon('core')}</span>
                                <span>{tp('Core account features')}</span>
                              </li>
                            )}
                          </ul>
                        </div>

                        <div className="mt-4">
                          {isCurrent ? (
                            <Button className="w-full bg-black text-white hover:bg-black/90" disabled>
                              {tp('Current Plan')}
                            </Button>
                          ) : isHigher ? (
                            <Button
                              className={cn(
                                'w-full bg-black text-white hover:bg-black/90',
                                tier === 'max' &&
                                  'border border-[#D4AF37] bg-gradient-to-r from-[#2f2712] via-[#4b3a12] to-[#2f2712] text-[#F8E7A1] shadow-[0_0_0_1px_rgba(212,175,55,0.55),0_0_18px_rgba(212,175,55,0.45)] animate-pulse'
                              )}
                              disabled={markUpgrade.isPending || disabledByConfig}
                              onClick={() => handleJoinWaitlist(tier)}
                            >
                              {disabledByConfig ? tp('Unavailable') : tp('Join Waitlist')}
                            </Button>
                          ) : (
                            <Button variant="outline" className="w-full" disabled>
                              {tp('Lower Tier')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}

          {activeTab === 'history' ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{tp('Usage History')}</div>
                    <div className="text-xs text-gray-500">
                      {tp('Complete ledger records, including grants and settlements.')}
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <History className="h-3.5 w-3.5" />
                    {history?.total || 0} {tp('records')}
                  </div>
                </div>
              </div>

              {historyLoading ? (
                <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">{tp('Loading history...')}</div>
              ) : history?.items?.length ? (
                <div className="space-y-2">
                  {history.items.map((item) => {
                    const reviewId = (item.review_id || '').trim()
                    const reviewLink = (item.review_link || '').trim() || (reviewId ? `/review/${encodeURIComponent(reviewId)}` : '')
                    const isReviewSession = Boolean(item.is_review_session) && Boolean(reviewId)
                    const inputTokens = Number(item.input_tokens || 0)
                    const outputTokens = Number(item.output_tokens || 0)
                    const totalTokens = Number(item.total_tokens || 0)
                    const mergedEntryCount = Number(item.merged_entry_count || 1)
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="truncate font-medium text-gray-900">
                              {isReviewSession ? reviewId : (item.reason || item.action)}
                            </div>
                            {isReviewSession && reviewLink ? (
                              <a
                                href={reviewLink}
                                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-[10px] text-gray-700 hover:bg-gray-50"
                                title={tp('Open this review')}
                              >
                                {tp('Open')}
                                <ArrowUpRight className="h-3 w-3" />
                              </a>
                            ) : null}
                          </div>
                          <div className="mt-0.5 text-gray-500">
                            {formatDate(item.created_at, locale)} · {item.points_type} · {isReviewSession ? tp('Review Session') : item.action}
                            {isReviewSession && mergedEntryCount > 1 ? ` · ${tp('Merged {count} settlements', { count: mergedEntryCount })}` : ''}
                          </div>
                          {isReviewSession ? (
                            <div className="mt-0.5 text-[11px] text-gray-500">
                              {tp('Input')} {formatNumber(inputTokens, locale)} · {tp('Output')} {formatNumber(outputTokens, locale)} · {tp('Total Tokens')} {formatNumber(totalTokens, locale)}
                            </div>
                          ) : item.delta < 0 ? (
                            <div className="mt-0.5 text-[11px] text-gray-500">
                              {tp('daily')} -{formatNumber(item.daily_used || 0, locale)} · {tp('normal')} -{formatNumber(item.normal_used || 0, locale)}
                            </div>
                          ) : null}
                        </div>
                        <div className={cn('ml-3 font-semibold', item.delta >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                          {item.delta >= 0 ? '+' : ''}
                          {formatNumber(item.delta, locale)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">{tp('No points activity yet.')}</div>
              )}
            </div>
          ) : null}

          {activeTab === 'activities' ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">{tp('Campaign Activities')}</div>
                <div className="text-xs text-gray-500">
                  {tp('Three official missions. Click a card to open the mission detail panel on the right.')}
                </div>
              </div>

              {activitiesQuery.isLoading ? (
                <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">{tp('Loading activities...')}</div>
              ) : activityCards.length ? (
                selectedActivity && selectedActivityItem ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleBackToActivityCards}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        {tp('Back')}
                      </button>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={selectedActivityItem.is_active ? 'border-gray-300 bg-gray-100 text-gray-800' : ''}>
                          {selectedActivityItem.is_active ? tp('Active') : tp('Disabled')}
                        </Badge>
                        {selectedActivityItem.completed ? <Badge variant="outline">{tp('Completed')}</Badge> : null}
                      </div>
                    </div>

                    {selectedActivity === 'social_boost' ? (
                      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-gray-100 text-gray-700">
                            <Megaphone className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{tp('Mission Briefing')}</div>
                            <div className="text-lg font-semibold text-gray-900">{tp('Social Promotion Mission')}</div>
                            <div className="text-sm text-gray-700">
                              {tp('Publish a visual post about AutoFigure, prove authenticity, and claim your official mission reward.')}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">{tp('Recommended Platforms')}</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {['Xiaohongshu', 'WeChat Moments', 'Video Channel', 'Official Account', 'Weibo', 'Twitter / X'].map((platform) => (
                              <div
                                key={platform}
                                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-800"
                              >
                                {platform}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">{tp('Operation Guide')}</div>
                          <div className="mt-3 space-y-2">
                            {[
                              'Create one original post with screenshots or demo visuals of AutoFigure.',
                              'Explain your real usage highlights so readers can understand product value quickly.',
                              'Collect at least 30 likes while keeping your account identity visible.',
                              'Send a likes screenshot to WeChat `nauhcutnil` to receive your activation code.',
                            ].map((step, index) => (
                              <div key={step} className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                                <div className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[11px] font-semibold text-gray-800">
                                  {index + 1}
                                </div>
                                <div className="text-sm text-gray-700">{tp(step)}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">{tp('WeChat QR')}</div>
                          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <button
                              type="button"
                              onClick={() => setWechatQrPreviewOpen(true)}
                              className="rounded-lg border border-transparent transition hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                              aria-label={tp('Open WeChat QR preview')}
                            >
                              <img
                                src="/points/wechat_lz.jpg"
                                alt={tp('WeChat QR for nauhcutnil')}
                                className="h-36 w-36 rounded-lg border border-gray-200 bg-white object-contain"
                              />
                            </button>
                            <div className="text-sm text-gray-700">
                              {tp('Scan to add WeChat {wechat}, then send your likes screenshot to receive your activation code.', {
                                wechat: 'nauhcutnil',
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                              <Crown className="h-4 w-4" />
                              {tp('Official Reward A')}
                            </div>
                            <div className="mt-2 text-sm text-gray-700">{tp('One-month Pro membership package (4000 monthly + 200 daily).')}</div>
                          </div>
                          <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                              <Sparkles className="h-4 w-4" />
                              {tp('Official Reward B')}
                            </div>
                            <div className="mt-2 text-sm text-gray-700">{tp('If already Pro or Max, your account receives +4000 normal points directly.')}</div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                          <label
                            className="text-xs font-semibold uppercase tracking-wide text-gray-500"
                            htmlFor="points-activity-social-code"
                          >
                            {tp('Mission code')}
                          </label>
                          <input
                            id="points-activity-social-code"
                            type="text"
                            value={activationCodeInput}
                            onChange={(event) => {
                              setActivationCodeInput(normalizeActivationCodeInput(event.target.value))
                              if (activationMessage) setActivationMessage('')
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault()
                                void handleRedeemActivationCode()
                              }
                            }}
                            placeholder="XXXX-XXXX-XXXX"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
                            disabled={!selectedActivityItem.is_active}
                          />
                          <Button
                            onClick={handleRedeemActivationCode}
                            disabled={redeemActivation.isPending || !selectedActivityItem.is_active || !isActivationCodeShapeValid(activationCodeInput)}
                          >
                            {redeemActivation.isPending ? tp('Verifying') : tp('Verify & activate')}
                          </Button>
                          {activationMessage ? (
                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                              {activationMessage}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {selectedActivity === 'github_star' ? (
                      <div className="space-y-4 rounded-2xl border border-gray-300 bg-gray-50 p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-700">
                            <Github className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{tp('Mission Briefing')}</div>
                            <div className="text-lg font-semibold text-gray-900">{tp('GitHub Star Mission')}</div>
                            <div className="text-sm text-gray-700">
                              {tp('Authorize once, and DeepScientist will star all required repositories and settle your reward automatically.')}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-300 bg-white p-4">
                          <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">{tp('One-Click Flow')}</div>
                          <div className="mt-3 space-y-2">
                            {[
                              'Step 1 · Click Complete Mission in One Click.',
                              'Step 2 · If GitHub Push is missing, the system routes you to setup automatically.',
                              'Step 3 · If GitHub authorization is missing, OAuth opens and returns automatically.',
                              'Step 4 · DeepScientist stars required repositories and credits +1000 points instantly.',
                            ].map((step, index) => (
                              <div key={step} className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                <div className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[11px] font-semibold text-gray-800">
                                  {index + 1}
                                </div>
                                <div className="text-sm text-gray-700">{tp(step)}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-300 bg-white p-4">
                          <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">{tp('Target Repositories')}</div>
                          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                            {githubRepositories.map((repo) => (
                              <div
                                key={repo}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800"
                              >
                                <Star className="h-4 w-4" />
                                {repo}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-300 bg-white p-4">
                          <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                            <Sparkles className="h-4 w-4" />
                            {tp('Official Reward')}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              onClick={handleCompleteGithubStar}
                              disabled={
                                githubBindingInProgress ||
                                githubAutoVerifyPending ||
                                completeGithubStar.isPending ||
                                !selectedActivityItem.is_active
                              }
                            >
                              {githubBindingInProgress ? tp('Opening GitHub…') : tp('Complete Mission in One Click')}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handleAutoVerifyGithubStar}
                              disabled={
                                githubBindingInProgress ||
                                githubAutoVerifyPending ||
                                completeGithubStar.isPending ||
                                !selectedActivityItem.is_active
                              }
                            >
                              {githubAutoVerifyPending || completeGithubStar.isPending
                                ? tp('Verifying')
                                : tp('Manual Verify & Settle')}
                            </Button>
                          </div>
                          <div className="mt-3 text-xs text-gray-600">
                            {tp('GitHub Push status:')}{' '}
                            <span className="font-medium text-gray-900">
                              {githubPushBound === null ? tp('Checking') : githubPushBound ? tp('Bound') : tp('Not bound')}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-700">
                            {tp('If GitHub setup finished but callback did not return, click Manual Verify & Settle directly.')}
                          </div>
                          <div className="mt-1 text-sm text-gray-700">
                            {tp('Reward settlement: +1000 normal points after successful verification.')}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {selectedActivity === 'invite_referral' ? (
                      <div className="space-y-4 rounded-2xl border border-zinc-300 bg-zinc-50 p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-700">
                            <UserPlus className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{tp('Mission Briefing')}</div>
                            <div className="text-lg font-semibold text-gray-900">{tp('Invite User Mission')}</div>
                            <div className="text-sm text-gray-700">
                              {tp('Build your referral network with a personal invitation code and unlock staged account rewards.')}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-zinc-300 bg-white p-4">
                          <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">{tp('Mission Rulebook')}</div>
                          <div className="mt-3 space-y-2">
                            {[
                              'Invitee reward: +500 normal points after registration via your code.',
                              'Inviter reward: +1000 normal points for each valid referral.',
                              'Milestone: after 10 successful invites, your account upgrades to Pro automatically.',
                            ].map((step, index) => (
                              <div key={step} className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                                <div className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[11px] font-semibold text-zinc-800">
                                  {index + 1}
                                </div>
                                <div className="text-sm text-gray-700">{tp(step)}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          <div className="rounded-lg border border-zinc-300 bg-white px-3 py-3">
                            <div className="text-[11px] uppercase tracking-wide text-gray-500">{tp('Successful Invites')}</div>
                            <div className="mt-1 text-2xl font-semibold text-gray-900">
                              {formatNumber(activitiesQuery.data?.invite?.invite_count || 0, locale)}
                            </div>
                          </div>
                          <div className="rounded-lg border border-zinc-300 bg-white px-3 py-3">
                            <div className="text-[11px] uppercase tracking-wide text-gray-500">{tp('Total Inviter Reward')}</div>
                            <div className="mt-1 text-2xl font-semibold text-gray-900">
                              +{formatNumber(activitiesQuery.data?.invite?.total_inviter_reward_points || 0, locale)}
                            </div>
                          </div>
                          <div className="rounded-lg border border-zinc-300 bg-white px-3 py-3">
                            <div className="text-[11px] uppercase tracking-wide text-gray-500">{tp('Latest Invitee')}</div>
                            <div className="mt-1 text-sm font-medium text-gray-900 break-all">
                              {activitiesQuery.data?.invite?.latest_invitee_email || '-'}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-zinc-300 bg-white p-4 space-y-3">
                          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{tp('Your invitation link')}</div>
                          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 break-all">
                            {activitiesQuery.data?.invite?.invitation_link || '-'}
                          </div>
                          <Button variant="outline" onClick={copyInviteLink}>
                            <Copy className="mr-2 h-4 w-4" />
                            {tp('Copy invite link')}
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    {activityNotice ? (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                        {activityNotice}
                      </div>
                    ) : null}

                    {latestSettlement ? <ActivationSettlementCard settlement={latestSettlement} /> : null}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {activityCards.map((activity) => {
                      const campaignKey = activity.campaign_key as ActivityCampaignKey
                      const meta = ACTIVITY_META[campaignKey]
                      const Icon = meta.icon
                      return (
                        <button
                          key={campaignKey}
                          type="button"
                          onClick={() => handleSelectActivity(campaignKey)}
                          className={cn(
                            'group flex h-full min-h-[248px] flex-col rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md',
                            meta.shellClass
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className={cn('inline-flex h-11 w-11 items-center justify-center rounded-xl border', meta.iconClass)}>
                              <Icon className="h-5 w-5" />
                            </div>
                          <div className="flex items-center gap-1.5">
                              <Badge variant="secondary" className={activity.is_active ? 'border-gray-300 bg-gray-100 text-gray-800' : ''}>
                                {activity.is_active ? tp('Active') : tp('Disabled')}
                              </Badge>
                              {activity.completed ? <Badge variant="outline">{tp('Done')}</Badge> : null}
                            </div>
                          </div>

                          <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">{tp('Mission')}</div>
                          <div className="mt-1 text-base font-semibold text-gray-900">{tp(meta.title)}</div>
                          <div className="mt-1 text-sm text-gray-700 leading-relaxed">{tp(meta.subtitle)}</div>
                          <div className="mt-2 text-xs font-medium text-gray-500">{tp('Tap to open mission briefing →')}</div>

                          <div className="mt-auto rounded-xl border border-dashed border-gray-300 bg-white px-3 py-2">
                            <div className="text-[11px] uppercase tracking-wide text-gray-500">{tp('Reward')}</div>
                            <div className="mt-1 text-sm font-medium text-gray-900 leading-relaxed">{tp(meta.reward)}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">{tp('No activities configured yet.')}</div>
              )}
            </div>
          ) : null}

          {activeTab === 'activation' ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">{tp('Activation Center')}</div>
                <div className="text-xs text-gray-500">
                  {tp('Redeem campaign or admin activation codes. Verified codes apply membership and points changes automatically.')}
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500" htmlFor="points-activation-code">
                  {tp('Activation code')}
                </label>
                <input
                  id="points-activation-code"
                  type="text"
                  value={activationCodeInput}
                  onChange={(event) => {
                    setActivationCodeInput(normalizeActivationCodeInput(event.target.value))
                    if (activationMessage) setActivationMessage('')
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      void handleRedeemActivationCode()
                    }
                  }}
                  placeholder="XXXX-XXXX-XXXX"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase tracking-wide outline-none focus:border-gray-500"
                />

                <div className="text-xs text-gray-500">
                  {tp('Supports activity reward codes and admin-issued upgrade/reward codes.')}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleRedeemActivationCode}
                    disabled={redeemActivation.isPending || !isActivationCodeShapeValid(activationCodeInput)}
                  >
                    {redeemActivation.isPending ? tp('Verifying') : tp('Verify & activate')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActivationCodeInput('')
                      setActivationMessage('')
                      setLatestSettlement(null)
                      setActivationResultHighlight(false)
                    }}
                  >
                    {tp('Reset')}
                  </Button>
                </div>

                {activationMessage ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                    {activationMessage}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/70 px-3 py-2 text-xs text-gray-500">
                    {tp('Enter a code and click “Verify & activate”.')}
                  </div>
                )}
              </div>

              {recentActivationSettlement ? (
                <ActivationSettlementCard
                  settlement={recentActivationSettlement}
                  title={latestSettlement ? tp('Latest Activation Result') : tp('Most Recent Activation Result')}
                  highlightChanges={Boolean(latestSettlement && activationResultHighlight)}
                />
              ) : null}
            </div>
          ) : null}
        </section>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-300 pt-3 text-xs text-gray-500">
        <div className="inline-flex items-center gap-1.5">
          <LayoutGrid className="h-3.5 w-3.5" />
          {tp('Unified credits center for usage, membership, history, activities, and activation.')}
        </div>
        <Button size="sm" variant="outline" onClick={() => handleSheetOpenChange(false)}>
          {tp('Close')}
        </Button>
      </div>

      <Modal
        open={wechatQrPreviewOpen}
        onClose={() => setWechatQrPreviewOpen(false)}
        title={tp('WeChat QR Preview')}
        size="sm"
        className="w-[90vw] max-w-md"
      >
        <div className="flex justify-center">
          <img
            src="/points/wechat_lz.jpg"
            alt={tp('WeChat QR enlarged preview')}
            className="max-h-[60vh] w-auto max-w-full rounded-lg border border-gray-200 bg-white object-contain"
          />
        </div>
      </Modal>
    </Modal>
  )
}
