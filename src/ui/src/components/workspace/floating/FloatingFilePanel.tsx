"use client";

import {
  FolderIcon,
  Search,
  BarChart3,
  Puzzle,
  Settings,
  FolderPlus,
  Upload,
  RefreshCw,
  Terminal,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DotfilesToggleIcon } from "@/components/ui/dotfiles-toggle-icon";
import { FloatingPanel } from "./FloatingPanel";
import { FilePreviewPanel, FileTree } from "@/components/file-tree";
import { ArxivPanel } from "@/components/arxiv";
import { useTabsStore } from "@/lib/stores/tabs";
import { useFileTreeStore } from "@/lib/stores/file-tree";
import { useOpenFile } from "@/hooks/useOpenFile";
import { BUILTIN_PLUGINS } from "@/lib/types/plugin";
import { useI18n } from "@/lib/i18n/useI18n";
import { cn } from "@/lib/utils";
import { useRef, useCallback, useState } from "react";
import type { FileNode } from "@/lib/types/file";

interface FloatingFilePanelProps {
  projectId: string;
}

function SidebarButton({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2 rounded-lg",
        "text-white/60 text-sm font-medium",
        "transition-colors duration-150",
        "hover:bg-white/10 hover:text-white/90",
        active && "bg-white/10 text-white/90"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function FloatingFilePanel({ projectId }: FloatingFilePanelProps) {
  const { t } = useI18n("workspace");
  const openTab = useTabsStore((state) => state.openTab);
  const { createFolder, upload, refresh, isLoading } = useFileTreeStore();
  const { openFileInTab } = useOpenFile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hideDotfiles, setHideDotfiles] = useState(true);

  const openPluginTab = useCallback(
    (pluginId: string, title: string, customData?: Record<string, unknown>) => {
      openTab({
        pluginId,
        context: {
          type: "custom",
          customData: customData ? { projectId, ...customData } : { projectId },
        },
        title,
      });
    },
    [openTab, projectId]
  );

  const handleFileOpen = useCallback(
    async (file: FileNode) => {
      await openFileInTab(file);
    },
    [openFileInTab]
  );

  const handleNewFolder = useCallback(async () => {
    try {
      await createFolder(null, t("leftpanel_new_folder"));
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  }, [createFolder, t]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        try {
          await upload(null, files);
        } catch (error) {
          console.error("Upload failed:", error);
        }
      }
      e.target.value = "";
    },
    [upload]
  );

  return (
    <FloatingPanel
      id="files"
      title={t("leftpanel_files")}
      icon={<FolderIcon className="h-4 w-4" />}
      minWidth={250}
      minHeight={300}
    >
      <div className="h-full flex flex-col">
        {/* File Tree Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
          <span className="text-xs text-white/50 uppercase tracking-wider">
            {t("floating_files_project_files")}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleNewFolder}
              className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
              title={t("leftpanel_new_folder")}
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleUploadClick}
              className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
              title={t("leftpanel_upload_files")}
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setHideDotfiles((prev) => !prev)}
              className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
              title={hideDotfiles ? t("leftpanel_show_dotfiles") : t("leftpanel_hide_dotfiles")}
              aria-label={
                hideDotfiles ? t("leftpanel_show_dotfiles") : t("leftpanel_hide_dotfiles")
              }
            >
              <DotfilesToggleIcon hidden={hideDotfiles} className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => refresh()}
              disabled={isLoading}
              className={cn(
                "p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors",
                isLoading && "animate-spin"
              )}
              title={t("leftpanel_refresh")}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* File Tree */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            <FileTree
              projectId={projectId}
              onFileOpen={handleFileOpen}
              hideDotfiles={hideDotfiles}
            />
          </div>
        </ScrollArea>

        <div className="h-[220px] shrink-0 border-t border-white/10">
          <FilePreviewPanel projectId={projectId} className="h-full" />
        </div>

        <div className="h-[220px] shrink-0">
          <ArxivPanel
            projectId={projectId}
            className="h-full border-t border-white/10"
            variant="compact"
          />
        </div>

        <Separator className="bg-white/5" />

        {/* Quick Actions */}
        <div className="p-2 space-y-1">
          <SidebarButton
            icon={<Terminal className="h-4 w-4" />}
            label={t("leftpanel_cli")}
            onClick={() => openPluginTab(BUILTIN_PLUGINS.CLI, t("leftpanel_cli"), { projectId })}
          />
          <SidebarButton
            icon={<Search className="h-4 w-4" />}
            label={t("leftpanel_search")}
            onClick={() => openPluginTab(BUILTIN_PLUGINS.SEARCH, t("leftpanel_search"))}
          />
          <SidebarButton
            icon={<BarChart3 className="h-4 w-4" />}
            label={t("leftpanel_analysis")}
            onClick={() => openPluginTab("@ds/plugin-analysis", t("leftpanel_analysis"))}
          />
          <SidebarButton
            icon={<Puzzle className="h-4 w-4" />}
            label={t("leftpanel_plugins")}
            onClick={() => openPluginTab("@ds/plugin-marketplace", t("plugin_marketplace_title"))}
          />
        </div>

        <Separator className="bg-white/5" />

        <div className="p-2">
          <SidebarButton
            icon={<Settings className="h-4 w-4" />}
            label={t("leftpanel_settings")}
            onClick={() => openPluginTab(BUILTIN_PLUGINS.SETTINGS, t("plugin_settings_title"))}
          />
        </div>
      </div>
    </FloatingPanel>
  );
}
