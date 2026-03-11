"use client";

/**
 * StatusBar Component
 *
 * Bottom status bar displaying contextual information about the workspace.
 *
 * @module components/workspace/StatusBar
 */

import * as React from "react";
import { Wifi, WifiOff, GitBranch, Circle } from "lucide-react";
import { useActiveTab, useTabs } from "@/lib/stores/tabs";
import { cn } from "@/lib/utils";

interface StatusBarProps {
  /** Project name to display */
  projectName?: string;
}

/**
 * StatusItem - Individual item in the status bar
 */
interface StatusItemProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

function StatusItem({ icon, children, className, onClick }: StatusItemProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      className={cn(
        "flex items-center gap-1.5 px-2 py-0.5 text-xs",
        onClick && "hover:bg-soft-bg-elevated cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {icon}
      {children}
    </Component>
  );
}

/**
 * ConnectionStatus - Display connection status indicator
 */
function ConnectionStatus() {
  // TODO: Replace with actual connection state from a store
  const [isConnected] = React.useState(true);

  return (
    <StatusItem
      icon={
        isConnected ? (
          <Wifi className="h-3 w-3 text-green-500" />
        ) : (
          <WifiOff className="h-3 w-3 text-red-500" />
        )
      }
    >
      <span className={isConnected ? "text-green-600" : "text-red-500"}>
        {isConnected ? "Connected" : "Disconnected"}
      </span>
    </StatusItem>
  );
}

/**
 * StatusBar - Bottom status bar with contextual information
 *
 * Layout:
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │  Project Name │ Current File │ Dirty Count │         │ Branch │ Connected │
 * └───────────────────────────────────────────────────────────────────────────┘
 *  └──────────────── Left side ──────────────────┘        └── Right side ────┘
 */
export function StatusBar({ projectName }: StatusBarProps) {
  const activeTab = useActiveTab();
  const tabs = useTabs();

  // Count dirty tabs
  const dirtyCount = React.useMemo(
    () => tabs.filter((t) => t.isDirty).length,
    [tabs]
  );

  // Get current file info
  const currentFile = React.useMemo(() => {
    if (!activeTab) return null;
    if (activeTab.context.type === "file" || activeTab.context.type === "notebook") {
      return {
        name: activeTab.context.resourceName || activeTab.title,
        path: activeTab.context.resourcePath,
      };
    }
    return null;
  }, [activeTab]);

  return (
    <div className="h-6 flex items-center justify-between bg-soft-bg-base border-t border-soft-border text-soft-text-muted">
      {/* Left Section */}
      <div className="flex items-center divide-x divide-soft-border">
        {/* Project Name */}
        {projectName && (
          <StatusItem>
            <span className="font-medium text-soft-text-primary">
              {projectName}
            </span>
          </StatusItem>
        )}

        {/* Current File */}
        {currentFile && (
          <StatusItem>
            <span className="truncate max-w-[200px]">
              {currentFile.path || currentFile.name}
            </span>
          </StatusItem>
        )}

        {/* Dirty Count */}
        {dirtyCount > 0 && (
          <StatusItem icon={<Circle className="h-2 w-2 fill-soft-accent text-soft-accent" />}>
            <span>
              {dirtyCount} unsaved {dirtyCount === 1 ? "file" : "files"}
            </span>
          </StatusItem>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center divide-x divide-soft-border">
        {/* Git Branch (placeholder) */}
        <StatusItem icon={<GitBranch className="h-3 w-3" />}>
          <span>main</span>
        </StatusItem>

        {/* Connection Status */}
        <ConnectionStatus />

        {/* Version */}
        <StatusItem>
          <span>v1.0.0</span>
        </StatusItem>
      </div>
    </div>
  );
}

export default StatusBar;
