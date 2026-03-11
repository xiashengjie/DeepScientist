'use client'

import { useEffect, useMemo, useState } from 'react'
import { checkProjectAccess } from '@/lib/api/projects'
import { listCliShares } from '@/lib/api/cli'
import { useAuthStore } from '@/lib/stores/auth'
import { isShareViewForProject } from '@/lib/share-session'
import type { CliEditGranularity, CliPermissionLevel } from '../types/permissions'
import { mapProjectRoleToPermission, maxPermission, resolveCliCapabilities } from '../types/permissions'

export function useCliAccess(options: {
  projectId?: string | null
  serverId?: string | null
  readOnly?: boolean
}) {
  const { projectId, serverId, readOnly } = options
  const userId = useAuthStore((state) => state.user?.id)
  const [permission, setPermission] = useState<CliPermissionLevel>('none')
  const [granularity, setGranularity] = useState<CliEditGranularity | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isShareView = useMemo(
    () => Boolean(projectId && isShareViewForProject(projectId)),
    [projectId]
  )

  useEffect(() => {
    if (!projectId || !serverId) {
      setPermission('none')
      setGranularity(null)
      return
    }

    if (readOnly || isShareView) {
      setPermission('view')
      setGranularity(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    const resolveAccess = async () => {
      try {
        const access = await checkProjectAccess(projectId)
        if (cancelled) return
        const rolePermission = mapProjectRoleToPermission(access?.role)

        let sharePermission: CliPermissionLevel = 'none'
        let shareGranularity: CliEditGranularity | null = null
        if (userId) {
          try {
            const shares = await listCliShares(projectId, serverId)
            const match = shares.users.find((entry) => entry.user_id === userId)
            if (match) {
              sharePermission = match.permission as CliPermissionLevel
              shareGranularity = match.edit_granularity ?? null
            }
          } catch {
            // Ignore share fetch errors; fall back to project role.
          }
        }

        const effectivePermission = maxPermission(rolePermission, sharePermission)
        setPermission(effectivePermission)
        setGranularity(effectivePermission === 'edit' ? shareGranularity : null)
      } catch (err) {
        if (cancelled) return
        setPermission('none')
        setGranularity(null)
        setError('Failed to resolve CLI permissions')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void resolveAccess()
    return () => {
      cancelled = true
    }
  }, [projectId, serverId, readOnly, isShareView, userId])

  const capabilities = useMemo(() => resolveCliCapabilities(permission, granularity), [permission, granularity])

  return {
    permission,
    granularity,
    capabilities,
    isLoading,
    error,
    isShareView,
  }
}
