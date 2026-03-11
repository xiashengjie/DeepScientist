'use client'

import { useEffect, useRef } from 'react'
import { ScrollStack, ScrollStackItem } from '@/components/react-bits'
import { PngIcon } from '@/components/ui/png-icon'
import { BarChart3, Brain, Sparkles, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HERO_STAGES, type HeroStage } from './hero-content'

type HeroStoryProps = {
  progress: number
  stageIndex: number
  onStageChange?: (index: number) => void
}

const FALLBACK_ICONS = {
  BarChart3,
  Brain,
  SparklesIcon: Sparkles,
  Crown,
}

function StageCard({ stage, isActive }: { stage: HeroStage; isActive: boolean }) {
  const FallbackIcon = FALLBACK_ICONS[stage.icon as keyof typeof FALLBACK_ICONS] || BarChart3

  return (
    <div
      className={cn(
        'rounded-2xl border border-black/10 bg-white/70 p-4 shadow-[0_18px_40px_-28px_rgba(45,42,38,0.5)]',
        'backdrop-blur-lg transition-all duration-300',
        isActive ? 'text-[#2D2A26]' : 'text-[#5D5A55]'
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full border border-black/10',
            stage.tone === 'warm' ? 'bg-[#EFE5D6]' : 'bg-[#E1E7EF]'
          )}
        >
          <PngIcon
            name={stage.icon}
            size={18}
            className="h-4 w-4 filter grayscale brightness-75"
            fallback={<FallbackIcon className="h-4 w-4" />}
          />
        </span>
        <div>
          <div className="text-sm font-semibold">{stage.title}</div>
          <div className="text-xs text-[#6F6B66]">{stage.body}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#6F6B66]">
        <span className="rounded-full border border-black/5 bg-white/60 px-2 py-0.5">
          {stage.metricPrimary}
        </span>
        <span className="rounded-full border border-black/5 bg-white/60 px-2 py-0.5">
          {stage.metricSecondary}
        </span>
      </div>
    </div>
  )
}

export default function HeroStory({ progress, stageIndex, onStageChange }: HeroStoryProps) {
  const carouselRef = useRef<HTMLDivElement | null>(null)
  const stackProgress = Math.max(1, progress * 100)

  useEffect(() => {
    if (!onStageChange) return
    const scroller = carouselRef.current
    if (!scroller) return

    const updateStage = () => {
      const width = scroller.getBoundingClientRect().width || 1
      const nextIndex = Math.round(scroller.scrollLeft / width)
      onStageChange(Math.min(HERO_STAGES.length - 1, Math.max(0, nextIndex)))
    }

    updateStage()
    scroller.addEventListener('scroll', updateStage, { passive: true })
    window.addEventListener('resize', updateStage)

    return () => {
      scroller.removeEventListener('scroll', updateStage)
      window.removeEventListener('resize', updateStage)
    }
  }, [onStageChange])

  return (
    <div className="w-full">
      <div
        className="hidden lg:block"
        style={{
          ['--af-stack-bg' as string]: 'rgba(255, 255, 255, 0.72)',
          ['--af-stack-border' as string]: 'rgba(45, 42, 38, 0.08)',
          ['--af-stack-shadow' as string]: '0 18px 40px -28px rgba(45, 42, 38, 0.4)',
          ['--af-text-primary' as string]: '#2D2A26',
        }}
      >
        <ScrollStack
          className="h-[240px]"
          mode="sequence"
          progress={stackProgress}
          sequenceTimings={{ enter: 0.28, hold: 0.46, exit: 0.26 }}
          sequenceDistance={44}
          itemScale={0.02}
          baseScale={0.96}
          rotationAmount={0}
          blurAmount={0}
        >
          {HERO_STAGES.map((stage, index) => (
            <ScrollStackItem key={stage.key}>
              <StageCard stage={stage} isActive={stageIndex === index} />
            </ScrollStackItem>
          ))}
        </ScrollStack>
      </div>

      <div className="lg:hidden">
        <div
          ref={carouselRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
        >
          {HERO_STAGES.map((stage, index) => (
            <div key={stage.key} className="w-full shrink-0 snap-start px-1">
              <StageCard stage={stage} isActive={stageIndex === index} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
