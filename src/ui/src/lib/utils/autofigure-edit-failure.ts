const AUTOFIGURE_RUNTIME_BUSY_PATTERNS = [
  'service busy',
  'system issue detected',
  'too many queued autofigure-edit runs',
  'too many queued',
  'please wait',
  'temporarily unavailable',
  'rate limit',
  'code 429',
  'status code 429',
  'run failed before execution',
  'server is busy',
  'overloaded',
  '当前服务繁忙',
  '服务繁忙',
  '系统繁忙',
  '当前系统存在问题',
] as const

function normalizeFailureMessageForMatching(rawMessage: string): string {
  return rawMessage.trim().toLowerCase().replace(/^failed:\s*/, '')
}

function isFailedWithCodeMessage(normalizedMessage: string): boolean {
  return /^failed\s*\(code\s*-?\d+\)\.?$/i.test(normalizedMessage)
}

export function isAutoFigureRuntimeBusyFailureMessage(rawMessage: string | null | undefined): boolean {
  if (typeof rawMessage !== 'string') return false
  const normalized = normalizeFailureMessageForMatching(rawMessage)
  if (!normalized || normalized === 'failed' || normalized === 'failed.') {
    return true
  }
  if (isFailedWithCodeMessage(normalized)) {
    return true
  }
  return AUTOFIGURE_RUNTIME_BUSY_PATTERNS.some((pattern) => normalized.includes(pattern))
}

export function normalizeAutoFigureRuntimeFailureMessage(params: {
  rawMessage: string | null | undefined
  fallbackMessage: string
}): string {
  const { rawMessage, fallbackMessage } = params
  const normalizedRaw = typeof rawMessage === 'string' ? rawMessage.trim() : ''
  if (!normalizedRaw) {
    return fallbackMessage
  }
  if (isAutoFigureRuntimeBusyFailureMessage(normalizedRaw)) {
    return fallbackMessage
  }
  return normalizedRaw
}
