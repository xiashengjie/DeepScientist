/**
 * Notebooks API Client
 *
 * REST API client for notebook metadata operations.
 *
 * Note: Notebook content sync is handled via Socket.IO (/ws/socket.io).
 */

import { apiClient } from "./client";

const NOTEBOOKS_BASE = "/api/v1/notebooks";

export type NotebookCommitAuthorType = "human" | "llm" | "system";
export type NotebookCollaboratorRole = "viewer" | "editor" | "owner";
export type NotebookExportFormat = "markdown" | "html" | "pdf";

export interface NotebookExportResponse {
  format: NotebookExportFormat;
  content?: string | null;
  downloadUrl?: string | null;
  filename: string;
}

export interface NotebookListItem {
  id: string;
  projectId: string;
  parentId: string | null;
  title: string;
  icon?: string | null;
  coverUrl?: string | null;
  collaborationEnabled: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedNotebooksResponse {
  items: NotebookListItem[];
  total: number;
  skip: number;
  limit: number;
  hasMore: boolean;
}

export interface CreateNotebookRequest {
  title?: string;
  parentId?: string | null;
  icon?: string | null;
  coverUrl?: string | null;
  collaborationEnabled?: boolean;
}

export interface NotebookCollaborator {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string | null;
  role: NotebookCollaboratorRole;
  invitedAt: string;
  acceptedAt?: string | null;
}

export interface NotebookCommitItem {
  id: string;
  notebookId: string;
  projectId: string;
  seq: number;
  createdAt: string;

  authorUserId?: string | null;
  authorType: NotebookCommitAuthorType;
  authorLabel?: string | null;
  authorName?: string | null;
  authorAvatar?: string | null;

  message?: string | null;
  opStats?: any;
  patchOps?: any;
  beforeHash?: string | null;
  afterHash?: string | null;
  historyTimestamp?: number | null;
  meta?: any;
}

export interface PaginatedNotebookCommitsResponse {
  items: NotebookCommitItem[];
  total: number;
  skip: number;
  limit: number;
  hasMore: boolean;
}

function normalizeNotebook(raw: any): NotebookListItem {
  // FastAPI may output alias fields; accept both.
  const title = typeof raw?.title === "string" ? raw.title : raw?.name;
  return {
    id: String(raw?.id),
    projectId: String(raw?.project_id ?? raw?.projectId),
    parentId: raw?.parent_id ?? raw?.parentId ?? null,
    title: title || "Untitled",
    icon: raw?.icon ?? null,
    coverUrl: raw?.cover_url ?? raw?.coverUrl ?? null,
    collaborationEnabled: Boolean(
      raw?.collaboration_enabled ?? raw?.collaborationEnabled
    ),
    createdBy: raw?.created_by ?? raw?.createdBy ?? null,
    createdAt: String(raw?.created_at ?? raw?.createdAt ?? ""),
    updatedAt: String(raw?.updated_at ?? raw?.updatedAt ?? ""),
  };
}

function normalizeCollaborator(raw: any): NotebookCollaborator {
  return {
    id: String(raw?.id),
    userId: String(raw?.user_id ?? raw?.userId),
    userName: String(raw?.user_name ?? raw?.userName ?? ""),
    userEmail: String(raw?.user_email ?? raw?.userEmail ?? ""),
    userAvatar: raw?.user_avatar ?? raw?.userAvatar ?? null,
    role: String(raw?.role ?? "viewer") as NotebookCollaboratorRole,
    invitedAt: String(raw?.invited_at ?? raw?.invitedAt ?? ""),
    acceptedAt: raw?.accepted_at ?? raw?.acceptedAt ?? null,
  };
}

function normalizeCommit(raw: any): NotebookCommitItem {
  return {
    id: String(raw?.id),
    notebookId: String(
      raw?.notebook_id ?? raw?.notebookId ?? raw?.file_id ?? raw?.fileId ?? ""
    ),
    projectId: String(raw?.project_id ?? raw?.projectId ?? ""),
    seq: Number(raw?.seq ?? 0),
    createdAt: String(raw?.created_at ?? raw?.createdAt ?? ""),

    authorUserId: raw?.author_user_id ?? raw?.authorUserId ?? null,
    authorType: String(
      raw?.author_type ?? raw?.authorType ?? "human"
    ) as NotebookCommitAuthorType,
    authorLabel: raw?.author_label ?? raw?.authorLabel ?? null,
    authorName: raw?.author_name ?? raw?.authorName ?? null,
    authorAvatar: raw?.author_avatar ?? raw?.authorAvatar ?? null,

    message: raw?.message ?? null,
    opStats: raw?.op_stats ?? raw?.opStats ?? null,
    patchOps: raw?.patch_ops ?? raw?.patchOps ?? null,
    beforeHash: raw?.before_hash ?? raw?.beforeHash ?? null,
    afterHash: raw?.after_hash ?? raw?.afterHash ?? null,
    historyTimestamp: raw?.history_timestamp ?? raw?.historyTimestamp ?? null,
    meta: raw?.meta ?? null,
  };
}

export async function listNotebooks(
  projectId: string,
  options: {
    skip?: number;
    limit?: number;
    search?: string;
    parentId?: string | null;
  } = {}
): Promise<PaginatedNotebooksResponse> {
  const params = new URLSearchParams();
  params.set("skip", String(options.skip ?? 0));
  params.set("limit", String(options.limit ?? 20));
  if (options.search) params.set("search", options.search);
  if (options.parentId !== undefined) {
    if (options.parentId === null) {
      // backend treats missing as "no filter"; keep null explicit if needed
    } else {
      params.set("parent_id", options.parentId);
    }
  }

  const response = await apiClient.get(
    `${NOTEBOOKS_BASE}/projects/${projectId}/notebooks?${params.toString()}`
  );

  const raw = response.data;
  const items = Array.isArray(raw?.items) ? raw.items.map(normalizeNotebook) : [];

  return {
    items,
    total: Number(raw?.total ?? items.length),
    skip: Number(raw?.skip ?? 0),
    limit: Number(raw?.limit ?? options.limit ?? 20),
    hasMore: Boolean(raw?.has_more ?? raw?.hasMore ?? false),
  };
}

export async function createNotebook(
  projectId: string,
  data: CreateNotebookRequest
): Promise<NotebookListItem> {
  const response = await apiClient.post(
    `${NOTEBOOKS_BASE}/projects/${projectId}/notebooks`,
    {
      title: data.title ?? "Untitled",
      parent_id: data.parentId ?? null,
      icon: data.icon ?? null,
      cover_url: data.coverUrl ?? null,
      collaboration_enabled: Boolean(data.collaborationEnabled ?? true),
    }
  );

  return normalizeNotebook(response.data);
}

export async function getNotebook(notebookId: string): Promise<NotebookListItem> {
  const response = await apiClient.get(`${NOTEBOOKS_BASE}/${notebookId}`);
  return normalizeNotebook(response.data);
}

export async function listNotebookCollaborators(
  notebookId: string
): Promise<NotebookCollaborator[]> {
  const response = await apiClient.get(
    `${NOTEBOOKS_BASE}/${notebookId}/collaborators`
  );
  const raw = response.data;
  const items = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
  return items.map(normalizeCollaborator);
}

export async function inviteNotebookCollaborator(
  notebookId: string,
  data: { userId: string; role: NotebookCollaboratorRole }
): Promise<NotebookCollaborator> {
  const response = await apiClient.post(
    `${NOTEBOOKS_BASE}/${notebookId}/collaborators`,
    {
      user_id: data.userId,
      role: data.role,
    }
  );
  return normalizeCollaborator(response.data);
}

export async function removeNotebookCollaborator(
  notebookId: string,
  userId: string
): Promise<void> {
  await apiClient.delete(`${NOTEBOOKS_BASE}/${notebookId}/collaborators/${userId}`);
}

export async function listNotebookCommits(
  notebookId: string,
  options: { skip?: number; limit?: number } = {}
): Promise<PaginatedNotebookCommitsResponse> {
  const params = new URLSearchParams();
  params.set("skip", String(options.skip ?? 0));
  params.set("limit", String(options.limit ?? 20));

  const response = await apiClient.get(
    `${NOTEBOOKS_BASE}/${notebookId}/commits?${params.toString()}`
  );
  const raw = response.data;
  const items = Array.isArray(raw?.items) ? raw.items.map(normalizeCommit) : [];
  return {
    items,
    total: Number(raw?.total ?? items.length),
    skip: Number(raw?.skip ?? 0),
    limit: Number(raw?.limit ?? options.limit ?? 20),
    hasMore: Boolean(raw?.has_more ?? raw?.hasMore ?? false),
  };
}

export async function createNotebookCommit(
  notebookId: string,
  data: {
    message?: string | null;
    authorType?: NotebookCommitAuthorType;
    authorLabel?: string | null;
    opStats?: any;
    patchOps?: any;
    meta?: any;
  }
): Promise<NotebookCommitItem> {
  const response = await apiClient.post(`${NOTEBOOKS_BASE}/${notebookId}/commits`, {
    message: data.message ?? null,
    author_type: data.authorType ?? "human",
    author_label: data.authorLabel ?? null,
    op_stats: data.opStats ?? null,
    patch_ops: data.patchOps ?? null,
    meta: data.meta ?? null,
  });
  return normalizeCommit(response.data);
}

export async function revertNotebookToCommit(
  notebookId: string,
  seq: number
): Promise<NotebookCommitItem> {
  const response = await apiClient.post(
    `${NOTEBOOKS_BASE}/${notebookId}/commits/${seq}/revert`
  );
  return normalizeCommit(response.data);
}

export async function exportNotebook(
  notebookId: string,
  format: NotebookExportFormat
): Promise<NotebookExportResponse> {
  const safeId = encodeURIComponent(notebookId);
  const response = await apiClient.get(`${NOTEBOOKS_BASE}/${safeId}/export`, {
    params: { format },
  });
  const raw = response.data ?? {};
  return {
    format: (raw.format ?? format) as NotebookExportFormat,
    content: raw.content ?? null,
    downloadUrl: raw.download_url ?? raw.downloadUrl ?? null,
    filename: raw.filename ?? `notebook.${format}`,
  };
}
