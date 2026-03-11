'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ApiTokenDisplay } from '@/components/auth/ApiTokenDisplay'
import { ConfirmModal } from '@/components/ui/modal'
import { useI18n } from '@/lib/i18n/useI18n'

interface TokenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  token?: string
  loading?: boolean
  error?: string
  showWarning?: boolean
  onRefresh?: () => void | Promise<void>
  refreshLoading?: boolean
  refreshDisabled?: boolean
  refreshError?: string
  refreshConfirmTitle?: string
  refreshConfirmDescription?: string
}

export function TokenDialog({
  open,
  onOpenChange,
  title,
  description,
  token,
  loading = false,
  error,
  showWarning = false,
  onRefresh,
  refreshLoading = false,
  refreshDisabled = false,
  refreshError,
  refreshConfirmTitle,
  refreshConfirmDescription,
}: TokenDialogProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { t } = useI18n('common')

  const handleConfirmRefresh = async () => {
    if (!onRefresh) return
    try {
      await onRefresh()
    } finally {
      setConfirmOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        {loading ? (
          <div className="rounded-xl border border-[var(--soft-border)] bg-[var(--soft-bg-elevated)] p-4 text-sm text-[var(--soft-text-secondary)]">
            {t('token_loading')}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : token ? (
          <ApiTokenDisplay token={token} showWarning={showWarning} />
        ) : (
          <div className="rounded-xl border border-[var(--soft-border)] bg-[var(--soft-bg-elevated)] p-4 text-sm text-[var(--soft-text-secondary)]">
            {t('token_missing')}
          </div>
        )}

        {refreshError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {refreshError}
          </div>
        ) : null}

        <DialogFooter>
          {onRefresh ? (
            <Button
              variant="secondary"
              onClick={() => setConfirmOpen(true)}
              isLoading={refreshLoading}
              disabled={refreshDisabled || loading || Boolean(error)}
            >
              {t('token_refresh_button')}
            </Button>
          ) : null}
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t('action_close')}
          </Button>
        </DialogFooter>
      </DialogContent>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmRefresh}
        title={refreshConfirmTitle || t('token_refresh_confirm_title')}
        description={
          refreshConfirmDescription ||
          t('token_refresh_confirm_description')
        }
        confirmText={t('token_refresh')}
        cancelText={t('action_cancel')}
        variant="warning"
        loading={refreshLoading}
      />
    </Dialog>
  )
}
