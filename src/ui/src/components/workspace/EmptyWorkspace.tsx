"use client";

/**
 * EmptyWorkspace Component
 *
 * Displayed when no tabs are open in the workspace.
 * Provides quick actions to help users get started.
 *
 * @module components/workspace/EmptyWorkspace
 */

import * as React from "react";
import {
  FileText,
  FolderOpen,
  Upload,
  BookOpen,
  Plus,
} from "lucide-react";
import { Icon3D } from "@/components/ui/icon-3d";
import { useToast } from "@/components/ui/toast";
import { createNotebook } from "@/lib/api/notebooks";
import { useI18n } from "@/lib/i18n/useI18n";
import { useFileTreeStore } from "@/lib/stores/file-tree";
import { useTabsStore } from "@/lib/stores/tabs";
import { BUILTIN_PLUGINS } from "@/lib/types/plugin";
import { cn } from "@/lib/utils";

interface EmptyWorkspaceProps {
  /** Project ID */
  projectId: string;
}

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

/**
 * QuickAction - Card for quick action buttons
 */
function QuickAction({ icon, title, description, onClick }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center p-6 rounded-soft-lg",
        "bg-soft-bg-elevated border border-soft-border",
        "hover:shadow-soft-md hover:border-soft-accent/50",
        "transition-all duration-200 group"
      )}
    >
      <div className="w-12 h-12 rounded-soft-md bg-soft-bg-base flex items-center justify-center mb-3 group-hover:bg-soft-accent/10 transition-colors">
        {icon}
      </div>
      <span className="font-medium text-soft-text-primary mb-1">{title}</span>
      <span className="text-xs text-soft-text-muted text-center">
        {description}
      </span>
    </button>
  );
}

/**
 * RecentItem - Recent file/notebook item
 */
interface RecentItemProps {
  icon: React.ReactNode;
  name: string;
  path: string;
  onClick: () => void;
}

function RecentItem({ icon, name, path, onClick }: RecentItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full p-3 rounded-soft-sm",
        "hover:bg-soft-bg-elevated transition-colors text-left"
      )}
    >
      <div className="w-8 h-8 rounded-soft-sm bg-soft-bg-base flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-soft-text-primary truncate">
          {name}
        </div>
        <div className="text-xs text-soft-text-muted truncate">{path}</div>
      </div>
    </button>
  );
}

/**
 * EmptyWorkspace - Welcome screen when no tabs are open
 *
 * Features:
 * - Quick action buttons for common tasks
 * - Recent files list (placeholder)
 * - Keyboard shortcut hints
 */
export function EmptyWorkspace({ projectId }: EmptyWorkspaceProps) {
  const { t } = useI18n("workspace");
  const openTab = useTabsStore((state) => state.openTab);
  const upload = useFileTreeStore((state) => state.upload);
  const { addToast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Quick actions
  const handleNewNotebook = React.useCallback(() => {
    (async () => {
      const notebook = await createNotebook(projectId, {
        title: t("empty_workspace_default_notebook_title"),
        collaborationEnabled: true,
      });
      openTab({
        pluginId: BUILTIN_PLUGINS.NOTEBOOK,
        context: {
          type: "notebook",
          resourceId: notebook.id,
          resourceName: notebook.title,
          customData: { projectId },
        },
        title: notebook.title,
      });
    })().catch((error) => {
      console.error("[EmptyWorkspace] Failed to create notebook:", error);
      addToast({
        type: "error",
        title: t("toast_create_notebook_failed"),
        description: t("toast_try_again"),
      });
    });
  }, [addToast, openTab, projectId, t]);

  const handleOpenFile = React.useCallback(() => {
    openTab({
      pluginId: BUILTIN_PLUGINS.SEARCH,
      context: { type: "custom", customData: { projectId } },
      title: t("command_open_search_title"),
    });
  }, [openTab, projectId, t]);

  const handleUpload = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleAskAI = React.useCallback(() => {
    openTab({
      pluginId: "@ds/plugin-analysis",
      context: { type: "custom", customData: { projectId } },
      title: t("leftpanel_analysis"),
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("ds:copilot:open", { detail: { source: "empty-workspace" } })
      );
    }
  }, [openTab, projectId, t]);

  const handleFileSelect = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        try {
          await upload(null, files);
          addToast({
            type: "success",
            title: t("toast_upload_started"),
            description: t("toast_upload_started_desc", { count: files.length }),
            duration: 2200,
          });
        } catch (error) {
          console.error("[EmptyWorkspace] Upload failed:", error);
          addToast({
            type: "error",
            title: t("toast_upload_failed"),
            description: t("toast_try_again"),
          });
        }
      }
      e.target.value = "";
    },
    [addToast, t, upload]
  );

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-soft-bg-base">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4">
            <Icon3D name="sparkle" size="lg" className="mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-soft-text-primary mb-2">
            {t("empty_workspace_title")}
          </h1>
          <p className="text-soft-text-muted">
            {t("empty_workspace_desc")}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <QuickAction
            icon={<Plus className="h-6 w-6 text-muted-foreground" />}
            title={t("empty_workspace_new_notebook")}
            description={t("empty_workspace_new_notebook_desc")}
            onClick={handleNewNotebook}
          />
          <QuickAction
            icon={<FolderOpen className="h-6 w-6 text-muted-foreground" />}
            title={t("empty_workspace_open_file")}
            description={t("empty_workspace_open_file_desc")}
            onClick={handleOpenFile}
          />
          <QuickAction
            icon={<Upload className="h-6 w-6 text-muted-foreground" />}
            title={t("empty_workspace_upload")}
            description={t("empty_workspace_upload_desc")}
            onClick={handleUpload}
          />
          <QuickAction
            icon={<Icon3D name="robot" size="md" />}
            title={t("empty_workspace_ask_ai")}
            description={t("empty_workspace_ask_ai_desc")}
            onClick={handleAskAI}
          />
        </div>

        {/* Recent Files (Placeholder) */}
        <div className="bg-soft-bg-elevated rounded-soft-lg border border-soft-border p-4">
          <h2 className="text-sm font-semibold text-soft-text-primary mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {t("empty_workspace_recent_files")}
          </h2>
          <div className="text-center py-8 text-soft-text-muted">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("empty_workspace_no_recent_files")}</p>
            <p className="text-xs mt-1">{t("empty_workspace_recent_files_desc")}</p>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="mt-6 text-center text-xs text-soft-text-muted">
          <p>{t("empty_workspace_shortcut_tip")}</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
}

export default EmptyWorkspace;
