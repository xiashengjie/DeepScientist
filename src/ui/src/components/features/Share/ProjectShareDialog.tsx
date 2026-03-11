'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Copy, Eye, Link2, Pencil, Settings } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { copyToClipboard } from '@/lib/clipboard'
import { useAuthStore } from '@/lib/stores/auth'
import {
  createProjectShareLink,
  listProjectShareLinks,
  updateProjectShareLink,
  type ShareLink,
  type SharePermission,
} from '@/lib/api/share'
import { AnimatedCheckbox } from '@/components/ui/animated-checkbox'
import { getProject, listProjectMembers, updateProject, type ProjectMember } from '@/lib/api/projects'

interface ProjectShareDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: 'share' | 'copy'
  canManageShare?: boolean
}

function formatIso(iso?: string | null): string {
  if (!iso) return 'Never'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function formatExpiry(link: ShareLink | null): string {
  if (!link) return '—'
  if (!link.expires_at) return 'Never'
  return formatIso(link.expires_at)
}

function pickLink(links: ShareLink[], permission: SharePermission): ShareLink | null {
  return (
    links.find((link) => link.permission === permission && link.is_active) ||
    links.find((link) => link.permission === permission) ||
    null
  )
}

function getShareUrl(base: string, link: ShareLink | null): string {
  if (!base || !link) return ''
  return `${base}${link.token}`
}

export function ProjectShareDialog({
  projectId,
  open,
  onOpenChange,
  canManageShare = true,
}: ProjectShareDialogProps) {
  const { addToast } = useToast()
  const { user } = useAuthStore()

  const [shareBaseUrl, setShareBaseUrl] = useState('')
  const [links, setLinks] = useState<ShareLink[]>([])
  const [linksLoading, setLinksLoading] = useState(false)
  const [linksError, setLinksError] = useState('')
  const [linkUpdatingId, setLinkUpdatingId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const [members, setMembers] = useState<ProjectMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState('')
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsError, setSettingsError] = useState('')
  const [projectSettings, setProjectSettings] = useState<Record<string, unknown>>({})
  const [viewLoginRequired, setViewLoginRequired] = useState(false)

  useEffect(() => {
    if (!open) return
    if (typeof window === 'undefined') return
    setShareBaseUrl(`${window.location.origin}/share/`)
  }, [open])

  const syncLinks = useCallback(async () => {
    if (!open) return
    setLinksError('')
    setLinksLoading(true)
    try {
      if (!canManageShare) {
        setLinks([])
        return
      }

      let items = await listProjectShareLinks(projectId)

      const ensureLink = async (permission: SharePermission) => {
        const existing = pickLink(items, permission)
        if (!existing) {
          const created = await createProjectShareLink(projectId, {
            permission,
            expires_at: null,
            allow_copy: true,
          })
          items = [created, ...items]
          return
        }

        const updates: { is_active?: boolean; expires_at?: string | null; allow_copy?: boolean } = {}
        if (!existing.is_active) updates.is_active = true
        if (existing.expires_at) updates.expires_at = null

        if (Object.keys(updates).length > 0) {
          const updated = await updateProjectShareLink(projectId, existing.id, updates)
          items = items.map((item) => (item.id === updated.id ? updated : item))
        }
      }

      await ensureLink('edit')
      await ensureLink('view')

      setLinks(items)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } }; message?: string }
      setLinksError(error.response?.data?.detail || error.message || 'Failed to load share links')
      setLinks([])
    } finally {
      setLinksLoading(false)
    }
  }, [canManageShare, open, projectId])

  useEffect(() => {
    if (!open) return
    setShowSettings(false)
    void syncLinks()
  }, [open, syncLinks])

  useEffect(() => {
    if (!open || !showSettings) return
    if (!canManageShare) return
    let cancelled = false
    setMembersLoading(true)
    setMembersError('')
    listProjectMembers(projectId)
      .then((data) => {
        if (cancelled) return
        setMembers(data)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const error = err as { response?: { data?: { detail?: string } }; message?: string }
        setMembersError(error.response?.data?.detail || error.message || 'Failed to load members')
        setMembers([])
      })
      .finally(() => {
        if (!cancelled) setMembersLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [canManageShare, open, projectId, showSettings])

  useEffect(() => {
    if (!open || !canManageShare) return
    let cancelled = false
    setSettingsLoading(true)
    setSettingsError('')
    getProject(projectId)
      .then((project) => {
        if (cancelled) return
        const settings = (project.settings || {}) as Record<string, unknown>
        setProjectSettings(settings)
        setViewLoginRequired(Boolean(settings.share_view_requires_login))
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const error = err as { response?: { data?: { detail?: string } }; message?: string }
        setSettingsError(error.response?.data?.detail || error.message || 'Failed to load share settings')
      })
      .finally(() => {
        if (!cancelled) setSettingsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [canManageShare, open, projectId])

  const editLink = useMemo(() => pickLink(links, 'edit'), [links])
  const viewLink = useMemo(() => pickLink(links, 'view'), [links])

  const editUrl = useMemo(() => getShareUrl(shareBaseUrl, editLink), [shareBaseUrl, editLink])
  const viewUrl = useMemo(() => getShareUrl(shareBaseUrl, viewLink), [shareBaseUrl, viewLink])

  const editDescription = useMemo(() => {
    if (!editLink) return 'Anyone with this link can edit. Copying follows owner settings.'
    return editLink.allow_copy
      ? 'Anyone with this link can edit and copy.'
      : 'Anyone with this link can edit. Copying is disabled.'
  }, [editLink])

  const viewDescription = useMemo(() => {
    const base = viewLoginRequired ? 'Login required to view.' : 'Anyone with this link can view.'
    if (!viewLink) return `${base} Copying follows owner settings.`
    return viewLink.allow_copy ? `${base} Copying is allowed.` : `${base} Copying is disabled.`
  }, [viewLink, viewLoginRequired])

  const handleCopy = useCallback(
    async (url: string) => {
      if (!url) return
      const ok = await copyToClipboard(url)
      if (ok) {
        addToast({ type: 'success', title: 'Copied', description: 'Link copied to clipboard.' })
      } else {
        addToast({ type: 'error', title: 'Copy failed', description: 'Please copy manually.' })
      }
    },
    [addToast]
  )

  const settingsLinks = useMemo(() => {
    return [
      { label: 'Editable link', icon: Pencil, link: editLink },
      { label: 'View link', icon: Eye, link: viewLink },
    ]
  }, [editLink, viewLink])

  const handleToggleAllowCopy = useCallback(
    async (link: ShareLink | null, allowCopy: boolean) => {
      if (!link) return
      setLinkUpdatingId(link.id)
      try {
        const updated = await updateProjectShareLink(projectId, link.id, {
          allow_copy: allowCopy,
        })
        setLinks((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } }; message?: string }
        addToast({
          type: 'error',
          title: 'Update failed',
          description: error.response?.data?.detail || error.message || 'Unable to update allow copy.',
        })
      } finally {
        setLinkUpdatingId(null)
      }
    },
    [addToast, projectId]
  )

  const handleToggleViewLogin = useCallback(
    async (nextValue: boolean) => {
      if (settingsSaving) return
      const previous = viewLoginRequired
      const previousSettings = projectSettings
      const nextSettings = { ...projectSettings, share_view_requires_login: nextValue }
      setViewLoginRequired(nextValue)
      setProjectSettings(nextSettings)
      setSettingsSaving(true)
      try {
        await updateProject(projectId, { settings: nextSettings })
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } }; message?: string }
        setViewLoginRequired(previous)
        setProjectSettings(previousSettings)
        addToast({
          type: 'error',
          title: 'Update failed',
          description: error.response?.data?.detail || error.message || 'Unable to update share settings.',
        })
      } finally {
        setSettingsSaving(false)
      }
    },
    [addToast, projectId, projectSettings, settingsSaving, viewLoginRequired]
  )

  const visibleMembers = useMemo(() => {
    if (!user?.id) return members
    return members.filter((member) => member.user_id !== user.id)
  }, [members, user?.id])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-3xl p-0 overflow-hidden')}>
        <DialogTitle className="sr-only">Project share</DialogTitle>
        <DialogDescription className="sr-only">
          Share with an editable link or a view-only link.
        </DialogDescription>

        <div
          className={cn(
            'grid gap-6 p-6',
            showSettings ? 'lg:grid-cols-[minmax(0,1fr)_320px]' : 'grid-cols-1'
          )}
        >
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Share links</h2>
                <p className="text-sm text-muted-foreground">
                  Two links are always available: editable and view-only.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings((v) => !v)}
                className="rounded-full"
                title={showSettings ? 'Hide settings' : 'Show settings'}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            {linksError ? (
              <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-destructive">
                {linksError}
              </div>
            ) : null}

            {!canManageShare ? (
              <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                Share links are managed by project owners or admins.
              </div>
            ) : null}

            <div className="space-y-4">
              <ShareLinkCard
                title="Editable link"
                description={editDescription}
                icon={<Pencil className="h-4 w-4" />}
                url={editUrl}
                loading={linksLoading}
                onCopy={() => handleCopy(editUrl)}
              />
              <ShareLinkCard
                title="View-only link"
                description={viewDescription}
                icon={<Eye className="h-4 w-4" />}
                url={viewUrl}
                loading={linksLoading}
                onCopy={() => handleCopy(viewUrl)}
              />
            </div>
          </div>

          {showSettings ? (
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-5">
              <div>
                <div className="text-sm font-semibold">Link settings</div>
                <div className="text-xs text-muted-foreground">
                  Copy and login requirements can be adjusted per link.
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border border-border/50 bg-background/80 p-3">
                  <div className="text-xs font-medium">View access</div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Require login to view</span>
                    <AnimatedCheckbox
                      checked={viewLoginRequired}
                      onChange={handleToggleViewLogin}
                      disabled={!canManageShare || settingsLoading || settingsSaving}
                      size="sm"
                    />
                  </div>
                  {settingsError ? (
                    <div className="mt-2 text-[11px] text-destructive">{settingsError}</div>
                  ) : null}
                </div>
                {settingsLinks.map(({ label, icon: Icon, link }) => (
                  <div key={label} className="rounded-xl border border-border/50 bg-background/80 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {label}
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between gap-2">
                        <span>Allow copy</span>
                        <AnimatedCheckbox
                          checked={Boolean(link?.allow_copy)}
                          onChange={(checked) => handleToggleAllowCopy(link, checked)}
                          disabled={!link || linksLoading || linkUpdatingId === link.id || !canManageShare}
                          size="sm"
                        />
                      </div>
                      <div>Expires: {formatExpiry(link)}</div>
                      <div>Status: {link ? (link.is_active ? 'Active' : 'Inactive') : '—'}</div>
                      <div>Views: {link?.access_count ?? 0}</div>
                      <div>Last access: {link?.last_accessed_at ? formatIso(link.last_accessed_at) : '—'}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold">Project members</div>
                {membersLoading ? (
                  <div className="text-xs text-muted-foreground">Loading members…</div>
                ) : membersError ? (
                  <div className="text-xs text-destructive">{membersError}</div>
                ) : visibleMembers.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No additional members found.</div>
                ) : (
                  <div className="space-y-2">
                    {visibleMembers.slice(0, 6).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-background/80 px-3 py-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">
                            {member.user?.username || member.user?.email || member.user_id}
                          </div>
                          <div className="text-muted-foreground truncate">{member.user?.email || '—'}</div>
                        </div>
                        <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                          {member.role}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ShareLinkCard({
  title,
  description,
  icon,
  url,
  loading,
  onCopy,
}: {
  title: string
  description: string
  icon: React.ReactNode
  url: string
  loading: boolean
  onCopy: () => void
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-background/80">
          {icon}
        </span>
        {title}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{description}</div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={loading ? 'Generating link…' : url}
            readOnly
            className="pl-9 text-xs"
            disabled={loading}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-9"
          onClick={onCopy}
          disabled={loading || !url}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy
        </Button>
      </div>
    </div>
  )
}

export default ProjectShareDialog
