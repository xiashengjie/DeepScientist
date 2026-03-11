'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import ResearchFarmGame from '@/components/game/ResearchFarmGame'
import { cn } from '@/lib/utils'

const energyIcon = '/assets/deep_scientist/ui/energy_icon.png'
const timeIcon = '/assets/deep_scientist/ui/time_icon.png'
const insightIcon = '/assets/deep_scientist/ui/junimo_icon.png'

type GameStats = {
  energy: number
  timeLeft: number
  score: number
  quest: string
  message: string
  breakdown?: { hypothesis: number; implemented: number; progress: number }
}

type AuthGamePanelProps = {
  paused?: boolean
  onResume?: () => void
  className?: string
}

export default function AuthGamePanel({ paused = false, onResume, className }: AuthGamePanelProps) {
  const [gameStats, setGameStats] = useState<GameStats>({
    energy: 10,
    timeLeft: 120,
    score: 0,
    quest: 'Take your first steps to uncover hidden hypotheses.',
    message: '',
    breakdown: { hypothesis: 0, implemented: 0, progress: 0 },
  })
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleStatsChange = useCallback((next: GameStats) => {
    setGameStats((prev) => ({
      ...prev,
      ...next,
      breakdown: next.breakdown ?? prev.breakdown,
    }))
  }, [])

  const breakdown = useMemo(
    () => gameStats.breakdown ?? { hypothesis: 0, implemented: 0, progress: 0 },
    [gameStats.breakdown]
  )

  return (
    <div className={cn('auth-game-panel', className)} onPointerDown={onResume}>
      <div className="auth-game-header">
        <div>
          <div className="auth-game-eyebrow">Research simulation</div>
          <h2 className="auth-game-title">Hypothesis Valley</h2>
          <p className="auth-game-subtitle">
            Navigate the map, record hypotheses, and validate them with resources to grow your
            findings.
          </p>
        </div>
        <div className="auth-game-status">
          <div className="auth-game-stat">
            <img src={energyIcon} alt="Resources" />
            <div>
              <strong>{Math.max(0, Math.round(gameStats.energy))}</strong>
              <span>Resources</span>
            </div>
          </div>
          <div className="auth-game-stat">
            <img src={timeIcon} alt="Time left" />
            <div>
              <strong>{Math.max(0, Math.floor(gameStats.timeLeft))}s</strong>
              <span>Time left</span>
            </div>
          </div>
          <div className="auth-game-stat">
            <img src={insightIcon} alt="Findings" />
            <div>
              <strong>{gameStats.score}</strong>
              <span>Findings</span>
            </div>
          </div>
        </div>
        {paused ? <div className="auth-game-paused">Paused while focusing the form</div> : null}
      </div>

      <div className="auth-game-body">
        {isMounted ? (
          <ResearchFarmGame paused={paused} onStatsChange={handleStatsChange} />
        ) : (
          <div className="auth-game-placeholder" />
        )}
      </div>

      <div className="auth-game-footer">
        <div className="auth-game-summary">
          <div className="auth-summary-card auth-summary-hypothesis">
            <span>Hypothesis</span>
            <strong>{breakdown.hypothesis}</strong>
          </div>
          <div className="auth-summary-card auth-summary-implemented">
            <span>Implemented</span>
            <strong>{breakdown.implemented}</strong>
          </div>
          <div className="auth-summary-card auth-summary-progress">
            <span>Progress</span>
            <strong>{breakdown.progress}</strong>
          </div>
        </div>
      </div>

    </div>
  )
}
