"use client";

import * as React from "react";
import {
  FolderIcon,
  ChevronDown,
  Search,
  BarChart3,
  Puzzle,
  Settings,
  FlaskConical,
  FolderPlus,
  Upload,
  RefreshCw,
  Terminal,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DotfilesToggleIcon } from "@/components/ui/dotfiles-toggle-icon";
import { useTabsStore } from "@/lib/stores/tabs";
import { useFileTreeStore } from "@/lib/stores/file-tree";
import { BUILTIN_PLUGINS } from "@/lib/types/plugin";
import type { FileNode } from "@/lib/types/file";
import { FileTree } from "@/components/file-tree";
import { ArxivPanel } from "@/components/arxiv";
import { useOpenFile } from "@/hooks/useOpenFile";
import { downloadFileById } from "@/lib/api/files";
import { listCliServers } from "@/lib/api/cli";
import { useI18n } from "@/lib/i18n/useI18n";
import { PngIcon } from "@/components/ui/png-icon";
import { cn } from "@/lib/utils";
import { CliExplorerTree, type CliExplorerTreeHandle } from "./CliExplorerTree";
import { SparklesIcon } from "@/components/ui/workspace-icons";

interface LeftSidebarProps {
  /** Project ID for file tree */
  projectId: string;
  readOnly?: boolean;
  onEnterHome?: () => void;
  onEnterLab?: () => void;
  onExitHome?: () => void;
}

interface SidebarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}

/**
 * SidebarButton - Button for sidebar quick actions
 */
function SidebarButton({ icon, label, onClick, active }: SidebarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2 rounded-soft-sm",
        "text-soft-text-secondary text-sm font-medium",
        "transition-colors duration-150",
        "hover:bg-soft-bg-elevated hover:text-soft-text-primary",
        active && "bg-soft-bg-elevated text-soft-text-primary"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/**
 * LeftSidebar - Left panel containing file tree and quick actions
 *
 * Structure:
 * +--------------------------+
 * |  Files           [+] [r] |  <- Collapsible section header with actions
 * |  -------------------------
 * |  > documents             |
 * |    > papers              |
 * |      paper1.pdf          |
 * |  ...                     |
 * +--------------------------+
 * |  Quick Actions           |
 * |  -------------------------
 * |  Search                  |
 * |  Analysis                |
 * |  Plugins                 |
 * +--------------------------+
 * |  Settings                |
 * +--------------------------+
 */
export function LeftSidebar({
  projectId,
  readOnly,
  onEnterHome,
  onEnterLab,
  onExitHome,
}: LeftSidebarProps) {
  const { t } = useI18n("workspace");
  const openTab = useTabsStore((state) => state.openTab);
  const { createFolder, upload, refresh, isLoading } = useFileTreeStore();
  const { openFileInTab, downloadFile } = useOpenFile();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cliExplorerRef = React.useRef<CliExplorerTreeHandle | null>(null);
  const [isCliOpen, setIsCliOpen] = React.useState(true);
  const [hasCliServers, setHasCliServers] = React.useState(false);
  const [hideDotfiles, setHideDotfiles] = React.useState(true);

  const checkCliServers = React.useCallback(async () => {
    try {
      const servers = await listCliServers(projectId);
      const connected = servers.some(
        (server) => server.status !== "offline" && server.status !== "error"
      );
      setHasCliServers(connected);
      return servers;
    } catch {
      setHasCliServers(false);
      return null;
    }
  }, [projectId]);

  React.useEffect(() => {
    void checkCliServers();
  }, [checkCliServers]);

  // Open a plugin tab
  const openPluginTab = React.useCallback(
    (pluginId: string, title: string, customData?: Record<string, unknown>) => {
      onExitHome?.();
      openTab({
        pluginId,
        context: {
          type: "custom",
          customData: customData ? { projectId, ...customData } : { projectId },
        },
        title,
      });
    },
    [onExitHome, openTab, projectId]
  );

  // Handle file open from tree
  const handleFileOpen = React.useCallback(
    async (file: FileNode) => {
      onExitHome?.();
      await openFileInTab(file);
    },
    [onExitHome, openFileInTab]
  );

  // Handle file download from context menu
  const handleFileDownload = React.useCallback(
    async (file: FileNode) => {
      try {
        await downloadFileById(file.id, file.name);
      } catch (error) {
        console.error("Failed to download file:", error);
      }
    },
    []
  );

  // Handle create new folder
  const handleNewFolder = React.useCallback(async () => {
    try {
      await createFolder(null, "New Folder");
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  }, [createFolder]);

  // Handle file upload button click
  const handleUploadClick = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle file selection from input
  const handleFileSelect = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        try {
          await upload(null, files);
        } catch (error) {
          console.error("Upload failed:", error);
        }
      }
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [upload]
  );

  // Handle refresh
  const handleRefresh = React.useCallback(async () => {
    try {
      await refresh();
      void checkCliServers();
    } catch (error) {
      console.error("Failed to refresh:", error);
    }
  }, [checkCliServers, refresh]);

  const handleCliNewFolder = React.useCallback(() => {
    if (readOnly) return;
    cliExplorerRef.current?.createFolder();
  }, [readOnly]);

  const handleCliUpload = React.useCallback(() => {
    if (readOnly) return;
    cliExplorerRef.current?.upload();
  }, [readOnly]);

  const handleCliRefresh = React.useCallback(() => {
    void cliExplorerRef.current?.refresh();
    void checkCliServers();
  }, [checkCliServers]);

  return (
    <div className="h-full flex flex-col bg-soft-bg-base border-r border-soft-border">
      {/* File Tree Section */}
      <Collapsible defaultOpen className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center px-4 py-3">
          <CollapsibleTrigger className="flex items-center flex-1 hover:text-soft-text-primary transition-colors">
            <FolderIcon className="h-4 w-4 mr-2 text-soft-text-muted" />
            <span className="font-medium text-sm text-soft-text-primary">
              {t("leftpanel_files")}
            </span>
          </CollapsibleTrigger>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleNewFolder}
              className="p-1 rounded hover:bg-soft-bg-elevated text-soft-text-muted hover:text-soft-text-primary transition-colors"
              title={t("leftpanel_new_folder")}
            >
              <FolderPlus className="h-4 w-4" />
            </button>
            <button
              onClick={handleUploadClick}
              className="p-1 rounded hover:bg-soft-bg-elevated text-soft-text-muted hover:text-soft-text-primary transition-colors"
              title={t("leftpanel_upload_files")}
            >
              <Upload className="h-4 w-4" />
            </button>
            <button
              onClick={() => setHideDotfiles((prev) => !prev)}
              className="p-1 rounded hover:bg-soft-bg-elevated text-soft-text-muted hover:text-soft-text-primary transition-colors"
              title={hideDotfiles ? t("leftpanel_show_dotfiles") : t("leftpanel_hide_dotfiles")}
              aria-label={
                hideDotfiles ? t("leftpanel_show_dotfiles") : t("leftpanel_hide_dotfiles")
              }
            >
              <DotfilesToggleIcon hidden={hideDotfiles} className="h-4 w-4" />
            </button>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className={cn(
                "p-1 rounded hover:bg-soft-bg-elevated text-soft-text-muted hover:text-soft-text-primary transition-colors",
                isLoading && "animate-spin"
              )}
              title={t("leftpanel_refresh")}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        <CollapsibleContent className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <FileTree
              projectId={projectId}
              onFileOpen={handleFileOpen}
              onFileDownload={handleFileDownload}
              hideDotfiles={hideDotfiles}
            />
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>

      {hasCliServers ? (
        <Collapsible
          open={isCliOpen}
          onOpenChange={setIsCliOpen}
          className="h-[240px] shrink-0 flex flex-col border-t border-soft-border"
        >
          <div className="flex items-center px-4 py-3">
            <CollapsibleTrigger className="flex items-center flex-1 hover:text-soft-text-primary transition-colors">
              <span className={cn("mr-2 transition-transform", isCliOpen ? "rotate-0" : "-rotate-90")}>
                <ChevronDown className="h-4 w-4 text-soft-text-muted" />
              </span>
              <span className="font-medium text-sm text-soft-text-primary">
                {t("leftpanel_cli_files")}
              </span>
            </CollapsibleTrigger>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCliNewFolder}
                disabled={readOnly}
                className={cn(
                  "p-1 rounded hover:bg-soft-bg-elevated text-soft-text-muted hover:text-soft-text-primary transition-colors",
                  readOnly && "opacity-50"
                )}
                title={readOnly ? t("leftpanel_view_only") : t("leftpanel_new_folder")}
              >
                <FolderPlus className="h-4 w-4" />
              </button>
              <button
                onClick={handleCliUpload}
                disabled={readOnly}
                className={cn(
                  "p-1 rounded hover:bg-soft-bg-elevated text-soft-text-muted hover:text-soft-text-primary transition-colors",
                  readOnly && "opacity-50"
                )}
                title={readOnly ? t("leftpanel_view_only") : t("leftpanel_upload_files")}
              >
                <Upload className="h-4 w-4" />
              </button>
              <button
                onClick={() => setHideDotfiles((prev) => !prev)}
                className="p-1 rounded hover:bg-soft-bg-elevated text-soft-text-muted hover:text-soft-text-primary transition-colors"
                title={hideDotfiles ? t("leftpanel_show_dotfiles") : t("leftpanel_hide_dotfiles")}
                aria-label={
                  hideDotfiles ? t("leftpanel_show_dotfiles") : t("leftpanel_hide_dotfiles")
                }
              >
                <DotfilesToggleIcon hidden={hideDotfiles} className="h-4 w-4" />
              </button>
              <button
                onClick={handleCliRefresh}
                className="p-1 rounded hover:bg-soft-bg-elevated text-soft-text-muted hover:text-soft-text-primary transition-colors"
                title={t("leftpanel_refresh")}
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <CollapsibleContent className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="px-2 pb-2">
                <CliExplorerTree
                  ref={cliExplorerRef}
                  projectId={projectId}
                  readOnly={readOnly}
                  hideDotfiles={hideDotfiles}
                />
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      ) : null}

      <div className="h-[240px] shrink-0">
        <ArxivPanel projectId={projectId} className="h-full" variant="compact" />
      </div>

      <Separator />

      {/* Quick Actions Section */}
      <div className="p-2 space-y-1">
        <SidebarButton
          icon={<Terminal className="h-4 w-4" />}
          label="CLI"
          onClick={() => openPluginTab(BUILTIN_PLUGINS.CLI, "CLI", { projectId })}
        />
        <SidebarButton
          icon={<Search className="h-4 w-4" />}
          label="Search"
          onClick={() => openPluginTab(BUILTIN_PLUGINS.SEARCH, "Search")}
        />
        <SidebarButton
          icon={<BarChart3 className="h-4 w-4" />}
          label="Analysis"
          onClick={() => openPluginTab("@ds/plugin-analysis", "Analysis")}
        />
        <SidebarButton
          icon={<Puzzle className="h-4 w-4" />}
          label="Plugins"
          onClick={() =>
            openPluginTab("@ds/plugin-marketplace", "Plugin Marketplace")
          }
        />
      </div>

      <Separator />

      {/* Settings */}
      <div className="p-2">
        <SidebarButton
          icon={<Settings className="h-4 w-4" />}
          label="Settings"
          onClick={() => openPluginTab(BUILTIN_PLUGINS.SETTINGS, "Settings")}
        />
        <SidebarButton
          icon={
            <PngIcon
              name="inverted/SparklesIcon"
              alt="Copilot"
              size={16}
              className="h-4 w-4"
              fallback={<SparklesIcon className="h-4 w-4" />}
            />
          }
          label="Agent"
          onClick={() => onEnterHome?.()}
        />
        <SidebarButton
          icon={<FlaskConical className="h-4 w-4" />}
          label="Home"
          onClick={() => {
            onEnterLab?.();
            openPluginTab(BUILTIN_PLUGINS.LAB, "Home", { readOnly });
          }}
        />
      </div>
    </div>
  );
}

export default LeftSidebar;
