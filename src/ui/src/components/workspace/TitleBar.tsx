"use client";

import { useState } from "react";
	import { useRouter } from "next/navigation";
import {
	  Search,
	  Plus,
	  FolderOpen,
	  MessageSquare,
  Settings,
  LogOut,
  KeyRound,
  Terminal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
		import { TrafficLights } from "./shared/TrafficLights";
		import { GlassCard } from "./shared/GlassCard";
		import { useAuthStore } from "@/lib/stores/auth";
		import { DEFAULT_USER_AVATAR_SRC, DEFAULT_USER_AVATAR_SRC_INVERTED } from "@/lib/constants/assets";
		import { useUserAvatarSrc } from "@/lib/user-avatar";
		import { useTabsStore, useTabs, useActiveTab } from "@/lib/stores/tabs";
		import { useFloatingPanelsStore } from "@/lib/stores/floating-panels";
import { BUILTIN_PLUGINS } from "@/lib/types/plugin";
		import { cn } from "@/lib/utils";
import { getMyToken, rotateMyToken } from "@/lib/api/auth";
import { TokenDialog } from "@/components/auth/TokenDialog";
import { useLabCopilotStore } from "@/lib/stores/lab-copilot";
import { useI18n } from "@/lib/i18n/useI18n";

interface TitleBarProps {
  projectId?: string;
  projectName?: string;
}

export function TitleBar({ projectId, projectName }: TitleBarProps) {
  const { t } = useI18n('workspace');
  const { t: tCommon } = useI18n('common');
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const avatarSrc = useUserAvatarSrc(user);
  const tabs = useTabs();
  const activeTab = useActiveTab();
  const { setActiveTab, closeTab, openTab } = useTabsStore();
  const { panels, togglePanel } = useFloatingPanelsStore();
  const activeQuestId = useLabCopilotStore((state) => state.activeQuestId);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [myToken, setMyToken] = useState("");
  const [tokenRefreshLoading, setTokenRefreshLoading] = useState(false);
  const [tokenRefreshError, setTokenRefreshError] = useState("");
  const displayName =
    user?.username?.trim() || user?.email?.split("@")[0] || user?.email || "User";

  // Handle close button - navigate back to projects
  const handleClose = () => {
    router.push("/projects");
  };

  const handleGetToken = async () => {
    setTokenDialogOpen(true);
    setTokenError("");
    setTokenRefreshError("");
    setTokenLoading(true);
    try {
      const data = await getMyToken();
      setMyToken(data.api_token);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (err instanceof Error ? err.message : tCommon('token_load_failed'));
      setTokenError(message);
      setMyToken("");
    } finally {
      setTokenLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    if (!myToken) return;
    setTokenRefreshError("");
    setTokenRefreshLoading(true);
    try {
      const data = await rotateMyToken(myToken);
      setMyToken(data.api_token);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (err instanceof Error ? err.message : tCommon('token_refresh_failed'));
      setTokenRefreshError(message);
    } finally {
      setTokenRefreshLoading(false);
    }
  };

  const handleOpenCli = () => {
    if (!projectId) return;
    openTab({
      pluginId: BUILTIN_PLUGINS.CLI,
      context: { type: "custom", customData: { projectId } },
      title: t('plugin_cli_title'),
    });
  };

  const handleOpenSearch = (rawQuery: string) => {
    if (!projectId) return;
    const trimmed = rawQuery.trim();
    const hasQuestPrefix = /\bquest:/.test(trimmed);
    const finalQuery =
      activeQuestId && trimmed && !hasQuestPrefix
        ? `quest:${activeQuestId} ${trimmed}`.trim()
        : trimmed;
    openTab({
      pluginId: BUILTIN_PLUGINS.SEARCH,
      context: {
        type: "custom",
        customData: {
          projectId,
          query: finalQuery,
          questId: activeQuestId ?? undefined,
        },
      },
      title: t('plugin_search_title'),
    });
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 p-4">
        <GlassCard className="h-12 flex items-center px-4 gap-4">
        {/* Left: Traffic Lights + User */}
        <div className="flex items-center gap-4">
          <TrafficLights onClose={handleClose} />
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-white/90 hover:bg-white/5 transition-colors"
                  aria-label={t('titlebar_open_user_menu')}
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={avatarSrc} alt={user?.email || displayName} />
                    <AvatarFallback className="bg-white/10">
                      <img
                        src={DEFAULT_USER_AVATAR_SRC}
                        alt={t('titlebar_user_alt')}
                        width={28}
                        height={28}
                        className="h-4 w-4 object-contain dark:hidden"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                      <img
                        src={DEFAULT_USER_AVATAR_SRC_INVERTED}
                        alt={t('titlebar_user_alt')}
                        width={28}
                        height={28}
                        className="hidden h-4 w-4 object-contain dark:block"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold hidden sm:inline">{displayName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleGetToken}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  {t('titlebar_get_token')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  {t('titlebar_settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('titlebar_sign_out')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {projectName && (
              <>
                <span className="text-white/30">/</span>
                <span className="text-white/70 text-sm">{projectName}</span>
              </>
            )}
          </div>
        </div>

        {/* Center: Tabs */}
        <div className="flex-1 flex items-center justify-center gap-1 max-w-2xl mx-auto">
          <AnimatePresence mode="popLayout">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  "flex items-center gap-2 group",
                  activeTab?.id === tab.id
                    ? "text-white bg-white/10"
                    : "text-white/60 hover:text-white/80 hover:bg-white/5"
                )}
              >
                <span className="truncate max-w-[120px]">{tab.title}</span>
                {tab.isDirty && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 rounded hover:bg-white/10"
                >
                  <span className="text-xs">x</span>
                </button>
              </motion.button>
            ))}
          </AnimatePresence>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() =>
                    openTab({
                      pluginId: "@ds/plugin-marketplace",
                      context: {
                        type: "custom",
                        customData: projectId ? { projectId } : undefined,
                      },
                      title: t('plugin_marketplace_title'),
                    })
                  }
                  className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('titlebar_new_tab')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {/* Panel Toggles */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => togglePanel("files")}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    panels.files.isVisible
                      ? "text-white/80 bg-white/10"
                      : "text-white/40 hover:text-white/80 hover:bg-white/5"
                  )}
                >
                  <FolderOpen className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('titlebar_toggle_files_panel')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => togglePanel("chat")}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    panels.chat.isVisible
                      ? "text-white/80 bg-white/10"
                      : "text-white/40 hover:text-white/80 hover:bg-white/5"
                  )}
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('titlebar_toggle_chat_panel')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {projectId ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleOpenCli}
                    className="p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
                  >
                    <Terminal className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{t('titlebar_open_cli')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}

          {/* Search */}
          <AnimatePresence>
            {isSearchOpen ? (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 200, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <Input
                  autoFocus
                  placeholder={t('titlebar_search_placeholder')}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleOpenSearch(searchQuery);
                      setIsSearchOpen(false);
                      setSearchQuery("");
                    }
                  }}
                  className="h-8 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  onBlur={() => setIsSearchOpen(false)}
                />
              </motion.div>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setIsSearchOpen(true)}
                      className="p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{t('titlebar_search_hotkey')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </AnimatePresence>

	        </div>
	      </GlassCard>
	    </div>

      <TokenDialog
        open={tokenDialogOpen}
        onOpenChange={setTokenDialogOpen}
        title={tCommon('token_dialog_title')}
        description={tCommon('token_dialog_description')}
        token={myToken}
        loading={tokenLoading}
        error={tokenError}
        onRefresh={handleRefreshToken}
        refreshLoading={tokenRefreshLoading}
        refreshDisabled={!myToken || tokenLoading}
        refreshError={tokenRefreshError}
      />
    </>
  );
}
