import { useEffect } from 'react'
import { listBroadcasts } from '@/lib/api/broadcasts'
import { supportsBroadcasts } from '@/lib/runtime/quest-runtime'
import { acquireNotificationSocket } from '@/lib/realtime/notification-socket'
import { useBroadcastsStore } from '@/lib/stores/broadcasts'
import type { BroadcastMessage } from '@/lib/types/broadcast'

function normalizeBroadcast(payload: Partial<BroadcastMessage> | null | undefined): BroadcastMessage | null {
  if (!payload) return null
  const message = String(payload.message || '').trim()
  if (!message) return null
  return {
    id: String(payload.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`),
    message,
    title: payload.title ?? null,
    image_url: payload.image_url ?? null,
    level: payload.level || 'info',
    created_at: payload.created_at || new Date().toISOString(),
    expires_at: payload.expires_at ?? null,
    show_to_users: payload.show_to_users ?? true,
    read_at: payload.read_at ?? null,
  }
}

export function useBroadcasts(enabled = true) {
  const items = useBroadcastsStore((state) => state.items)
  const isLoading = useBroadcastsStore((state) => state.isLoading)
  const setBroadcasts = useBroadcastsStore((state) => state.setBroadcasts)
  const addBroadcast = useBroadcastsStore((state) => state.addBroadcast)
  const setLoading = useBroadcastsStore((state) => state.setLoading)
  const setError = useBroadcastsStore((state) => state.setError)

  useEffect(() => {
    if (!enabled) return
    if (!supportsBroadcasts()) {
      setBroadcasts([])
      setLoading(false)
      setError(null)
      return
    }
    if (items.length > 0 || isLoading) return
    let cancelled = false
    setLoading(true)
    listBroadcasts()
      .then((response) => {
        if (cancelled) return
        setBroadcasts(response.broadcasts || [])
      })
      .catch((err) => {
        if (cancelled) return
        setError(err?.message || 'Failed to load broadcasts')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled, items.length, isLoading, setBroadcasts, setError, setLoading])

  useEffect(() => {
    if (!enabled) return
    if (!supportsBroadcasts()) return
    const { socket, release } = acquireNotificationSocket()
    const handleBroadcast = (payload: Partial<BroadcastMessage>) => {
      const normalized = normalizeBroadcast(payload)
      if (normalized && normalized.show_to_users !== false) {
        addBroadcast(normalized)
      }
    }

    socket.on('broadcast', handleBroadcast)

    return () => {
      socket.off('broadcast', handleBroadcast)
      release()
    }
  }, [addBroadcast, enabled])
}
