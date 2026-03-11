import { formatProgressLabel, formatProgressMeta, getProgressPercent } from '../bash-progress'

describe('bash-progress helpers', () => {
  it('computes percent and label', () => {
    const progress = { current: 5, total: 10, unit: 'steps', desc: 'train', phase: 'exec' }
    expect(getProgressPercent(progress)).toBeCloseTo(50)
    expect(formatProgressLabel(progress)).toBe('5/10 steps')
    expect(formatProgressMeta(progress)).toContain('train')
  })

  it('handles percent-only payload', () => {
    const progress = { current: 7, percent: 70, unit: 'samples' }
    expect(getProgressPercent(progress)).toBe(70)
    expect(formatProgressLabel(progress)).toBe('7 samples')
  })
})
