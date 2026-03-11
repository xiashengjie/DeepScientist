import { apiClient } from "./client";

export type SharePermission = "view" | "edit";

export interface ShareLink {
  id: string;
  project_id: string;
  token: string;
  permission: SharePermission;
  allow_copy: boolean;
  is_active: boolean;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  access_count: number;
  last_accessed_at: string | null;
}

export interface ShareValidationResponse {
  valid: boolean;
  error?: string | null;
  access?: SharePermission | null;
  requires_login?: boolean;
  auto_joined?: boolean;
  allow_copy?: boolean | null;
  project?: {
    id: string;
    name: string;
    description?: string | null;
    owner_username?: string | null;
    updated_at?: string | null;
  } | null;
  share_session_token?: string | null;
  share_session_expires_at?: string | null;
  redirect_url?: string | null;
  login_url?: string | null;
}

export interface ShareEntry {
  id: string;
  share_link_id: string;
  project_id: string;
  token: string;
  permission: SharePermission;
  allow_copy: boolean;
  created_at: string;
  last_accessed_at: string;
  project: {
    id: string;
    name: string;
    description?: string | null;
    owner_username?: string | null;
    updated_at?: string | null;
  };
}

export interface ShareEntryListResponse {
  items: ShareEntry[];
}

export async function validateShareToken(token: string): Promise<ShareValidationResponse> {
  const response = await apiClient.get<ShareValidationResponse>(`/api/v1/share/${token}`);
  return response.data;
}

export async function listShareEntries(): Promise<ShareEntry[]> {
  const response = await apiClient.get<ShareEntryListResponse>(`/api/v1/share/entries`);
  return response.data.items || [];
}

export async function deleteShareEntry(entryId: string): Promise<void> {
  await apiClient.delete(`/api/v1/share/entries/${entryId}`);
}

export async function createProjectShareLink(
  projectId: string,
  data: { permission: SharePermission; expires_at: string | null; allow_copy?: boolean }
): Promise<ShareLink> {
  const response = await apiClient.post<ShareLink>(`/api/v1/projects/${projectId}/share-links`, data);
  return response.data;
}

export async function listProjectShareLinks(projectId: string): Promise<ShareLink[]> {
  const response = await apiClient.get<{ items: ShareLink[] }>(`/api/v1/projects/${projectId}/share-links`);
  return response.data.items || [];
}

export async function updateProjectShareLink(
  projectId: string,
  linkId: string,
  data: { permission?: SharePermission; is_active?: boolean; expires_at?: string | null; allow_copy?: boolean }
): Promise<ShareLink> {
  const response = await apiClient.patch<ShareLink>(`/api/v1/projects/${projectId}/share-links/${linkId}`, data);
  return response.data;
}

export async function deleteProjectShareLink(projectId: string, linkId: string): Promise<void> {
  await apiClient.delete(`/api/v1/projects/${projectId}/share-links/${linkId}`);
}

export async function regenerateProjectShareLink(projectId: string, linkId: string): Promise<ShareLink> {
  const response = await apiClient.post<ShareLink>(
    `/api/v1/projects/${projectId}/share-links/${linkId}/regenerate`
  );
  return response.data;
}
