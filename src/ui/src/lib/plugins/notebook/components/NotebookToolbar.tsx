"use client";

/**
 * NotebookToolbar Component
 *
 * @ds/plugin-notebook
 *
 * Editor toolbar with mode toggle, export, and share buttons.
 * Shows auto-save status indicator.
 */

import React, { useCallback, useState } from "react";
import {
  Download,
  Share,
  Check,
  Loader2,
  AlertCircle,
  MoreHorizontal,
  History,
  Users,
  Copy,
} from "lucide-react";
import type { AutoSaveStatus, ExportFormat } from "../types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/toast";
import { exportNotebook } from "@/lib/api/notebooks";
import { getFileContent } from "@/lib/api/files";
import { useI18n } from "@/lib/i18n/useI18n";

/**
 * NotebookToolbar Props
 */
interface NotebookToolbarProps {
  /** Notebook ID */
  notebookId: string;

  /** Whether the editor is in readonly mode */
  readonly?: boolean;

  /** Auto-save status */
  autoSaveStatus: AutoSaveStatus;

  /** Get current markdown content (for copy) */
  getMarkdown?: () => string | Promise<string>;

  /** Open version history */
  onShowHistory?: () => void;

  /** Open collaborators panel */
  onShowCollaborators?: () => void;

  /** Toggle copy action */
  allowCopy?: boolean;

  /** Toggle export action */
  allowExport?: boolean;

  /** Toggle share action */
  allowShare?: boolean;

}

/**
 * Auto-save status indicator component
 */
function SaveStatusIndicator({ status }: { status: AutoSaveStatus }) {
  const { t } = useI18n("notebook");

  switch (status) {
    case "saving":
      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>{t("saving")}</span>
        </div>
      );
    case "saved":
      return (
        <div className="flex items-center gap-1.5 text-xs text-green-600">
          <Check className="w-3 h-3" />
          <span>{t("saved")}</span>
        </div>
      );
    case "error":
      return (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="w-3 h-3" />
          <span>{t("save_failed")}</span>
        </div>
      );
    default:
      return null;
  }
}

/**
 * NotebookToolbar Component
 */
export function NotebookToolbar({
  notebookId,
  readonly = false,
  autoSaveStatus,
  getMarkdown,
  onShowHistory,
  onShowCollaborators,
  allowCopy = true,
  allowExport = true,
  allowShare = true,
}: NotebookToolbarProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n("notebook");
  const canCopy = allowCopy && (Boolean(notebookId) || Boolean(getMarkdown));
  const canExport = allowExport && Boolean(notebookId);
  const canShare = allowShare && Boolean(notebookId);

  const resolveMarkdownContent = useCallback(async () => {
    if (getMarkdown) {
      const content = await Promise.resolve(getMarkdown());
      if (typeof content === "string") return content;
    }
    if (!notebookId) return "";
    return await getFileContent(notebookId);
  }, [getMarkdown, notebookId]);

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      URL.revokeObjectURL(url);
    }
  }, []);

  const downloadFromUrl = useCallback((url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    link.rel = "noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, []);

  // Handle export
  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (!notebookId) return;
      setIsExporting(true);
      setShowMenu(false);

      try {
        const result = await exportNotebook(notebookId, format);
        const filename = result.filename || `notebook.${format}`;
        if (format === "pdf") {
          if (!result.downloadUrl) {
            throw new Error("Missing download URL for PDF export");
          }
          downloadFromUrl(result.downloadUrl, filename);
        } else {
          const mimeType =
            format === "markdown" ? "text/markdown" : "text/html";
          const content = result.content ?? "";
          downloadBlob(new Blob([content], { type: mimeType }), filename);
        }
        toast({
          title: t("export_ready_title"),
          description: t("export_ready_desc", { filename }),
          variant: "success",
        });
      } catch (error) {
        console.error("[NotebookToolbar] Export failed:", error);
        toast({
          title: t("export_failed_title"),
          description: t("try_again"),
          variant: "destructive",
        });
      } finally {
        setIsExporting(false);
      }
    },
    [downloadBlob, downloadFromUrl, notebookId, t, toast]
  );

  const handleCopy = useCallback(async () => {
    if (!canCopy) return;
    try {
      const markdown = await resolveMarkdownContent();
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(markdown);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = markdown;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      toast({
        title: t("copy_success_title"),
        description: t("copy_success_desc"),
        variant: "success",
      });
    } catch (error) {
      console.error("[NotebookToolbar] Copy failed:", error);
      toast({
        title: t("copy_failed_title"),
        description: t("try_again"),
        variant: "destructive",
      });
    }
  }, [canCopy, resolveMarkdownContent, t, toast]);

  // Handle share
  const handleShare = useCallback(() => {
    // TODO: Implement share modal
    console.log(`[NotebookToolbar] Share notebook ${notebookId}`);
  }, [notebookId]);

  // Handle history
  const handleHistory = useCallback(() => {
    onShowHistory?.();
  }, [onShowHistory]);

  // Handle collaborators
  const handleCollaborators = useCallback(() => {
    onShowCollaborators?.();
  }, [onShowCollaborators]);

  const handleMoreOptions = useCallback(() => {
    toast({
      title: t("more_options_title"),
      description: t("more_options_desc"),
    });
  }, [t, toast]);

  return (
    <div className="notebook-toolbar flex items-center justify-between px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left section: Save status */}
      <div className="flex items-center gap-3">
        <SaveStatusIndicator status={autoSaveStatus} />
      </div>

      {/* Right section: Actions */}
      <div className="flex items-center gap-1">
        {canCopy ? (
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            onClick={handleCopy}
            title={t("copy")}
          >
            <Copy className="w-4 h-4" />
          </button>
        ) : null}

        {onShowCollaborators ? (
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            onClick={handleCollaborators}
            title={t("collaborators")}
          >
            <Users className="w-4 h-4" />
          </button>
        ) : null}

        {onShowHistory ? (
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            onClick={handleHistory}
            title={t("history_title")}
          >
            <History className="w-4 h-4" />
          </button>
        ) : null}

        {/* Export dropdown */}
        {canExport ? (
          <Popover open={showMenu} onOpenChange={setShowMenu}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                disabled={isExporting}
                title={t("export")}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-40 p-1">
              <button
                type="button"
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted transition-colors"
                onClick={() => handleExport("markdown")}
              >
                {t("export_as_markdown")}
              </button>
              <button
                type="button"
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted transition-colors"
                onClick={() => handleExport("html")}
              >
                {t("export_as_html")}
              </button>
              <button
                type="button"
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted transition-colors"
                onClick={() => handleExport("pdf")}
              >
                {t("export_as_pdf")}
              </button>
            </PopoverContent>
          </Popover>
        ) : null}

        {/* Share button */}
        {canShare ? (
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            onClick={handleShare}
            title={t("share")}
          >
            <Share className="w-4 h-4" />
          </button>
        ) : null}

        {/* More options */}
        <button
          type="button"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          onClick={handleMoreOptions}
          title={t("more_options_title")}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default NotebookToolbar;
