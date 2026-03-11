export type ShareAccess = "view";

export interface ShareSessionMeta {
  projectId: string;
  projectName?: string;
  access: ShareAccess;
  expiresAt?: string;
}

const SHARE_TOKEN_KEY = "ds_share_session_token";
const SHARE_META_KEY = "ds_share_session_meta";
const ACTIVE_PROJECT_KEY = "ds_active_share_project_id";

export function getShareSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(SHARE_TOKEN_KEY);
}

export function getShareSessionMeta(): ShareSessionMeta | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(SHARE_META_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ShareSessionMeta;
  } catch {
    return null;
  }
}

export function setShareSession(token: string, meta: ShareSessionMeta): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SHARE_TOKEN_KEY, token);
  window.sessionStorage.setItem(SHARE_META_KEY, JSON.stringify(meta));
}

export function clearShareSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SHARE_TOKEN_KEY);
  window.sessionStorage.removeItem(SHARE_META_KEY);
  window.sessionStorage.removeItem(ACTIVE_PROJECT_KEY);
}

export function getActiveShareProjectId(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(ACTIVE_PROJECT_KEY);
}

export function setActiveShareProject(projectId: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
}

export function clearActiveShareProject(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ACTIVE_PROJECT_KEY);
}

export function isShareViewForProject(projectId: string): boolean {
  const meta = getShareSessionMeta();
  const token = getShareSessionToken();
  const activeProjectId = getActiveShareProjectId();
  return Boolean(token && meta?.projectId === projectId && activeProjectId === projectId && meta.access === "view");
}
