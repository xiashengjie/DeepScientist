'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import {
  createCliShare,
  deleteCliShare,
  listCliServers,
  listCliShares,
  refreshCliServerStatus,
  removeCliServerFromProject,
  unbindCliServer,
  updateCliServer,
  updateCliShare,
} from '@/lib/api/cli'
import { FadeContent, SpotlightCard } from '@/components/react-bits'
import type { CliServer, CliServerShareUser } from '../types/cli'
import { useCliStore } from '../stores/cli-store'

function formatTimestamp(value?: string | null) {
  if (!value) return 'n/a'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'n/a'
  return parsed.toLocaleString()
}

export function AdminPanel({
  projectId,
  serverId,
  readOnly,
}: {
  projectId: string
  serverId: string
  readOnly?: boolean
}) {
  const { addToast } = useToast()
  const [server, setServer] = useState<CliServer | null>(null)
  const [serverName, setServerName] = useState('')
  const [serverLoading, setServerLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [serverUpdating, setServerUpdating] = useState(false)
  const [serverRefreshing, setServerRefreshing] = useState(false)
  const [serverUnbinding, setServerUnbinding] = useState(false)
  const [serverRemoving, setServerRemoving] = useState(false)
  const [shares, setShares] = useState<CliServerShareUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<'view' | 'edit' | 'admin'>('view')
  const [expiresAt, setExpiresAt] = useState('')
  const [allowTerminalInput, setAllowTerminalInput] = useState(true)
  const [allowFileEdit, setAllowFileEdit] = useState(true)
  const [updatingShare, setUpdatingShare] = useState<string | null>(null)
  const refreshServers = useCliStore((state) => state.refreshServers)
  const setActiveServer = useCliStore((state) => state.setActiveServer)

  const loadServer = useCallback(async () => {
    setServerLoading(true)
    setServerError(null)
    try {
      const response = await listCliServers(projectId)
      const match = response.find((item) => item.id === serverId) ?? null
      setServer(match)
      setServerName(match?.name ?? '')
      if (!match) setServerError('Server not found')
    } catch (err) {
      console.error('[CLI] Failed to load server:', err)
      setServerError('Failed to load server details')
    } finally {
      setServerLoading(false)
    }
  }, [projectId, serverId])

  const loadShares = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await listCliShares(projectId, serverId)
      setShares(response.users)
    } catch (err) {
      console.error('[CLI] Failed to load shares:', err)
      setError('Failed to load shares')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, serverId])

  useEffect(() => {
    void loadShares()
    void loadServer()
  }, [loadServer, loadShares])

  const handleCreateShare = useCallback(async () => {
    if (readOnly) return
    if (!email.trim()) return
    const payload = {
      email: email.trim(),
      permission,
      edit_granularity:
        permission === 'edit' ? { allowTerminalInput, allowFileEdit } : undefined,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    }
    try {
      await createCliShare(projectId, serverId, payload)
      setEmail('')
      setExpiresAt('')
      await loadShares()
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Share failed',
        description: 'Unable to create share for this user.',
      })
    }
  }, [
    addToast,
    allowFileEdit,
    allowTerminalInput,
    email,
    expiresAt,
    loadShares,
    permission,
    projectId,
    readOnly,
    serverId,
  ])

  const handleUpdateShare = useCallback(
    async (share: CliServerShareUser, updates: Partial<CliServerShareUser>) => {
      if (readOnly) return
      setUpdatingShare(share.id)
      try {
        const nextPermission = updates.permission ?? share.permission
        await updateCliShare(projectId, serverId, share.id, {
          permission: nextPermission,
          edit_granularity:
            nextPermission === 'edit'
              ? {
                  allowTerminalInput:
                    updates.edit_granularity?.allowTerminalInput ??
                    share.edit_granularity?.allowTerminalInput ??
                    true,
                  allowFileEdit:
                    updates.edit_granularity?.allowFileEdit ??
                    share.edit_granularity?.allowFileEdit ??
                    true,
                }
              : undefined,
          expires_at: updates.expires_at ?? undefined,
        })
        await loadShares()
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Update failed',
          description: 'Unable to update this share.',
        })
      } finally {
        setUpdatingShare(null)
      }
    },
    [addToast, loadShares, projectId, readOnly, serverId]
  )

  const handleDeleteShare = useCallback(
    async (shareId: string) => {
      if (readOnly) return
      try {
        await deleteCliShare(projectId, serverId, shareId)
        setShares((prev) => prev.filter((share) => share.id !== shareId))
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Delete failed',
          description: 'Unable to remove this share.',
        })
      }
    },
    [addToast, projectId, readOnly, serverId]
  )

  const handleUpdateServerName = useCallback(async () => {
    if (readOnly || !server) return
    setServerUpdating(true)
    try {
      const updated = await updateCliServer(projectId, serverId, { name: serverName.trim() || undefined })
      setServer(updated)
      setServerName(updated.name ?? '')
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Update failed',
        description: 'Unable to update the server name.',
      })
    } finally {
      setServerUpdating(false)
    }
  }, [addToast, projectId, readOnly, server, serverId, serverName])

  const handleRefreshServer = useCallback(async () => {
    if (readOnly) return
    setServerRefreshing(true)
    try {
      await refreshCliServerStatus(projectId, serverId)
      await loadServer()
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Refresh failed',
        description: 'Unable to refresh server status.',
      })
    } finally {
      setServerRefreshing(false)
    }
  }, [addToast, loadServer, projectId, readOnly, serverId])

  const handleRemoveServer = useCallback(async () => {
    if (readOnly) return
    const confirmed = window.confirm(
      'Remove this server from the current project? It will stay available for other projects.'
    )
    if (!confirmed) return
    setServerRemoving(true)
    try {
      const response = await removeCliServerFromProject(projectId, serverId)
      await refreshServers()
      setActiveServer(null)
      await loadServer()
      addToast({
        type: 'success',
        title: response.action === 'unbound' ? 'Server unbound' : 'Server removed',
        description:
          response.action === 'unbound'
            ? 'The legacy server was unbound and disconnected.'
            : 'The server has been removed from this project.',
      })
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Remove failed',
        description: 'Unable to remove this server.',
      })
    } finally {
      setServerRemoving(false)
    }
  }, [addToast, loadServer, projectId, readOnly, refreshServers, serverId, setActiveServer])

  const handleUnbindServer = useCallback(async () => {
    if (readOnly) return
    const confirmed = window.confirm(
      'Unbind this server globally? The agent will disconnect and be removed from all projects.'
    )
    if (!confirmed) return
    setServerUnbinding(true)
    try {
      await unbindCliServer(projectId, serverId)
      await refreshServers()
      setActiveServer(null)
      await loadServer()
      addToast({
        type: 'success',
        title: 'Server unbound',
        description: 'The server has been disconnected and removed from all projects.',
      })
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Unbind failed',
        description: 'Unable to unbind this server.',
      })
    } finally {
      setServerUnbinding(false)
    }
  }, [addToast, loadServer, projectId, readOnly, refreshServers, serverId, setActiveServer])

  return (
    <div className="space-y-4">
      <FadeContent duration={0.45} y={12}>
        <SpotlightCard className="rounded-2xl border border-white/40 bg-white/70 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-[var(--cli-ink-1)]">Server governance</div>
              <p className="mt-2 text-xs text-[var(--cli-muted-1)]">
                Monitor identity, refresh status, or disconnect this server. Actions apply immediately.
              </p>
              {readOnly ? (
                <p className="mt-2 text-xs text-[var(--cli-muted-1)]">
                  You have view-only access in this workspace.
                </p>
              ) : null}
            </div>
            <div className="text-[10px] text-[var(--cli-muted-1)]">
              {server ? `Status: ${server.status}` : 'Server unavailable'}
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-xl border border-white/40 bg-white/70 p-4 text-xs text-[var(--cli-muted-1)]">
              <div className="text-sm font-semibold text-[var(--cli-ink-1)]">Identity</div>
              {serverLoading ? (
                <div className="mt-2">Loading server details...</div>
              ) : null}
              {serverError ? <div className="mt-2">{serverError}</div> : null}
              {server ? (
                <div className="mt-3 grid gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/60 bg-white/80 px-2 py-0.5 text-[10px] text-[var(--cli-muted-1)]">
                      Status: {server.status}
                    </span>
                    <span className="rounded-full border border-white/60 bg-white/80 px-2 py-0.5 text-[10px] text-[var(--cli-muted-1)]">
                      Host: {server.hostname}
                    </span>
                  </div>
                  <div>IP: {server.ip_address ?? 'n/a'}</div>
                  <div>OS: {server.os_info ?? 'n/a'}</div>
                  <div>Last heartbeat: {formatTimestamp(server.last_seen_at)}</div>
                  <div>Registered: {formatTimestamp(server.registered_at)}</div>
                </div>
              ) : null}

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                <div className="space-y-1">
                  <Label htmlFor="cli-server-name">Server name</Label>
                  <Input
                    id="cli-server-name"
                    value={serverName}
                    onChange={(event) => setServerName(event.target.value)}
                    placeholder="e.g. GPU rig 01"
                    disabled={readOnly || serverLoading || !server}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    size="sm"
                    onClick={handleUpdateServerName}
                    isLoading={serverUpdating}
                    disabled={readOnly || !server || serverUpdating || serverLoading}
                  >
                    Update name
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/40 bg-white/70 p-4 text-xs text-[var(--cli-muted-1)]">
              <div className="text-sm font-semibold text-[var(--cli-ink-1)]">Compliance controls</div>
              <p className="mt-2">
                Use refresh to pull the latest heartbeat. Remove hides this server for the current project.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRefreshServer}
                  isLoading={serverRefreshing}
                  disabled={readOnly || !server}
                >
                  Refresh status
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRemoveServer}
                  isLoading={serverRemoving}
                  disabled={readOnly || !server}
                >
                  Remove from project
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleUnbindServer}
                  isLoading={serverUnbinding}
                  disabled={readOnly || !server}
                >
                  Unbind globally
                </Button>
              </div>
              <div className="mt-3 grid gap-1 text-[10px] text-[var(--cli-muted-1)]">
                <div>Device fingerprint: {server?.device_fingerprint ?? 'n/a'}</div>
                <div>Server root: {server?.server_root ?? 'n/a'}</div>
              </div>
            </div>
          </div>
        </SpotlightCard>
      </FadeContent>

      <FadeContent delay={0.1} duration={0.45} y={12}>
        <SpotlightCard className="rounded-2xl border border-white/40 bg-white/70 p-5">
          <div className="text-base font-semibold text-[var(--cli-ink-1)]">Share access</div>
          <p className="mt-2 text-xs text-[var(--cli-muted-1)]">
            Invite project members to access this CLI server. All changes apply immediately.
          </p>
          {readOnly ? (
            <p className="mt-2 text-xs text-[var(--cli-muted-1)]">
              You have view-only access in this workspace.
            </p>
          ) : null}

          <div className="mt-4 grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
            <div className="space-y-1">
              <Label htmlFor="cli-share-email">User email</Label>
              <Input
                id="cli-share-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teammate@example.com"
                disabled={readOnly}
              />
            </div>
            <div className="space-y-1">
              <Label>Permission</Label>
              <select
                value={permission}
                onChange={(event) => setPermission(event.target.value as 'view' | 'edit' | 'admin')}
                className="w-full rounded-lg border border-white/40 bg-white/70 px-3 py-2 text-sm text-[var(--cli-ink-1)]"
                disabled={readOnly}
              >
                <option value="view">View</option>
                <option value="edit">Edit</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Expiry</Label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                disabled={readOnly}
              />
            </div>
            <div className="flex items-end">
              <Button size="sm" onClick={handleCreateShare} disabled={readOnly || !email.trim()}>
                Add share
              </Button>
            </div>
          </div>

          {permission === 'edit' ? (
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--cli-muted-1)]">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allowTerminalInput}
                  onChange={(event) => setAllowTerminalInput(event.target.checked)}
                  disabled={readOnly}
                />
                Allow terminal input
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allowFileEdit}
                  onChange={(event) => setAllowFileEdit(event.target.checked)}
                  disabled={readOnly}
                />
                Allow file edit/upload/delete
              </label>
            </div>
          ) : null}
        </SpotlightCard>
      </FadeContent>

      <FadeContent delay={0.15} duration={0.45} y={12}>
        <SpotlightCard className="rounded-2xl border border-white/40 bg-white/70 p-5">
          <div className="text-sm font-semibold text-[var(--cli-ink-1)]">Current shares</div>
          {isLoading ? (
            <div className="mt-3 text-xs text-[var(--cli-muted-1)]">Loading shares...</div>
          ) : null}
          {error ? <div className="mt-3 text-xs text-[var(--cli-muted-1)]">{error}</div> : null}
          {!isLoading && shares.length === 0 ? (
            <div className="mt-3 text-xs text-[var(--cli-muted-1)]">No shared users yet.</div>
          ) : null}
          <div className="mt-3 space-y-3">
            {shares.map((share) => (
              <div
                key={share.id}
                className="rounded-xl border border-white/40 bg-white/70 px-4 py-3 text-xs text-[var(--cli-muted-1)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-[var(--cli-ink-1)]">{share.name}</div>
                    <div>{share.email}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={share.permission}
                      onChange={(event) =>
                        handleUpdateShare(share, { permission: event.target.value as 'view' | 'edit' | 'admin' })
                      }
                      className="rounded-lg border border-white/40 bg-white/70 px-2 py-1 text-xs text-[var(--cli-ink-1)]"
                      disabled={readOnly || updatingShare === share.id}
                    >
                      <option value="view">View</option>
                      <option value="edit">Edit</option>
                      <option value="admin">Admin</option>
                    </select>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDeleteShare(share.id)}
                      disabled={readOnly || updatingShare === share.id}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
                {share.permission === 'edit' ? (
                  <div className="mt-2 flex flex-wrap gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={share.edit_granularity?.allowTerminalInput ?? true}
                        onChange={(event) =>
                          handleUpdateShare(share, {
                            edit_granularity: {
                              allowTerminalInput: event.target.checked,
                              allowFileEdit: share.edit_granularity?.allowFileEdit ?? true,
                            },
                          })
                        }
                        disabled={readOnly || updatingShare === share.id}
                      />
                      Allow terminal input
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={share.edit_granularity?.allowFileEdit ?? true}
                        onChange={(event) =>
                          handleUpdateShare(share, {
                            edit_granularity: {
                              allowTerminalInput: share.edit_granularity?.allowTerminalInput ?? true,
                              allowFileEdit: event.target.checked,
                            },
                          })
                        }
                        disabled={readOnly || updatingShare === share.id}
                      />
                      Allow file edit/upload/delete
                    </label>
                  </div>
                ) : null}
                <div className="mt-2 grid gap-1 text-[10px] text-[var(--cli-muted-1)]">
                  <div>Shared: {formatTimestamp(share.shared_at)}</div>
                  <div>Expires: {formatTimestamp(share.expires_at)}</div>
                  <div>Last access: {formatTimestamp(share.last_access_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </SpotlightCard>
      </FadeContent>
    </div>
  )
}
