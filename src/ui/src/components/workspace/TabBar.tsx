"use client";

/**
 * TabBar Component
 *
 * Horizontal tab bar for managing open tabs with drag-and-drop reordering.
 *
 * Features:
 * - Tab selection
 * - Tab closing (click X or middle-click)
 * - Dirty indicator (unsaved changes)
 * - Pin indicator (pinned tabs appear first)
 * - Drag and drop reordering via @dnd-kit
 * - Right-click context menu
 * - Horizontal scrolling for many tabs
 * - Animated active tab indicator using framer-motion layoutId
 *
 * @module components/workspace/TabBar
 */

import * as React from "react";
import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { Plus, X } from "lucide-react";
import { useTabsStore, useActiveTab, useTabs } from "@/lib/stores/tabs";
import { useI18n } from "@/lib/i18n/useI18n";
import { cn } from "@/lib/utils";
import { SortableTab } from "./SortableTab";
import { TabContextMenu } from "./TabContextMenu";
import { ConfirmModal } from "@/components/ui/modal";

/**
 * TabBar Props
 */
export interface TabBarProps {
  /** Additional CSS classes */
  className?: string;

  /** Called when new tab button is clicked */
  onNewTab?: () => void;

  /** Whether to show the new tab button */
  showNewTabButton?: boolean;
}

/**
 * TabBar - Horizontal tab bar for managing open tabs
 */
export function TabBar({
  className,
  onNewTab,
  showNewTabButton = false,
}: TabBarProps = {}) {
  const { t } = useI18n("workspace");
  const tabs = useTabs();
  const activeTab = useActiveTab();
  const { setActiveTab, closeTab, setTabPinned, reorderTabs, resetTabs } =
    useTabsStore();

  // Context menu state
  const [contextMenuTab, setContextMenuTab] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [showCloseAllConfirm, setShowCloseAllConfirm] = useState(false);

  // Sort tabs: pinned first, then by original order
  const sortedTabs = React.useMemo(() => {
    const pinned = tabs.filter((t) => t.isPinned);
    const unpinned = tabs.filter((t) => !t.isPinned);
    return [...pinned, ...unpinned];
  }, [tabs]);

  // Configure drag sensors with activation constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance before drag starts
      },
    })
  );

  /**
   * Handle drag end event
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      const oldIndex = tabs.findIndex((t) => t.id === active.id);
      const newIndex = tabs.findIndex((t) => t.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderTabs(oldIndex, newIndex);
      }
    },
    [tabs, reorderTabs]
  );

  /**
   * Handle context menu
   */
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, tabId: string) => {
      e.preventDefault();
      setContextMenuTab(tabId);
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
    },
    []
  );

  /**
   * Close context menu
   */
  const closeContextMenu = useCallback(() => {
    setContextMenuTab(null);
  }, []);

  const handleConfirmCloseAll = useCallback(() => {
    resetTabs();
    setShowCloseAllConfirm(false);
  }, [resetTabs]);

  const closeAllDescription = tabs.some((tab) => tab.isDirty)
    ? t("tabbar_close_all_dirty_desc")
    : t("tabbar_close_all_desc");

  if (tabs.length === 0) {
    return (
      <div
        role="tablist"
        className={cn(
          "flex items-center h-9 bg-soft-bg-base border-b border-soft-border px-2",
          className
        )}
      >
        <span className="text-sm text-soft-text-secondary">{t("tabbar_no_tabs_open")}</span>
        {showNewTabButton && onNewTab && (
          <button
            className="ml-auto h-7 w-7 flex items-center justify-center rounded hover:bg-soft-bg-elevated"
            onClick={onNewTab}
            aria-label={t("tabbar_new_tab")}
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div
        role="tablist"
        className={cn(
          "group relative flex items-center bg-soft-bg-base border-b border-soft-border pr-10",
          className
        )}
      >
        {/* Tab list with drag and drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToHorizontalAxis]}
        >
          <SortableContext
            items={sortedTabs.map((t) => t.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex-1 flex items-center overflow-x-auto scrollbar-hide relative">
              {sortedTabs.map((tab) => {
                const isActive = tab.id === activeTab?.id;
                return (
                  <div
                    key={tab.id}
                    className="relative"
                    onContextMenu={(e) => handleContextMenu(e, tab.id)}
                  >
                    <SortableTab
                      tab={tab}
                      isActive={isActive}
                      onClick={() => setActiveTab(tab.id)}
                      onClose={() => closeTab(tab.id)}
                      onMiddleClick={() => closeTab(tab.id)}
                    />
                    {/* Animated active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-1 right-1 h-0.5 bg-soft-accent rounded-full"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 35,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

        {/* New tab button */}
        {showNewTabButton && onNewTab && (
          <button
            className="h-7 w-7 mx-1 flex items-center justify-center rounded hover:bg-soft-bg-elevated flex-shrink-0"
            onClick={onNewTab}
            aria-label={t("tabbar_new_tab")}
          >
            <Plus className="h-4 w-4" />
          </button>
        )}

        <button
          type="button"
          className={cn(
            "close-all-tabs-btn absolute right-2 top-1 z-10 h-6 w-6 rounded",
            "flex items-center justify-center text-soft-text-secondary",
            "bg-soft-bg-elevated/80 hover:bg-soft-bg-elevated hover:text-soft-text-primary",
            "opacity-0 pointer-events-none transition-opacity",
            "group-hover:opacity-100 group-hover:pointer-events-auto"
          )}
          onClick={() => setShowCloseAllConfirm(true)}
          aria-label={t("tabbar_close_all_tabs")}
          title={t("tabbar_close_all_tabs")}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Context menu */}
      {contextMenuTab && (
        <TabContextMenu
          tabId={contextMenuTab}
          position={contextMenuPosition}
          onClose={closeContextMenu}
        />
      )}

      <ConfirmModal
        open={showCloseAllConfirm}
        onClose={() => setShowCloseAllConfirm(false)}
        onConfirm={handleConfirmCloseAll}
        title={t("tabbar_close_all_title")}
        description={closeAllDescription}
        confirmText={t("tabbar_close_all_confirm")}
        cancelText={t("tabbar_cancel")}
        variant="danger"
      />
    </>
  );
}

export default TabBar;
