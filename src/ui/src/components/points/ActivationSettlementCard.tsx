'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n/useI18n'
import type { PointsActivationSettlement } from '@/lib/types/points'

function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(Number(value || 0))
}

function formatDelta(value: number, locale: string): string {
  const safe = Number(value || 0)
  const sign = safe >= 0 ? '+' : ''
  return `${sign}${new Intl.NumberFormat(locale).format(safe)}`
}

type ActivationSettlementCardProps = {
  settlement: PointsActivationSettlement
  title?: string
  highlightChanges?: boolean
}

export function ActivationSettlementCard({
  settlement,
  title,
  highlightChanges = false,
}: ActivationSettlementCardProps) {
  const { language, t } = useI18n('points')
  const { t: tCommon } = useI18n('common')
  const tp = (text: string, variables?: Record<string, string | number>) => t(text, variables, text)
  const locale = language === 'zh-CN' ? 'zh-CN' : 'en-US'
  const resolvedTitle = title || tp('Settlement Result')
  const toPlanLabel = (tier: string | null | undefined): string => {
    const normalized = (tier || '').trim().toLowerCase()
    if (normalized === 'plus') return tCommon('plan_tier_plus')
    if (normalized === 'pro') return tCommon('plan_tier_pro')
    if (normalized === 'max') return tCommon('plan_tier_max')
    if (normalized === 'free') return tCommon('plan_tier_free')
    return '-'
  }
  const membershipChanged = settlement.plan_tier_before !== settlement.plan_tier_after
  const normalChanged = Number(settlement.delta_normal_points || 0) !== 0
  const dailyChanged = Number(settlement.delta_daily_points || 0) !== 0
  const totalChanged = Number(settlement.delta_total_points || 0) !== 0

  return (
    <Card variant="outline" className="border-gray-200 bg-white">
      <CardHeader className="flex flex-row items-start justify-between gap-3 p-4">
        <div>
          <div className="text-sm font-semibold text-gray-900">{resolvedTitle}</div>
          <div className="text-xs text-gray-500">
            {tp('Campaign')}: {String(settlement.campaign_title || settlement.campaign_key || '-')}
          </div>
        </div>
        <Badge variant="secondary" className="border-gray-300 bg-gray-100 text-gray-800">
          {String(settlement.status || tp('success'))}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3 px-4 pb-4 pt-0">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <div
            className={
              membershipChanged && highlightChanges
                ? 'rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 transition-colors duration-300 ring-1 ring-gray-300'
                : 'rounded-lg border border-gray-200 bg-gray-50 px-3 py-2'
            }
          >
            <div className="text-[11px] uppercase tracking-wide text-gray-500">{tp('Membership')}</div>
            <div className={membershipChanged && highlightChanges ? 'mt-1 text-sm font-semibold text-gray-900' : 'mt-1 text-sm font-medium text-gray-900'}>
              {toPlanLabel(settlement.plan_tier_before)} → {toPlanLabel(settlement.plan_tier_after)}
            </div>
          </div>

          <div
            className={
              normalChanged && highlightChanges
                ? 'rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 transition-colors duration-300 ring-1 ring-gray-300'
                : 'rounded-lg border border-gray-200 bg-gray-50 px-3 py-2'
            }
          >
            <div className="text-[11px] uppercase tracking-wide text-gray-500">{tp('Normal Points')}</div>
            <div className={normalChanged && highlightChanges ? 'mt-1 text-sm font-semibold text-gray-900' : 'mt-1 text-sm font-medium text-gray-900'}>
              {formatNumber(settlement.normal_points_before, locale)} → {formatNumber(settlement.normal_points_after, locale)}
            </div>
            <div className={normalChanged && highlightChanges ? 'text-xs font-semibold text-gray-800' : 'text-xs text-gray-600'}>
              Δ {formatDelta(settlement.delta_normal_points, locale)}
            </div>
          </div>

          <div
            className={
              dailyChanged && highlightChanges
                ? 'rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 transition-colors duration-300 ring-1 ring-gray-300'
                : 'rounded-lg border border-gray-200 bg-gray-50 px-3 py-2'
            }
          >
            <div className="text-[11px] uppercase tracking-wide text-gray-500">{tp('Daily Points')}</div>
            <div className={dailyChanged && highlightChanges ? 'mt-1 text-sm font-semibold text-gray-900' : 'mt-1 text-sm font-medium text-gray-900'}>
              {formatNumber(settlement.daily_points_before, locale)} → {formatNumber(settlement.daily_points_after, locale)}
            </div>
            <div className={dailyChanged && highlightChanges ? 'text-xs font-semibold text-gray-800' : 'text-xs text-gray-600'}>
              Δ {formatDelta(settlement.delta_daily_points, locale)}
            </div>
          </div>
        </div>

        <div
          className={
            totalChanged && highlightChanges
              ? 'rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 transition-colors duration-300 ring-1 ring-gray-300'
              : 'rounded-lg border border-gray-200 bg-gray-50 px-3 py-2'
          }
        >
          <div className="text-[11px] uppercase tracking-wide text-gray-500">{tp('Total Points')}</div>
          <div className={totalChanged && highlightChanges ? 'mt-1 text-sm font-semibold text-gray-900' : 'mt-1 text-sm font-medium text-gray-900'}>
            {formatNumber(settlement.total_points_before, locale)} → {formatNumber(settlement.total_points_after, locale)}
          </div>
          <div className={totalChanged && highlightChanges ? 'text-xs font-semibold text-gray-800' : 'text-xs text-gray-600'}>
            Δ {formatDelta(settlement.delta_total_points, locale)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
