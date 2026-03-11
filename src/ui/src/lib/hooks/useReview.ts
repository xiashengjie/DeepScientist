'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createReviewWorkspace,
  deleteReviewWorkspace,
  getReviewResult,
  getReviewWorkspace,
  listReviewRunEvents,
  listReviewWorkspaces,
  restartReviewRun,
} from '@/lib/api/review'

export const reviewKeys = {
  all: ['review'] as const,
  workspaces: () => [...reviewKeys.all, 'workspaces'] as const,
  workspace: (workspaceId: string) => [...reviewKeys.all, 'workspace', workspaceId] as const,
  result: (workspaceId: string, runId?: string) =>
    [...reviewKeys.all, 'result', workspaceId, runId || 'latest'] as const,
  events: (workspaceId: string, runId: string, afterSeq: number) =>
    [...reviewKeys.all, 'events', workspaceId, runId, afterSeq] as const,
}

export function useReviewWorkspaces(params?: { skip?: number; limit?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: [...reviewKeys.workspaces(), params?.skip || 0, params?.limit || 20],
    queryFn: () =>
      listReviewWorkspaces({
        skip: params?.skip,
        limit: params?.limit,
      }),
    enabled: params?.enabled ?? true,
  })
}

export function useReviewWorkspace(workspaceId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: reviewKeys.workspace(workspaceId || 'unknown'),
    queryFn: () => {
      if (!workspaceId) {
        throw new Error('workspaceId is required')
      }
      return getReviewWorkspace(workspaceId)
    },
    enabled: options?.enabled ?? Boolean(workspaceId),
  })
}

export function useReviewResult(workspaceId?: string, runId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: reviewKeys.result(workspaceId || 'unknown', runId),
    queryFn: () => {
      if (!workspaceId) {
        throw new Error('workspaceId is required')
      }
      return getReviewResult({ workspace_id: workspaceId, run_id: runId })
    },
    enabled: options?.enabled ?? Boolean(workspaceId),
  })
}

export function useReviewRunEvents(
  workspaceId?: string,
  runId?: string,
  params?: { afterSeq?: number; limit?: number; enabled?: boolean }
) {
  return useQuery({
    queryKey: reviewKeys.events(workspaceId || 'unknown', runId || 'unknown', params?.afterSeq || 0),
    queryFn: () => {
      if (!workspaceId || !runId) {
        throw new Error('workspaceId and runId are required')
      }
      return listReviewRunEvents({
        workspace_id: workspaceId,
        run_id: runId,
        after_seq: params?.afterSeq,
        limit: params?.limit,
      })
    },
    enabled: params?.enabled ?? Boolean(workspaceId && runId),
  })
}

export function useCreateReviewWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createReviewWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.workspaces() })
    },
  })
}

export function useRestartReviewRun() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: restartReviewRun,
    onSuccess: (payload) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.workspace(payload.workspace_id) })
      queryClient.invalidateQueries({ queryKey: reviewKeys.result(payload.workspace_id, payload.run_id) })
    },
  })
}

export function useDeleteReviewWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteReviewWorkspace,
    onSuccess: (_, workspaceId) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.workspaces() })
      queryClient.removeQueries({ queryKey: reviewKeys.workspace(workspaceId) })
    },
  })
}

