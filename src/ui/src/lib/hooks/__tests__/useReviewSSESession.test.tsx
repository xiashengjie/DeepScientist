import { act, renderHook, waitFor } from '@testing-library/react'
import { ReadableStream as NodeReadableStream } from 'stream/web'
import { useReviewSSESession } from '@/lib/hooks/useReviewSSESession'

jest.mock('@/lib/api/auth', () => ({
  refreshAccessToken: jest.fn().mockResolvedValue(false),
}))

describe('useReviewSSESession', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('does not restart stream when getLastEventId callback identity changes', async () => {
    const Stream = globalThis.ReadableStream ?? NodeReadableStream
    const fetchMock = jest.fn().mockImplementation((_url, options) => {
      const signal = options?.signal as AbortSignal | undefined
      const stream = new Stream({
        start(controller) {
          if (signal?.aborted) {
            controller.close()
            return
          }
          signal?.addEventListener('abort', () => controller.close(), { once: true })
        },
      })

      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: (name: string) => (name.toLowerCase() === 'content-type' ? 'text/event-stream' : null),
        },
        body: stream,
      })
    })

    globalThis.fetch = fetchMock as unknown as typeof fetch

    const { rerender, unmount } = renderHook(
      ({ seed }) =>
        useReviewSSESession({
          streamKey: 'review:test-stream',
          url: 'http://example.com/api/v1/review/workspaces/x/runs/y/stream',
          enabled: true,
          getLastEventId: () => `evt-${seed}`,
        }),
      {
        initialProps: { seed: 1 },
      }
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    act(() => {
      rerender({ seed: 2 })
      rerender({ seed: 3 })
      rerender({ seed: 4 })
    })

    await waitFor(
      () => {
        expect(fetchMock).toHaveBeenCalledTimes(1)
      },
      { timeout: 200 }
    )

    unmount()
  })
})
