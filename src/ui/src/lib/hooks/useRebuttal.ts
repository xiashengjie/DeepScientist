'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createRebuttalWorkspace,
  deleteRebuttalWorkspace,
  getRebuttalResult,
  getRebuttalWorkspace,
  listRebuttalRunEvents,
  listRebuttalWorkspaces,
  restartRebuttalRun,
} from '@/lib/api/rebuttal'

export const rebuttalKeys = {
  all: ['rebuttal'] as const,
  workspaces: () => [...rebuttalKeys.all, 'workspaces'] as const,
  workspace: (workspaceId: string) => [...rebuttalKeys.all, 'workspace', workspaceId] as const,
  result: (workspaceId: string, runId?: string) =>
    [...rebuttalKeys.all, 'result', workspaceId, runId || 'latest'] as const,
  events: (workspaceId: string, runId: string, afterSeq: number) =>
    [...rebuttalKeys.all, 'events', workspaceId, runId, afterSeq] as const,
}

export function useRebuttalWorkspaces(params?: { skip?: number; limit?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: [...rebuttalKeys.workspaces(), params?.skip || 0, params?.limit || 20],
    queryFn: () =>
      listRebuttalWorkspaces({
        skip: params?.skip,
        limit: params?.limit,
      }),
    enabled: params?.enabled ?? true,
  })
}

export function useRebuttalWorkspace(workspaceId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: rebuttalKeys.workspace(workspaceId || 'unknown'),
    queryFn: () => {
      if (!workspaceId) {
        throw new Error('workspaceId is required')
      }
      return getRebuttalWorkspace(workspaceId)
    },
    enabled: options?.enabled ?? Boolean(workspaceId),
  })
}

export function useRebuttalResult(workspaceId?: string, runId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: rebuttalKeys.result(workspaceId || 'unknown', runId),
    queryFn: () => {
      if (!workspaceId) {
        throw new Error('workspaceId is required')
      }
      return getRebuttalResult({ workspace_id: workspaceId, run_id: runId })
    },
    enabled: options?.enabled ?? Boolean(workspaceId),
  })
}

export function useRebuttalRunEvents(
  workspaceId?: string,
  runId?: string,
  params?: { afterSeq?: number; limit?: number; enabled?: boolean }
) {
  return useQuery({
    queryKey: rebuttalKeys.events(workspaceId || 'unknown', runId || 'unknown', params?.afterSeq || 0),
    queryFn: () => {
      if (!workspaceId || !runId) {
        throw new Error('workspaceId and runId are required')
      }
      return listRebuttalRunEvents({
        workspace_id: workspaceId,
        run_id: runId,
        after_seq: params?.afterSeq,
        limit: params?.limit,
      })
    },
    enabled: params?.enabled ?? Boolean(workspaceId && runId),
  })
}

export function useCreateRebuttalWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createRebuttalWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rebuttalKeys.workspaces() })
    },
  })
}

export function useRestartRebuttalRun() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: restartRebuttalRun,
    onSuccess: (payload) => {
      queryClient.invalidateQueries({ queryKey: rebuttalKeys.workspace(payload.workspace_id) })
      queryClient.invalidateQueries({ queryKey: rebuttalKeys.result(payload.workspace_id, payload.run_id) })
    },
  })
}

export function useDeleteRebuttalWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteRebuttalWorkspace,
    onSuccess: (_, workspaceId) => {
      queryClient.invalidateQueries({ queryKey: rebuttalKeys.workspaces() })
      queryClient.removeQueries({ queryKey: rebuttalKeys.workspace(workspaceId) })
    },
  })
}

