const REBUTTAL_ID_PREFIX = 'DS-RB-'
const REBUTTAL_ID_SUFFIX_LENGTH = 10
const REBUTTAL_ID_PATTERN = /^DS-RB-([0-9A-Z]{10})$/
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function sanitizeSuffix(value: string) {
  const cleaned = (value || '').toUpperCase().replace(/[^0-9A-Z]/g, '')
  if (!cleaned) {
    return 'UNKNOWNXXX'
  }
  if (cleaned.length >= REBUTTAL_ID_SUFFIX_LENGTH) {
    return cleaned.slice(0, REBUTTAL_ID_SUFFIX_LENGTH)
  }
  return cleaned.padEnd(REBUTTAL_ID_SUFFIX_LENGTH, 'X')
}

function suffixFromUuid(value: string) {
  const compact = value.replace(/-/g, '').toUpperCase()
  if (!compact) {
    return 'UNKNOWNXXX'
  }
  if (compact.length >= REBUTTAL_ID_SUFFIX_LENGTH) {
    return compact.slice(0, REBUTTAL_ID_SUFFIX_LENGTH)
  }
  return compact.padEnd(REBUTTAL_ID_SUFFIX_LENGTH, 'X')
}

export function isRebuttalDisplayId(value?: string | null) {
  if (!value) return false
  return REBUTTAL_ID_PATTERN.test(value.trim().toUpperCase())
}

export function normalizeRebuttalRouteId(
  rebuttalId?: string | null,
  fallbackWorkspaceId?: string | null
) {
  const primary = (rebuttalId || '').trim()
  if (primary) {
    const normalized = primary.toUpperCase()
    if (REBUTTAL_ID_PATTERN.test(normalized)) {
      return normalized
    }
    if (normalized.startsWith(REBUTTAL_ID_PREFIX)) {
      return `${REBUTTAL_ID_PREFIX}${sanitizeSuffix(normalized.slice(REBUTTAL_ID_PREFIX.length))}`
    }
    if (UUID_PATTERN.test(primary)) {
      return `${REBUTTAL_ID_PREFIX}${suffixFromUuid(primary)}`
    }
  }

  const fallback = (fallbackWorkspaceId || '').trim()
  if (fallback) {
    if (UUID_PATTERN.test(fallback)) {
      return `${REBUTTAL_ID_PREFIX}${suffixFromUuid(fallback)}`
    }
    const upper = fallback.toUpperCase()
    if (upper.startsWith(REBUTTAL_ID_PREFIX)) {
      return `${REBUTTAL_ID_PREFIX}${sanitizeSuffix(upper.slice(REBUTTAL_ID_PREFIX.length))}`
    }
    return `${REBUTTAL_ID_PREFIX}${sanitizeSuffix(upper)}`
  }

  return `${REBUTTAL_ID_PREFIX}UNKNOWNXXX`
}
