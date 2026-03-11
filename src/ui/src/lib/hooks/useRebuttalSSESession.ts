'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { refreshAccessToken } from '@/lib/api/auth'

export type SSEConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'reconnecting'
  | 'closed'
  | 'error'
  | 'rate_limited'

export interface SSEConnectionState {
  status: SSEConnectionStatus
  error?: string
  retryAt?: number
}

export interface RebuttalSSEFrame<T> {
  eventType: string
  data: T
  eventId?: string
}

type RuntimeListener = () => void

interface StreamRuntime {
  key: string
  connection: SSEConnectionState
  isStreaming: boolean
  abortController: AbortController | null
  runId: number
  abortedRunId: number | null
  lastEventId: string | null
  listeners: Set<RuntimeListener>
  eventSubscribers: Set<(frame: RebuttalSSEFrame<any>) => void>
  connectionSubscribers: Set<(state: SSEConnectionState) => void>
}

const runtimes = new Map<string, StreamRuntime>()

const getRuntime = (key: string) => runtimes.get(key) ?? null

const getOrCreateRuntime = (key: string) => {
  const existing = runtimes.get(key)
  if (existing) return existing
  const runtime: StreamRuntime = {
    key,
    connection: { status: 'idle' },
    isStreaming: false,
    abortController: null,
    runId: 0,
    abortedRunId: null,
    lastEventId: null,
    listeners: new Set(),
    eventSubscribers: new Set(),
    connectionSubscribers: new Set(),
  }
  runtimes.set(key, runtime)
  return runtime
}

const maybeCleanupRuntime = (key: string) => {
  const runtime = runtimes.get(key)
  if (!runtime) return
  if (runtime.isStreaming) return
  if (runtime.abortController) return
  if (runtime.listeners.size > 0) return
  if (runtime.eventSubscribers.size > 0) return
  if (runtime.connectionSubscribers.size > 0) return
  runtimes.delete(key)
}

const notifyRuntime = (runtime: StreamRuntime) => {
  for (const listener of runtime.listeners) {
    try {
      listener()
    } catch {
      // ignore
    }
  }
}

const updateConnection = (runtime: StreamRuntime, next: SSEConnectionState, runId?: number) => {
  if (typeof runId === 'number' && runtime.runId !== runId) return
  runtime.connection = next
  for (const subscriber of runtime.connectionSubscribers) {
    try {
      subscriber(next)
    } catch {
      // ignore
    }
  }
  notifyRuntime(runtime)
}

const setStreaming = (runtime: StreamRuntime, next: boolean, runId?: number) => {
  if (typeof runId === 'number' && runtime.runId !== runId) return
  runtime.isStreaming = next
  notifyRuntime(runtime)
}

const parseEventBlock = (block: string) => {
  const lines = block.split(/\n/)
  let eventType = ''
  let eventId = ''
  const dataLines: string[] = []

  for (const line of lines) {
    if (!line) continue
    if (line.startsWith('event:')) {
      eventType = line.slice(6).trim()
      continue
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart())
      continue
    }
    if (line.startsWith('id:')) {
      eventId = line.slice(3).trim()
    }
  }

  if (dataLines.length === 0) return null
  return {
    event: eventType || 'message',
    data: dataLines.join('\n'),
    id: eventId || undefined,
  }
}

const buildHttpError = async (response: Response) => {
  let detailMessage = ''
  try {
    const contentType = (response.headers.get('content-type') || '').toLowerCase()
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as {
        detail?: unknown
        message?: unknown
      }
      const detail = payload?.detail
      if (typeof detail === 'string') {
        detailMessage = detail
      } else if (typeof payload?.message === 'string' && payload.message.trim()) {
        detailMessage = payload.message
      }
    } else {
      const raw = (await response.text()).trim()
      if (raw) detailMessage = raw
    }
  } catch {
    // ignore body parse errors
  }

  const fallback = `HTTP ${response.status}: ${response.statusText}`
  return new Error(detailMessage || fallback)
}

const startNewRun = (runtime: StreamRuntime) => {
  runtime.runId += 1
  runtime.abortedRunId = null
  const runId = runtime.runId

  if (runtime.abortController) {
    runtime.abortController.abort()
    runtime.abortController = null
  }

  return runId
}

const stopRuntime = (runtime: StreamRuntime) => {
  const abortedRunId = runtime.runId
  runtime.runId += 1
  runtime.abortedRunId = abortedRunId
  if (runtime.abortController) {
    runtime.abortController.abort()
    runtime.abortController = null
  }
  runtime.isStreaming = false
  runtime.connection = { status: 'closed' }
  notifyRuntime(runtime)
  for (const subscriber of runtime.connectionSubscribers) {
    try {
      subscriber(runtime.connection)
    } catch {
      // ignore
    }
  }
  maybeCleanupRuntime(runtime.key)
  return abortedRunId
}

const runStream = async <T,>(
  runtime: StreamRuntime,
  payload: { url: string; getLastEventId?: () => string | null },
  runId: number,
  attempt = 0
) => {
  if (runtime.runId !== runId) return

  const controller = new AbortController()
  runtime.abortController = controller

  setStreaming(runtime, true, runId)
  updateConnection(runtime, { status: attempt > 0 ? 'reconnecting' : 'connecting' }, runId)

  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
  }
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('ds_access_token')
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  const currentLastEventId = payload.getLastEventId?.() || runtime.lastEventId
  if (currentLastEventId) {
    headers['Last-Event-ID'] = currentLastEventId
  }

  let cancelReader: (() => void) | null = null
  let handleAbort: (() => void) | null = null

  try {
    const url = payload.url
    const method = 'GET'

    let response: Response
    try {
      response = await fetch(url, {
        method,
        headers,
        signal: controller.signal,
      })
    } catch (error) {
      throw error
    }

    if (runtime.runId !== runId) return

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get('Retry-After') ?? '3')
      const retryMs = Number.isFinite(retryAfter) ? retryAfter * 1000 : 3000
      const retryAt = Date.now() + retryMs
      updateConnection(runtime, { status: 'rate_limited', retryAt, error: 'rate_limited' }, runId)
      setStreaming(runtime, false, runId)
      if (attempt < 2 && typeof window !== 'undefined') {
        window.setTimeout(() => {
          if (runtime.runId !== runId) return
          if (runtime.abortController?.signal.aborted) return
          void runStream(runtime, payload, runId, attempt + 1)
        }, retryMs)
      }
      return
    }

    if (response.status === 401) {
      if (attempt < 1) {
        const refreshed = await refreshAccessToken()
        if (refreshed) {
          setStreaming(runtime, false, runId)
          void runStream(runtime, payload, runId, attempt + 1)
          return
        }
      }
      updateConnection(runtime, { status: 'error', error: 'unauthorized' }, runId)
      setStreaming(runtime, false, runId)
      return
    }

    if (!response.ok) {
      throw await buildHttpError(response)
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      await response.json()
      setStreaming(runtime, false, runId)
      updateConnection(runtime, { status: 'closed' }, runId)
      return
    }

    updateConnection(runtime, { status: 'open' }, runId)

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let readerCancelled = false
    cancelReader = () => {
      if (readerCancelled) return
      readerCancelled = true
      reader.cancel().catch(() => {})
    }
    handleAbort = () => {
      cancelReader?.()
    }
    if (controller.signal.aborted) {
      handleAbort()
    } else {
      controller.signal.addEventListener('abort', handleAbort, { once: true })
    }

    while (true) {
      if (controller.signal.aborted || runtime.runId !== runId || runtime.abortedRunId === runId) {
        break
      }
      const { done, value } = await reader.read()
      if (done) break
      if (controller.signal.aborted || runtime.runId !== runId || runtime.abortedRunId === runId) {
        break
      }
      buffer += decoder.decode(value, { stream: true })
      if (buffer.includes('\r')) {
        buffer = buffer.replace(/\r\n/g, '\n')
      }

      let boundaryIndex = buffer.indexOf('\n\n')
      while (boundaryIndex !== -1) {
        if (runtime.runId !== runId) break
        const raw = buffer.slice(0, boundaryIndex)
        buffer = buffer.slice(boundaryIndex + 2)
        const normalized = raw.replace(/\r\n/g, '\n').trim()
        const parsed = parseEventBlock(normalized)
        const shouldDispatch =
          runtime.runId === runId && runtime.abortedRunId !== runId && !controller.signal.aborted
        if (parsed && shouldDispatch) {
          try {
            const data = JSON.parse(parsed.data) as T
            const eventType = parsed.event
            const fallbackEventId =
              typeof (data as { event_id?: unknown })?.event_id === 'string'
                ? String((data as { event_id?: unknown }).event_id)
                : undefined
            const resolvedEventId = parsed.id || fallbackEventId
            if (resolvedEventId && eventType !== 'heartbeat') {
              runtime.lastEventId = resolvedEventId
            }
            for (const subscriber of runtime.eventSubscribers) {
              try {
                subscriber({ eventType, data, eventId: resolvedEventId })
              } catch {
                // ignore
              }
            }
          } catch {
            // ignore parse errors
          }
        }
        boundaryIndex = buffer.indexOf('\n\n')
      }
    }

    setStreaming(runtime, false, runId)
    updateConnection(runtime, { status: 'closed' }, runId)
  } catch (error) {
    if (controller.signal.aborted) {
      setStreaming(runtime, false, runId)
      updateConnection(runtime, { status: 'closed' }, runId)
      return
    }
    const message = error instanceof Error ? error.message : 'SSE error'
    updateConnection(runtime, { status: 'error', error: message }, runId)
    setStreaming(runtime, false, runId)
    if (attempt < 1 && runtime.runId === runId) {
      void runStream(runtime, payload, runId, attempt + 1)
    }
  } finally {
    if (cancelReader && !controller.signal.aborted && runtime.abortedRunId === runId) {
      cancelReader()
    }
    if (handleAbort) {
      controller.signal.removeEventListener('abort', handleAbort)
    }
    if (runtime.abortController === controller) {
      runtime.abortController = null
    }
    maybeCleanupRuntime(runtime.key)
  }
}

export function useRebuttalSSESession<T>(options: {
  streamKey?: string | null
  url?: string | null
  enabled?: boolean
  getLastEventId?: () => string | null
  onEvent?: (event: RebuttalSSEFrame<T>) => void
  onConnectionChange?: (state: SSEConnectionState) => void
}) {
  const { streamKey, url, enabled = true, getLastEventId, onEvent, onConnectionChange } = options
  const onEventRef = useRef<typeof onEvent>(onEvent)
  const onConnectionChangeRef = useRef<typeof onConnectionChange>(onConnectionChange)
  const getLastEventIdRef = useRef<typeof getLastEventId>(getLastEventId)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    onConnectionChangeRef.current = onConnectionChange
  }, [onConnectionChange])

  useEffect(() => {
    getLastEventIdRef.current = getLastEventId
  }, [getLastEventId])

  const runtimeSnapshot = useMemo(() => {
    if (!streamKey) {
      return { connection: { status: 'idle' } as SSEConnectionState, isStreaming: false }
    }
    const runtime = getRuntime(streamKey)
    if (!runtime) {
      return { connection: { status: 'idle' } as SSEConnectionState, isStreaming: false }
    }
    return { connection: runtime.connection, isStreaming: runtime.isStreaming }
  }, [streamKey])

  const [connection, setConnectionState] = useState<SSEConnectionState>(runtimeSnapshot.connection)
  const [isStreaming, setIsStreamingState] = useState(runtimeSnapshot.isStreaming)

  useEffect(() => {
    if (!streamKey) {
      setConnectionState({ status: 'idle' })
      setIsStreamingState(false)
      return
    }

    const runtime = getOrCreateRuntime(streamKey)

    const sync = () => {
      const latest = getRuntime(streamKey)
      if (!latest) return
      setConnectionState(latest.connection)
      setIsStreamingState(latest.isStreaming)
    }

    sync()

    const stateListener: RuntimeListener = () => {
      sync()
    }
    runtime.listeners.add(stateListener)

    const eventListener = (event: RebuttalSSEFrame<T>) => {
      onEventRef.current?.(event)
    }
    runtime.eventSubscribers.add(eventListener)

    const connectionListener = (next: SSEConnectionState) => {
      onConnectionChangeRef.current?.(next)
    }
    runtime.connectionSubscribers.add(connectionListener)

    return () => {
      runtime.listeners.delete(stateListener)
      runtime.eventSubscribers.delete(eventListener)
      runtime.connectionSubscribers.delete(connectionListener)
      maybeCleanupRuntime(streamKey)
    }
  }, [streamKey])

  const start = useCallback(() => {
    if (!streamKey || !url) return
    const runtime = getOrCreateRuntime(streamKey)
    const resolveLastEventId = getLastEventIdRef.current
    if (resolveLastEventId) {
      runtime.lastEventId = resolveLastEventId()
    }

    const status = runtime.connection.status
    const hasActiveStream =
      runtime.isStreaming ||
      runtime.abortController != null ||
      status === 'connecting' ||
      status === 'open' ||
      status === 'reconnecting' ||
      status === 'rate_limited'
    if (hasActiveStream) return

    const runId = startNewRun(runtime)
    void runStream(
      runtime,
      {
        url,
        getLastEventId: () => getLastEventIdRef.current?.() || null,
      },
      runId,
      0
    )
  }, [streamKey, url])

  const stop = useCallback(() => {
    if (!streamKey) return null
    const runtime = getRuntime(streamKey)
    if (!runtime) return null
    return stopRuntime(runtime)
  }, [streamKey])

  useEffect(() => {
    if (!streamKey) return
    if (!enabled || !url) {
      stop()
      return
    }
    start()
  }, [enabled, start, stop, streamKey, url])

  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    start,
    stop,
    connection,
    isStreaming,
  }
}
