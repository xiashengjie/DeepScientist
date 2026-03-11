"use client";

import { useEffect } from "react";
import { Layout } from "lucide-react";
import { FloatingPanel } from "./FloatingPanel";
import { PluginRenderer } from "@/components/plugin";
import { useI18n } from "@/lib/i18n/useI18n";
import { useActiveTab, useTabsStore } from "@/lib/stores/tabs";
import { BUILTIN_PLUGINS } from "@/lib/types/plugin";

interface FloatingContentPanelProps {
  projectId: string;
}

const MARKDOWN_EXTENSIONS = [".md", ".markdown", ".mdx"];
const MARKDOWN_MIME_TYPES = new Set(["text/markdown", "text/x-markdown"]);

function isMarkdownContext(
  resourceName?: string,
  mimeType?: string,
  docKind?: unknown
): boolean {
  if (docKind === "markdown") return true;
  if (mimeType && MARKDOWN_MIME_TYPES.has(mimeType)) return true;
  if (!resourceName) return false;
  const lower = resourceName.toLowerCase();
  return MARKDOWN_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function EmptyContent() {
  const { t } = useI18n("workspace");

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center text-white/40">
        <Layout className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium mb-1">{t("floating_content_empty_title")}</p>
        <p className="text-xs">{t("floating_content_empty_desc")}</p>
      </div>
    </div>
  );
}

export function FloatingContentPanel({
  projectId,
}: FloatingContentPanelProps) {
  const { t } = useI18n("workspace");
  const activeTab = useActiveTab();
  const updateTabPlugin = useTabsStore((state) => state.updateTabPlugin);
  const shouldRedirectMarkdown =
    activeTab?.pluginId === BUILTIN_PLUGINS.PDF_VIEWER &&
    isMarkdownContext(
      activeTab.context.resourceName,
      activeTab.context.mimeType,
      activeTab.context.customData?.docKind
    );

  useEffect(() => {
    if (!activeTab || !shouldRedirectMarkdown) return;
    updateTabPlugin(activeTab.id, BUILTIN_PLUGINS.NOTEBOOK, {
      ...activeTab.context,
      mimeType: activeTab.context.mimeType ?? "text/markdown",
      customData: {
        ...(activeTab.context.customData || {}),
        docKind: "markdown",
      },
    });
  }, [activeTab, shouldRedirectMarkdown, updateTabPlugin]);

  return (
    <FloatingPanel
      id="content"
      title={activeTab?.title || t("floating_content_title")}
      icon={<Layout className="h-4 w-4" />}
      minWidth={400}
      minHeight={300}
    >
      <div className="h-full">
        {activeTab ? (
          shouldRedirectMarkdown ? (
            <div className="h-full flex items-center justify-center text-white/50">
              <span className="text-sm">{t("content_switching_markdown")}</span>
            </div>
          ) : (
            <PluginRenderer
              pluginId={activeTab.pluginId}
              context={activeTab.context}
              tabId={activeTab.id}
              projectId={projectId}
            />
          )
        ) : (
          <EmptyContent />
        )}
      </div>
    </FloatingPanel>
  );
}
