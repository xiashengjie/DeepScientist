const REVIEW_ID_PREFIX = 'DS-RV-'
const REVIEW_ID_SUFFIX_LENGTH = 10
const REVIEW_ID_PATTERN = /^DS-RV-([0-9A-Z]{10})$/
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function sanitizeSuffix(value: string) {
  const cleaned = (value || '').toUpperCase().replace(/[^0-9A-Z]/g, '')
  if (!cleaned) {
    return 'UNKNOWNXXX'
  }
  if (cleaned.length >= REVIEW_ID_SUFFIX_LENGTH) {
    return cleaned.slice(0, REVIEW_ID_SUFFIX_LENGTH)
  }
  return cleaned.padEnd(REVIEW_ID_SUFFIX_LENGTH, 'X')
}

function suffixFromUuid(value: string) {
  const compact = value.replace(/-/g, '').toUpperCase()
  if (!compact) {
    return 'UNKNOWNXXX'
  }
  if (compact.length >= REVIEW_ID_SUFFIX_LENGTH) {
    return compact.slice(0, REVIEW_ID_SUFFIX_LENGTH)
  }
  return compact.padEnd(REVIEW_ID_SUFFIX_LENGTH, 'X')
}

export function isReviewDisplayId(value?: string | null) {
  if (!value) return false
  return REVIEW_ID_PATTERN.test(value.trim().toUpperCase())
}

export function normalizeReviewRouteId(
  reviewId?: string | null,
  fallbackWorkspaceId?: string | null
) {
  const primary = (reviewId || '').trim()
  if (primary) {
    const normalized = primary.toUpperCase()
    if (REVIEW_ID_PATTERN.test(normalized)) {
      return normalized
    }
    if (normalized.startsWith(REVIEW_ID_PREFIX)) {
      return `${REVIEW_ID_PREFIX}${sanitizeSuffix(normalized.slice(REVIEW_ID_PREFIX.length))}`
    }
    if (UUID_PATTERN.test(primary)) {
      return `${REVIEW_ID_PREFIX}${suffixFromUuid(primary)}`
    }
  }

  const fallback = (fallbackWorkspaceId || '').trim()
  if (fallback) {
    if (UUID_PATTERN.test(fallback)) {
      return `${REVIEW_ID_PREFIX}${suffixFromUuid(fallback)}`
    }
    const upper = fallback.toUpperCase()
    if (upper.startsWith(REVIEW_ID_PREFIX)) {
      return `${REVIEW_ID_PREFIX}${sanitizeSuffix(upper.slice(REVIEW_ID_PREFIX.length))}`
    }
    return `${REVIEW_ID_PREFIX}${sanitizeSuffix(upper)}`
  }

  return `${REVIEW_ID_PREFIX}UNKNOWNXXX`
}
