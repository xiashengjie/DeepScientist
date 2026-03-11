"use client";

import { Wifi, GitBranch, Circle } from "lucide-react";
import { GlassCard } from "./shared/GlassCard";
import { useActiveTab, useTabs } from "@/lib/stores/tabs";

interface NewStatusBarProps {
  projectName?: string;
}

export function NewStatusBar({ projectName }: NewStatusBarProps) {
  const activeTab = useActiveTab();
  const tabs = useTabs();
  const dirtyCount = tabs.filter((t) => t.isDirty).length;

  const currentFile =
    activeTab?.context.type === "file" ||
    activeTab?.context.type === "notebook"
      ? activeTab.context.resourceName || activeTab.title
      : null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pt-0">
      <GlassCard variant="subtle" className="h-8 flex items-center px-4 text-xs">
        <div className="flex items-center gap-4 flex-1">
          {projectName && (
            <span className="text-white/70 font-medium">{projectName}</span>
          )}
          {currentFile && (
            <span className="text-white/50 truncate max-w-[200px]">
              {currentFile}
            </span>
          )}
          {dirtyCount > 0 && (
            <span className="flex items-center gap-1 text-white/50">
              <Circle className="h-2 w-2 fill-indigo-400 text-indigo-400" />
              {dirtyCount} unsaved
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-white/50">
            <GitBranch className="h-3 w-3" />
            main
          </span>
          <span className="flex items-center gap-1 text-green-400">
            <Wifi className="h-3 w-3" />
            Connected
          </span>
          <span className="text-white/30">v1.0.0</span>
        </div>
      </GlassCard>
    </div>
  );
}
