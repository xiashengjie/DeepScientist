'use client'

import { useEffect, useMemo, useState } from 'react'
import { Coins, Crown, Gem, Sparkles, Circle } from 'lucide-react'
import { usePointsSummary } from '@/lib/hooks/usePoints'
import { cn } from '@/lib/utils'
import { RollingPointsNumber } from '@/components/points/RollingPointsNumber'
import { PointsOverviewSheet } from '@/components/points/PointsOverviewSheet'
import { useI18n } from '@/lib/i18n/useI18n'

export function PointsPill({
  source,
  className,
}: {
  source: 'projects_topbar' | 'workspace_topbar'
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [stableTotal, setStableTotal] = useState<number | null>(null)
  const { data, isLoading, isFetched } = usePointsSummary()
  const { t: tCommon } = useI18n('common')

  useEffect(() => {
    const nextTotal = data?.total_points_balance
    if (typeof nextTotal !== 'number' || !Number.isFinite(nextTotal)) {
      return
    }
    setStableTotal(Math.max(0, Math.floor(nextTotal)))
  }, [data?.total_points_balance])

  const displayTotal = useMemo(() => {
    if (stableTotal !== null) return stableTotal

    const payloadTotal = data?.total_points_balance
    if (typeof payloadTotal === 'number' && Number.isFinite(payloadTotal)) {
      return Math.max(0, Math.floor(payloadTotal))
    }

    if (isLoading && !isFetched) {
      return null
    }

    return 0
  }, [data?.total_points_balance, isFetched, isLoading, stableTotal])

  const planTier = data?.plan_tier

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex min-w-[132px] items-center justify-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800',
          'transition hover:bg-gray-50',
          className
        )}
        aria-label={tCommon('points_panel_open_aria')}
      >
        {planTier === 'pro' ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-white">
            <Crown className="h-3 w-3" />
            {tCommon('plan_tier_pro')}
          </span>
        ) : null}
        {planTier === 'plus' ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-1.5 py-0.5 text-[10px] text-gray-700">
            <Sparkles className="h-3 w-3" />
            {tCommon('plan_tier_plus')}
          </span>
        ) : null}
        {planTier === 'free' ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-1.5 py-0.5 text-[10px] text-gray-700">
            <Circle className="h-3 w-3" />
            {tCommon('plan_tier_free')}
          </span>
        ) : null}
        {planTier === 'max' ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-black bg-black px-1.5 py-0.5 text-[10px] text-white">
            <Gem className="h-3 w-3" />
            {tCommon('plan_tier_max')}
          </span>
        ) : null}

        <Coins className="h-4 w-4 text-gray-700" />
        {displayTotal === null ? (
          <span className="text-sm font-medium tabular-nums text-gray-500">--</span>
        ) : (
          <RollingPointsNumber value={displayTotal} className="text-sm font-medium" />
        )}
      </button>

      <PointsOverviewSheet open={open} onOpenChange={setOpen} source={source} />
    </>
  )
}
