'use client'

export const SHARED_PROJECTS_KEY = 'deepscientist:shared_projects'
export const MAX_SHARED_PROJECTS = 50

export type SharedProjectPermission = 'view' | 'edit'

export interface SharedProjectEntry {
  entryId?: string
  projectId: string
  shareToken: string
  permission: SharedProjectPermission
  projectName: string
  projectDescription?: string | null
  ownerUsername?: string | null
  allowCopy?: boolean | null
  lastUpdatedAt?: string | null
  lastOpenedAt: number
}

export function getSharedProjects(): SharedProjectEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SHARED_PROJECTS_KEY)
    const data = raw ? (JSON.parse(raw) as unknown) : []
    if (!Array.isArray(data)) return []

    return data
      .map((item) => item as Partial<SharedProjectEntry>)
      .filter(
        (item): item is SharedProjectEntry =>
          typeof item.projectId === 'string' &&
          typeof item.shareToken === 'string' &&
          (item.permission === 'view' || item.permission === 'edit') &&
          typeof item.projectName === 'string' &&
          typeof item.lastOpenedAt === 'number'
      )
  } catch {
    return []
  }
}

export function setSharedProjects(entries: SharedProjectEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SHARED_PROJECTS_KEY, JSON.stringify(entries.slice(0, MAX_SHARED_PROJECTS)))
  } catch {
    // ignore storage errors
  }
}

export function upsertSharedProject(
  entry: Omit<SharedProjectEntry, 'lastOpenedAt'> & { lastOpenedAt?: number }
): void {
  if (typeof window === 'undefined') return
  const previous = getSharedProjects().filter((p) => p.projectId !== entry.projectId)
  const next: SharedProjectEntry[] = [
    {
      ...entry,
      lastOpenedAt: entry.lastOpenedAt ?? Date.now(),
    },
    ...previous,
  ]
  setSharedProjects(next)
}

export function touchSharedProject(projectId: string): void {
  if (typeof window === 'undefined') return
  const previous = getSharedProjects()
  const existing = previous.find((p) => p.projectId === projectId)
  if (!existing) return
  upsertSharedProject({ ...existing, lastOpenedAt: Date.now() })
}

export function removeSharedProject(projectId: string): void {
  setSharedProjects(getSharedProjects().filter((p) => p.projectId !== projectId))
}

export function clearSharedProjects(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(SHARED_PROJECTS_KEY)
  } catch {
    // ignore storage errors
  }
}
