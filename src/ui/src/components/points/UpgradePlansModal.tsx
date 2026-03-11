'use client'

import { Circle, Crown, Gem, Sparkles } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/useI18n'
import type { PlanCatalogItem, PointsPlanTier } from '@/lib/types/points'

type UpgradeTier = 'free' | 'plus' | 'pro' | 'max'

interface PlanCardConfig {
  tier: UpgradeTier
  fallbackPriceUsdMonthly: number
  fallbackMonthlyGrant: number
  fallbackDailyBonus: number
  benefits: string[]
}

const PLAN_CARDS: PlanCardConfig[] = [
  {
    tier: 'free',
    fallbackPriceUsdMonthly: 0,
    fallbackMonthlyGrant: 0,
    fallbackDailyBonus: 0,
    benefits: [
      'AutoFigure access',
      'Points dashboard, usage history, alerts',
    ],
  },
  {
    tier: 'plus',
    fallbackPriceUsdMonthly: 19.8,
    fallbackMonthlyGrant: 900,
    fallbackDailyBonus: 100,
    benefits: [
      'AutoFigure access',
      'Limited-time 4K resolution for AutoFigure image generation and editing',
      'Max unfinished AutoFigure-Edit tasks: 1',
      'Points dashboard, usage history, alerts',
    ],
  },
  {
    tier: 'pro',
    fallbackPriceUsdMonthly: 59.8,
    fallbackMonthlyGrant: 4000,
    fallbackDailyBonus: 200,
    benefits: [
      'AutoFigure access',
      'AutoFigure image generation and editing with 4K resolution',
      'Early access to selected Beta features',
    ],
  },
  {
    tier: 'max',
    fallbackPriceUsdMonthly: 698.8,
    fallbackMonthlyGrant: 50000,
    fallbackDailyBonus: 3000,
    benefits: [
      'AutoFigure access',
      'AutoFigure image generation and editing with 4K resolution',
      'DeepScientist suite access',
      'Personal lab access',
      'Literature search, review, annotation, agent assistant, paper writing',
    ],
  },
]

const TIER_STYLES: Record<UpgradeTier, string> = {
  free: 'border-[#d8d5cf] bg-[#f7f6f4] text-[#3f3b36]',
  plus: 'border-[#c7c8c2] bg-[#eef0eb] text-[#38403a]',
  pro: 'border-[#c8aa6f] bg-[#f6efe4] text-[#3f3020]',
  max: 'border-[#3b3a36] bg-[#1f1f1d] text-[#f6f1e6]',
}

function tierIcon(tier: UpgradeTier) {
  if (tier === 'max') return <Gem className="h-4 w-4" />
  if (tier === 'pro') return <Crown className="h-4 w-4" />
  if (tier === 'free') return <Circle className="h-4 w-4" />
  return <Sparkles className="h-4 w-4" />
}

function renderBenefitLabel(label: string) {
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

export function UpgradePlansModal({
  open,
  onClose,
  currentTier,
  pending,
  waitlistMessage,
  planCatalog,
  onJoinWaitlist,
}: {
  open: boolean
  onClose: () => void
  currentTier?: PointsPlanTier
  pending?: boolean
  waitlistMessage?: string | null
  planCatalog?: PlanCatalogItem[]
  onJoinWaitlist: (tier: UpgradeTier) => void
}) {
  const { t, language } = useI18n('points')
  const { t: tCommon } = useI18n('common')
  const tp = (text: string, variables?: Record<string, string | number>) => t(text, variables, text)
  const locale = language === 'zh-CN' ? 'zh-CN' : 'en-US'
  const catalogMap = new Map<UpgradeTier, PlanCatalogItem>(
    (planCatalog || []).map((row) => [row.tier as UpgradeTier, row])
  )
  const planTierLabel = (tier: UpgradeTier): string => {
    if (tier === 'plus') return tCommon('plan_tier_plus')
    if (tier === 'pro') return tCommon('plan_tier_pro')
    if (tier === 'max') return tCommon('plan_tier_max')
    return tCommon('plan_tier_free')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={tp('Choose Your Plan')}
      description={tp('Pricing is not open yet. You can join the waitlist now.')}
      className="w-[96vw] max-w-[68rem]"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          {PLAN_CARDS.map((plan) => {
            const isCurrent = currentTier === plan.tier
            const isDark = plan.tier === 'max'
            const catalog = catalogMap.get(plan.tier)
            const priceUsdMonthly = Math.max(0, Number(catalog?.price_usd_monthly ?? plan.fallbackPriceUsdMonthly))
            const monthlyGrant = Math.max(0, Number(catalog?.monthly_normal_grant ?? plan.fallbackMonthlyGrant))
            const dailyBonus = Math.max(0, Number(catalog?.daily_bonus ?? plan.fallbackDailyBonus))
            const priceText = tp('{price} / month', {
              price: `$${new Intl.NumberFormat(locale).format(priceUsdMonthly)}`,
            })
            const monthlyGrantText =
              monthlyGrant <= 0
                ? tp('No monthly normal points')
                : plan.tier === 'max'
                  ? tp('{points} normal points / month (non-expiring)', {
                      points: new Intl.NumberFormat(locale).format(monthlyGrant),
                    })
                  : tp('{points} normal points / month (expires in 1 month)', {
                      points: new Intl.NumberFormat(locale).format(monthlyGrant),
                    })
            const dailyBonusText = tp('Daily extra points: {points}', {
              points: new Intl.NumberFormat(locale).format(dailyBonus),
            })
            return (
              <div
                key={plan.tier}
                className={cn(
                  'relative overflow-hidden rounded-2xl border p-4',
                  'flex min-h-[360px] flex-col justify-between',
                  TIER_STYLES[plan.tier],
                  isCurrent ? 'ring-1 ring-black border-black' : ''
                )}
              >
                {plan.tier === 'pro' ? (
                  <div
                    className="pointer-events-none absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(45deg, rgba(182,142,77,0.18), rgba(182,142,77,0.18) 4px, transparent 4px, transparent 12px)',
                    }}
                  />
                ) : null}
                {plan.tier === 'max' ? (
                  <div
                    className="pointer-events-none absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle at 20% 20%, rgba(201,171,116,0.25) 0, rgba(0,0,0,0) 40%), radial-gradient(circle at 80% 70%, rgba(201,171,116,0.22) 0, rgba(0,0,0,0) 45%)',
                    }}
                  />
                ) : null}

                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 text-sm font-semibold">
                      {tierIcon(plan.tier)}
                      {catalog?.display_name || planTierLabel(plan.tier)}
                    </div>
                    {isCurrent ? (
                      <span className="rounded-full border border-black bg-black px-2 py-0.5 text-[10px] text-white">
                        {tp('Current')}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 text-2xl font-bold">{priceText}</div>

                  <div className="my-3 border-t border-dashed border-current/30" />

                  <div className="space-y-2 text-xs">
                    <div>{monthlyGrantText}</div>
                    <div>{dailyBonusText}</div>
                  </div>

                  <div className="my-3 border-t border-dashed border-current/30" />

                  <ul className="space-y-1.5 text-xs">
                    {plan.benefits.map((item) => (
                      <li key={item} className="leading-snug">
                        • {renderBenefitLabel(tp(item))}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  className={cn(
                    'relative z-10 mt-4',
                    isDark ? 'bg-[#d3b77c] text-[#1f1f1d] hover:bg-[#c9ac70]' : 'bg-black text-white hover:bg-black/90'
                  )}
                  disabled={Boolean(pending) || isCurrent}
                  onClick={() => onJoinWaitlist(plan.tier)}
                >
                  {isCurrent ? tp('Current Plan') : tp('Join Waitlist')}
                </Button>
              </div>
            )
          })}
        </div>

        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          {waitlistMessage || tp('Click any non-current plan to join waitlist instantly.')}
        </div>
      </div>
    </Modal>
  )
}
