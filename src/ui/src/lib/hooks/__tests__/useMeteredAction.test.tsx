import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useMeteredAction } from '@/lib/hooks/useMeteredAction'
import { pointsKeys } from '@/lib/hooks/usePoints'
import type { PointsSummary } from '@/lib/types/points'
import * as pointsApi from '@/lib/api/points'

jest.mock('@/lib/api/points', () => ({
  previewPointsCost: jest.fn(),
  confirmPointsAutoCharge: jest.fn(),
}))

function makeSummary(total: number): PointsSummary {
  return {
    user_id: 'user-1',
    daily_points_balance: 100,
    daily_points_granted_today: 100,
    daily_points_consumed_today: 0,
    normal_points_balance: total - 100,
    normal_points_cycle_total: total - 100,
    normal_points_cycle_used: 0,
    normal_points_cycle_remaining: total - 100,
    normal_points_cycle_expires_at: null,
    total_points_balance: total,
    plan_tier: 'plus',
    plan_status: 'active',
    plan_started_at: null,
    plan_expires_at: null,
    next_daily_refresh_at_utc: new Date().toISOString(),
    low_balance_alert_enabled: true,
    low_balance_threshold: 500,
    low_balance: false,
    feature_entitlements: {},
  }
}

describe('useMeteredAction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does not apply optimistic points deduction before backend settlement', async () => {
    const previewMock = pointsApi.previewPointsCost as jest.MockedFunction<typeof pointsApi.previewPointsCost>
    previewMock.mockResolvedValue({
      action_code: 'review.generate',
      estimated_cost: 120,
      required_minimum: 50,
      can_afford: true,
      balance_before: 1000,
      balance_after_estimated: 880,
    })

    const execute = jest.fn(async () => ({
      data: { ok: true },
      finalize: {
        points_estimated_cost: 120,
        points_actual_cost: 118,
        points_balance_after: 882,
      },
    }))

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const initialSummary = makeSummary(1000)
    queryClient.setQueryData(pointsKeys.summary(), initialSummary)

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(
      () =>
        useMeteredAction({
          actionCode: 'review.generate',
          execute,
        }),
      { wrapper },
    )

    await act(async () => {
      await result.current.run({ requestId: 'r1' })
    })

    expect(previewMock).toHaveBeenCalledTimes(1)
    expect(execute).toHaveBeenCalledTimes(1)
    expect(queryClient.getQueryData(pointsKeys.summary())).toEqual(initialSummary)
  })

  it('surfaces structured insufficient points detail from backend responses', async () => {
    const previewMock = pointsApi.previewPointsCost as jest.MockedFunction<typeof pointsApi.previewPointsCost>
    previewMock.mockResolvedValue({
      action_code: 'autofigure.edit.run',
      estimated_cost: 500,
      required_minimum: 500,
      can_afford: true,
      balance_before: 1200,
      balance_after_estimated: 700,
    })

    const execute = jest.fn(async () => {
      throw {
        response: {
          data: {
            detail: {
              error: 'insufficient_points',
              message: 'Insufficient points for this action.',
              required_minimum: 500,
              balance: 120,
            },
          },
        },
      }
    })

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(
      () =>
        useMeteredAction({
          actionCode: 'autofigure.edit.run',
          execute,
        }),
      { wrapper },
    )

    let thrownMessage = ''
    await act(async () => {
      try {
        await result.current.run({ requestId: 'r2' })
      } catch (error) {
        thrownMessage = error instanceof Error ? error.message : String(error)
      }
    })

    expect(thrownMessage).toBe('Insufficient points for this action. Required: 500, balance: 120.')
    expect(result.current.lastError).toBe('Insufficient points for this action. Required: 500, balance: 120.')
  })

  it('surfaces validation errors when backend returns detail arrays', async () => {
    const previewMock = pointsApi.previewPointsCost as jest.MockedFunction<typeof pointsApi.previewPointsCost>
    previewMock.mockResolvedValue({
      action_code: 'review.generate',
      estimated_cost: 100,
      required_minimum: 50,
      can_afford: true,
      balance_before: 1000,
      balance_after_estimated: 900,
    })

    const execute = jest.fn(async () => {
      throw {
        response: {
          data: {
            detail: [
              {
                loc: ['body', 'file'],
                msg: 'Field required',
              },
            ],
          },
        },
      }
    })

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(
      () =>
        useMeteredAction({
          actionCode: 'review.generate',
          execute,
        }),
      { wrapper },
    )

    let thrownMessage = ''
    await act(async () => {
      try {
        await result.current.run({ requestId: 'r3' })
      } catch (error) {
        thrownMessage = error instanceof Error ? error.message : String(error)
      }
    })

    expect(thrownMessage).toBe('body.file: Field required')
    expect(result.current.lastError).toBe('body.file: Field required')
  })
})
