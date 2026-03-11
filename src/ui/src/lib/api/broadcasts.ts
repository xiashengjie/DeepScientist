import { apiClient } from './client'
import type { BroadcastListResponse } from '@/lib/types/broadcast'

function isLocalBroadcastsFallbackError(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const status = (error as { response?: { status?: number } }).response?.status
  return status === 404 || status === 405 || status === 501
}

export async function listBroadcasts(): Promise<BroadcastListResponse> {
  try {
    const response = await apiClient.get<BroadcastListResponse>('/api/broadcasts')
    return response.data
  } catch (error) {
    if (!isLocalBroadcastsFallbackError(error)) {
      throw error
    }
    return { broadcasts: [] }
  }
}

export async function markBroadcastRead(broadcastId: string): Promise<{ success: boolean; read_at: string }> {
  try {
    const response = await apiClient.post<{ success: boolean; read_at: string }>(
      `/api/broadcasts/${broadcastId}/read`
    )
    return response.data
  } catch (error) {
    if (!isLocalBroadcastsFallbackError(error)) {
      throw error
    }
    return { success: true, read_at: new Date().toISOString() }
  }
}
