'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { confirmPointsAutoCharge, previewPointsCost } from '@/lib/api/points'
import { pointsKeys } from '@/lib/hooks/usePoints'

type MeteredActionConfirmationDetail = {
  error: string
  message: string
  action_code: string
  ref_id: string
  estimated_cost: number
  reason?: string
}

export type MeteredActionPendingCharge = MeteredActionConfirmationDetail

type MeteredActionFinalizePayload = {
  points_estimated_cost?: number
  points_actual_cost?: number
  points_balance_after?: number
}

type ExecuteResult<T> = {
  data: T
  finalize?: MeteredActionFinalizePayload
}

type MeteredActionOptions<TParams, TResult> = {
  actionCode: string
  execute: (params: TParams, confirmationToken?: string) => Promise<ExecuteResult<TResult>>
  buildPreviewPayload?: (params?: TParams) => Record<string, unknown> | undefined
}

type MeteredRunConfig = {
  confirmationToken?: string
  skipPreview?: boolean
  previewCostOverride?: number
  previewPayloadOverride?: Record<string, unknown>
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function asFiniteNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function extractErrorMessage(error: unknown): string {
  const extractDetailMessage = (detail: unknown): string | null => {
    const direct = asNonEmptyString(detail)
    if (direct) return direct

    if (Array.isArray(detail)) {
      for (const item of detail) {
        if (!item || typeof item !== 'object') {
          continue
        }
        const record = item as Record<string, unknown>
        const msg = asNonEmptyString(record.msg)
        if (!msg) {
          continue
        }
        const loc = Array.isArray(record.loc)
          ? record.loc.filter((part) => typeof part === 'string' || typeof part === 'number').join('.')
          : ''
        return loc ? `${loc}: ${msg}` : msg
      }
      return null
    }

    if (!detail || typeof detail !== 'object') {
      return null
    }

    const record = detail as Record<string, unknown>
    const errorCode = asNonEmptyString(record.error)

    if (errorCode === 'insufficient_points') {
      return buildInsufficientMessage(record)
    }

    const message = asNonEmptyString(record.message) || asNonEmptyString(record.detail)
    if (message) {
      const requiredMinimum = asFiniteNumber(record.required_minimum)
      const balance = asFiniteNumber(record.balance)
      if (requiredMinimum > 0 && !/required:\s*\d+/i.test(message)) {
        return `${message} Required: ${requiredMinimum}, balance: ${balance}.`
      }
      return message
    }

    if (errorCode === 'confirmation_required') {
      return 'Charge confirmation required. Please confirm and retry.'
    }

    if (errorCode) {
      return errorCode.replace(/_/g, ' ')
    }

    return null
  }

  if (error && typeof error === 'object') {
    const maybeResponse = (error as { response?: { data?: unknown } }).response?.data
    if (maybeResponse && typeof maybeResponse === 'object') {
      const detailMessage = extractDetailMessage((maybeResponse as { detail?: unknown }).detail)
      if (detailMessage) {
        return detailMessage
      }
      const payloadMessage = asNonEmptyString((maybeResponse as { message?: unknown }).message)
      if (payloadMessage) {
        return payloadMessage
      }
    }

    const maybeMessage = asNonEmptyString((error as { message?: unknown }).message)
    if (maybeMessage) {
      return maybeMessage
    }
  }
  return 'Please try again.'
}

function buildInsufficientMessage(detail: Record<string, unknown>): string {
  const requiredMinimum = Number(detail.required_minimum ?? 0)
  const balance = Number(detail.balance ?? 0)
  const message = typeof detail.message === 'string' ? detail.message.trim() : ''
  if (message) {
    if (requiredMinimum > 0) {
      return `${message} Required: ${requiredMinimum}, balance: ${balance}.`
    }
    return message
  }
  if (requiredMinimum > 0) {
    return `Insufficient points. Required: ${requiredMinimum}, balance: ${balance}.`
  }
  return 'Insufficient points for this action.'
}

export function useMeteredAction<TParams, TResult>(options: MeteredActionOptions<TParams, TResult>) {
  const actionCode = options.actionCode
  const execute = options.execute
  const buildPreviewPayload = options.buildPreviewPayload
  const queryClient = useQueryClient()
  const [isRunning, setIsRunning] = useState(false)
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null)
  const [lastActualCost, setLastActualCost] = useState<number | null>(null)
  const [pendingCharge, setPendingCharge] = useState<MeteredActionPendingCharge | null>(null)
  const [pendingConfirmationToken, setPendingConfirmationToken] = useState<string | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<TResult | null>(null)
  const pendingParamsRef = useRef<TParams | null>(null)

  const resetPendingCharge = useCallback(() => {
    setPendingCharge(null)
    setPendingConfirmationToken(null)
    pendingParamsRef.current = null
  }, [])

  const refreshEstimate = useCallback(
    async (params?: TParams) => {
      const payloadHint = buildPreviewPayload?.(params)
      const preview = await previewPointsCost({ action_code: actionCode, payload_hint: payloadHint })
      const nextEstimate = Math.max(0, Math.floor(preview.estimated_cost || 0))
      setEstimatedCost(nextEstimate)
      return preview
    },
    [actionCode, buildPreviewPayload],
  )

  const run = useCallback(
    async (params: TParams, runConfig?: MeteredRunConfig): Promise<TResult | null> => {
      setIsRunning(true)
      setLastError(null)
      setLastActualCost(null)

      let previewCost = Math.max(0, Math.floor(runConfig?.previewCostOverride ?? estimatedCost ?? 0))

      try {
        if (!runConfig?.skipPreview) {
          const payloadHint =
            runConfig?.previewPayloadOverride === undefined
              ? buildPreviewPayload?.(params)
              : runConfig.previewPayloadOverride

          const preview = await previewPointsCost({
            action_code: actionCode,
            payload_hint: payloadHint,
          })

          previewCost = Math.max(0, Math.floor(preview.estimated_cost || 0))
          setEstimatedCost(previewCost)

          if (!preview.can_afford) {
            const required = Math.max(0, Math.floor(preview.required_minimum || previewCost || 0))
            const balance = Math.floor(preview.balance_before || 0)
            throw new Error(`Insufficient points. Required: ${required}, balance: ${balance}.`)
          }
        }

        const outcome = await execute(
          params,
          runConfig?.confirmationToken || pendingConfirmationToken || undefined,
        )

        const actualCost = Math.max(
          0,
          Math.floor(
            outcome.finalize?.points_actual_cost || outcome.finalize?.points_estimated_cost || previewCost || 0,
          ),
        )
        const balanceAfter = outcome.finalize?.points_balance_after

        setLastActualCost(actualCost)
        setLastResult(outcome.data)
        setPendingCharge(null)
        pendingParamsRef.current = null
        void balanceAfter

        void queryClient.invalidateQueries({ queryKey: pointsKeys.summary() })
        setPendingConfirmationToken(null)
        return outcome.data
      } catch (error) {
        const responseData =
          error && typeof error === 'object'
            ? (error as { response?: { data?: unknown } }).response?.data
            : null

        const detail =
          responseData && typeof responseData === 'object'
            ? (responseData as { detail?: unknown }).detail
            : null

        if (
          detail &&
          typeof detail === 'object' &&
          (detail as { error?: unknown }).error === 'confirmation_required'
        ) {
          setPendingCharge(detail as MeteredActionPendingCharge)
          pendingParamsRef.current = params
          return null
        }

        void queryClient.invalidateQueries({ queryKey: pointsKeys.summary() })

        const message = extractErrorMessage(error)
        setLastError(message)
        throw new Error(message)
      } finally {
        setIsRunning(false)
      }
    },
    [actionCode, buildPreviewPayload, estimatedCost, execute, pendingConfirmationToken, queryClient],
  )

  const confirmAndRetry = useCallback(
    async (config: {
      subscribe_auto_charge?: boolean
      max_single_charge?: number
      max_daily_auto_charge?: number
      expires_in_days?: number
      source?: string
    }): Promise<TResult | null> => {
      if (!pendingCharge || !pendingParamsRef.current) {
        return null
      }

      const confirmation = await confirmPointsAutoCharge({
        action_code: pendingCharge.action_code,
        ref_id: pendingCharge.ref_id,
        estimated_cost: pendingCharge.estimated_cost,
        subscribe_auto_charge: config.subscribe_auto_charge,
        max_single_charge: config.max_single_charge,
        max_daily_auto_charge: config.max_daily_auto_charge,
        expires_in_days: config.expires_in_days,
        source: config.source,
      })

      setPendingConfirmationToken(confirmation.confirmation_token)
      const params = pendingParamsRef.current
      const result = await run(params, {
        confirmationToken: confirmation.confirmation_token,
        skipPreview: true,
        previewCostOverride: pendingCharge.estimated_cost,
      })
      if (result) {
        setPendingCharge(null)
        setPendingConfirmationToken(null)
        pendingParamsRef.current = null
      }
      return result
    },
    [pendingCharge, run],
  )

  const cancelPending = useCallback(() => {
    resetPendingCharge()
    void queryClient.invalidateQueries({ queryKey: pointsKeys.summary() })
  }, [queryClient, resetPendingCharge])

  const state = useMemo(
    () => ({
      isRunning,
      estimatedCost,
      lastActualCost,
      pendingCharge,
      lastError,
      lastResult,
    }),
    [estimatedCost, isRunning, lastActualCost, lastError, lastResult, pendingCharge],
  )

  return {
    ...state,
    run,
    refreshEstimate,
    confirmAndRetry,
    cancelPending,
    clearPendingCharge: resetPendingCharge,
  }
}
