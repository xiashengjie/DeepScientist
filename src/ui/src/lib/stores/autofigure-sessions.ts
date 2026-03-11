/**
 * AutoFigure Sessions Store
 *
 * Manages AutoFigure session list + active session.
 *
 * @module lib/stores/autofigure-sessions
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { apiClient } from "@/lib/api/client"

export type AutoFigureSessionStatus =
  | "created"
  | "idle"
  | "generating"
  | "iteration_complete"
  | "waiting_feedback"
  | "improving"
  | "finalized"
  | "enhancing"
  | "completed"
  | "max_iterations_reached"
  | "error"
  | "failed"

export interface AutoFigureSessionSummary {
  sessionId: string
  status: AutoFigureSessionStatus
  projectId: string | null
  inputType: string
  sessionName?: string | null
  sourceFileName?: string | null
  contentType?: string
  createdAt?: string | null
  updatedAt?: string | null
}

interface AutoFigureSessionsState {
  sessions: AutoFigureSessionSummary[]
  activeSessionId: string | null
  ownerUserId: string | null
  isLoading: boolean
  error: string | null
  fetchSessions: (projectId?: string) => Promise<void>
  setActiveSessionId: (sessionId: string | null) => void
  setOwnerUserId: (userId: string | null) => void
  upsertSession: (session: AutoFigureSessionSummary) => void
  removeSession: (sessionId: string) => void
  resetSessions: () => void
  clearError: () => void
}

export const useAutoFigureSessionsStore = create<AutoFigureSessionsState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      ownerUserId: null,
      isLoading: false,
      error: null,

      fetchSessions: async (projectId?: string) => {
        set({ isLoading: true, error: null })
        try {
          const params = projectId ? { project_id: projectId } : undefined
          const response = await apiClient.get<{
            session_id: string
            status: AutoFigureSessionStatus
            project_id: string | null
            input_type: string
            content_type?: string
            session_name?: string | null
            source_file_name?: string | null
            created_at?: string | null
            updated_at?: string | null
          }[]>("/api/v1/autofigure/sessions", { params })

          const sessions = response.data.map((item) => ({
            sessionId: item.session_id,
            status: item.status,
            projectId: item.project_id,
            inputType: item.input_type,
            contentType: item.content_type,
            sessionName: item.session_name ?? null,
            sourceFileName: item.source_file_name ?? null,
            createdAt: item.created_at ?? null,
            updatedAt: item.updated_at ?? null,
          }))

          set({ sessions, isLoading: false })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error?.message || "Failed to load sessions",
          })
        }
      },

      setActiveSessionId: (sessionId) => {
        set({ activeSessionId: sessionId })
      },

      setOwnerUserId: (userId) => {
        set({ ownerUserId: userId })
      },

      upsertSession: (session) => {
        const { sessions } = get()
        const existing = sessions.find((item) => item.sessionId === session.sessionId)
        if (existing) {
          set({
            sessions: sessions.map((item) =>
              item.sessionId === session.sessionId ? { ...item, ...session } : item
            ),
          })
          return
        }
        set({ sessions: [session, ...sessions] })
      },

      removeSession: (sessionId) => {
        const { sessions, activeSessionId } = get()
        set({
          sessions: sessions.filter((item) => item.sessionId !== sessionId),
          activeSessionId: activeSessionId === sessionId ? null : activeSessionId,
        })
      },

      resetSessions: () =>
        set({
          sessions: [],
          activeSessionId: null,
          isLoading: false,
          error: null,
        }),

      clearError: () => set({ error: null }),
    }),
    {
      name: "ds-autofigure-sessions",
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as {
          sessions?: AutoFigureSessionSummary[]
          activeSessionId?: string | null
          ownerUserId?: string | null
        }
        if (!state || typeof state !== "object") {
          return { sessions: [], activeSessionId: null, ownerUserId: null }
        }
        if (!("ownerUserId" in state)) {
          return { sessions: [], activeSessionId: null, ownerUserId: null }
        }
        return state
      },
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        ownerUserId: state.ownerUserId,
      }),
    }
  )
)
