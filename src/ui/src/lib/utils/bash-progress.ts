import type { BashProgress } from '@/lib/types/bash'

const clampPercent = (value: number) => Math.min(100, Math.max(0, value))

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

export const getProgressPercent = (progress?: BashProgress | null) => {
  if (!progress) return null
  if (isFiniteNumber(progress.percent)) {
    return clampPercent(progress.percent)
  }
  if (isFiniteNumber(progress.current) && isFiniteNumber(progress.total) && progress.total > 0) {
    return clampPercent((progress.current / progress.total) * 100)
  }
  return null
}

export const formatProgressLabel = (progress?: BashProgress | null) => {
  if (!progress) return ''
  const unit = progress.unit ? ` ${progress.unit}` : ''
  if (isFiniteNumber(progress.current) && isFiniteNumber(progress.total) && progress.total > 0) {
    return `${progress.current}/${progress.total}${unit}`
  }
  if (isFiniteNumber(progress.current)) {
    return `${progress.current}${unit}`
  }
  return ''
}

const formatEta = (etaSeconds?: number | null) => {
  if (!isFiniteNumber(etaSeconds) || etaSeconds < 0) return ''
  const totalSeconds = Math.round(etaSeconds)
  if (totalSeconds < 60) return `${totalSeconds}s`
  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}m ${seconds}s`
  }
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

export const formatProgressMeta = (progress?: BashProgress | null) => {
  if (!progress) return ''
  const parts: string[] = []
  if (progress.desc) parts.push(progress.desc)
  if (progress.phase) parts.push(progress.phase)
  if (isFiniteNumber(progress.rate)) parts.push(`${progress.rate.toFixed(2)}/s`)
  const eta = formatEta(progress.eta ?? null)
  if (eta) parts.push(`eta ${eta}`)
  return parts.join(' · ')
}
