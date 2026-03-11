import { create } from 'zustand'
import type { BroadcastMessage } from '@/lib/types/broadcast'

type BroadcastState = {
  items: BroadcastMessage[]
  isLoading: boolean
  error: string | null
  setBroadcasts: (items: BroadcastMessage[]) => void
  addBroadcast: (item: BroadcastMessage) => void
  markRead: (ids: string[], readAt?: string) => void
  markAllRead: () => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clear: () => void
}

const MAX_BROADCASTS = 20

function sortByCreatedAt(items: BroadcastMessage[]) {
  return [...items].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export const useBroadcastsStore = create<BroadcastState>((set) => ({
  items: [],
  isLoading: false,
  error: null,
  setBroadcasts: (items) =>
    set((state) => {
      const readLookup = new Map(state.items.map((item) => [item.id, item.read_at]))
      const next = sortByCreatedAt(items).map((item) => ({
        ...item,
        read_at: item.read_at ?? readLookup.get(item.id) ?? null,
      }))
      return {
        items: next.slice(0, MAX_BROADCASTS),
        isLoading: false,
        error: null,
      }
    }),
  addBroadcast: (item) =>
    set((state) => {
      const existingIndex = state.items.findIndex((existing) => existing.id === item.id)
      if (existingIndex >= 0) {
        const existing = state.items[existingIndex]
        const merged = { ...existing, ...item, read_at: existing.read_at ?? item.read_at ?? null }
        const next = [...state.items]
        next[existingIndex] = merged
        return { items: sortByCreatedAt(next).slice(0, MAX_BROADCASTS) }
      }
      return {
        items: [item, ...state.items].slice(0, MAX_BROADCASTS),
      }
    }),
  markRead: (ids, readAt) =>
    set((state) => {
      if (ids.length === 0) return state
      const now = readAt || new Date().toISOString()
      return {
        ...state,
        items: state.items.map((item) =>
          ids.includes(item.id) ? { ...item, read_at: item.read_at ?? now } : item
        ),
      }
    }),
  markAllRead: () =>
    set((state) => {
      if (state.items.length === 0) return state
      const now = new Date().toISOString()
      return {
        ...state,
        items: state.items.map((item) => ({ ...item, read_at: item.read_at ?? now })),
      }
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clear: () => set({ items: [], error: null }),
}))
