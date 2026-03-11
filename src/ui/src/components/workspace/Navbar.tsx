'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { useI18n } from '@/lib/i18n/useI18n'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/ui/notification-bell'
import { DEFAULT_USER_AVATAR_SRC, DEFAULT_USER_AVATAR_SRC_INVERTED } from '@/lib/constants/assets'
import {
  LogoIcon,
  SearchIcon,
  SettingsIcon,
  PanelLeftIcon,
  PanelRightIcon,
} from '@/components/ui/workspace-icons'
import { useUserAvatarSrc } from '@/lib/user-avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface NavbarProps {
  projectName?: string
  onToggleLeft?: () => void
  onToggleRight?: () => void
  leftCollapsed?: boolean
  rightCollapsed?: boolean
  centerSlot?: React.ReactNode
  notificationsEnabled?: boolean
}

export function Navbar({
  projectName,
  onToggleLeft,
  onToggleRight,
  leftCollapsed,
  rightCollapsed,
  centerSlot,
  notificationsEnabled = true,
}: NavbarProps) {
  const { t } = useI18n('workspace')
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const avatarSrc = useUserAvatarSrc(user)
  const [activeTab, setActiveTab] = useState<'workspace' | 'plugins'>('workspace')

  const handleLogout = async () => {
    logout()
    router.push('/')
  }

  return (
    <nav className="workspace-navbar flex items-center px-4 gap-4 mx-3 mt-3 z-50">
      {/* Left: Panel Toggle + Logo + Project */}
      <div className="flex items-center gap-3">
        {onToggleLeft && (
          <button
            onClick={onToggleLeft}
            className={cn(
              'ghost-btn',
              !leftCollapsed && 'text-[var(--brand)]'
            )}
            aria-label={leftCollapsed ? t('navbar_show_explorer') : t('navbar_hide_explorer')}
            data-tooltip={leftCollapsed ? t('navbar_show_explorer') : t('navbar_hide_explorer')}
          >
            <PanelLeftIcon size={18} />
          </button>
        )}

        <Link href="/projects" className="flex items-center gap-2.5">
          <LogoIcon size={28} />
          <span className="font-semibold text-[var(--text-main)]">
            DeepScientist
          </span>
        </Link>

        {projectName && (
          <>
            <span className="text-[var(--text-muted)] mx-1">/</span>
            <span className="text-sm font-medium text-[var(--text-main)] truncate max-w-[200px]">
              {projectName}
            </span>
          </>
        )}
      </div>

      {/* Center: Navigation Tabs or Workspace Tab Strip */}
      <div className="flex-1 flex items-center justify-center min-w-0 ml-6">
        {centerSlot ? (
          <div className="w-full max-w-[820px] min-w-0">{centerSlot}</div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('workspace')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-sm transition-all',
                activeTab === 'workspace'
                  ? 'bg-white shadow-sm font-medium text-[var(--text-main)]'
                  : 'text-[var(--text-muted)] hover:bg-black/[0.04] hover:text-[var(--text-main)]'
              )}
            >
              {t('navbar_workspace')}
            </button>
            <button
              onClick={() => setActiveTab('plugins')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-sm transition-all',
                activeTab === 'plugins'
                  ? 'bg-white shadow-sm font-medium text-[var(--text-main)]'
                  : 'text-[var(--text-muted)] hover:bg-black/[0.04] hover:text-[var(--text-main)]'
              )}
            >
              {t('navbar_plugins')}
            </button>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button className="ghost-btn" aria-label={t('navbar_search')} data-tooltip={t('navbar_search')}>
          <SearchIcon size={16} />
        </button>
        <NotificationBell variant="workspace" size="sm" enabled={notificationsEnabled} />
        <button className="ghost-btn" aria-label={t('navbar_settings')} data-tooltip={t('navbar_settings')}>
          <SettingsIcon size={18} />
        </button>

        {onToggleRight && (
          <button
            onClick={onToggleRight}
            className={cn(
              'ghost-btn',
              !rightCollapsed && 'text-[var(--brand)]'
            )}
            aria-label={rightCollapsed ? t('navbar_show_copilot') : t('navbar_hide_copilot')}
            data-tooltip={rightCollapsed ? t('navbar_show_copilot') : t('navbar_hide_copilot')}
          >
            <PanelRightIcon size={18} />
          </button>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-2 focus:outline-none">
                <Avatar className="h-8 w-8 border border-[var(--border-light)]">
                  <AvatarImage src={avatarSrc} alt={user?.email || t('titlebar_user_alt')} />
                  <AvatarFallback className="bg-white">
                  <img
                    src={DEFAULT_USER_AVATAR_SRC}
                    alt={t('titlebar_user_alt')}
                    width={32}
                    height={32}
                    className="h-5 w-5 object-contain dark:hidden"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                  <img
                    src={DEFAULT_USER_AVATAR_SRC_INVERTED}
                    alt="User"
                    width={32}
                    height={32}
                    className="hidden h-5 w-5 object-contain dark:block"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/docs')}>
              Documents
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
