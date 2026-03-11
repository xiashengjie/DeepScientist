import {
  isAutoFigureRuntimeBusyFailureMessage,
  normalizeAutoFigureRuntimeFailureMessage,
} from '../autofigure-edit-failure'

describe('autofigure-edit failure helpers', () => {
  const fallbackMessage = 'Service is currently busy. No points were deducted.'

  it('treats Failed (code X) as runtime busy failure', () => {
    expect(isAutoFigureRuntimeBusyFailureMessage('Failed (code 1)')).toBe(true)
    expect(isAutoFigureRuntimeBusyFailureMessage('Failed (code 429)')).toBe(true)
  })

  it('normalizes queue saturation errors to fallback message', () => {
    const raw = 'You have too many queued AutoFigure-Edit runs. Please wait.'
    expect(
      normalizeAutoFigureRuntimeFailureMessage({
        rawMessage: raw,
        fallbackMessage,
      })
    ).toBe(fallbackMessage)
  })

  it('keeps non-busy errors untouched', () => {
    const raw = 'Insufficient points. Required: 500, balance: 0.'
    expect(
      normalizeAutoFigureRuntimeFailureMessage({
        rawMessage: raw,
        fallbackMessage,
      })
    ).toBe(raw)
  })
})
