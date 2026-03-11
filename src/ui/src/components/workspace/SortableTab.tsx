"use client";

/**
 * SortableTab Component
 *
 * A single draggable tab in the TabBar.
 * Uses @dnd-kit for drag-and-drop functionality.
 *
 * @module components/workspace/SortableTab
 */

import { forwardRef, type MouseEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, Pin, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tab } from "@/lib/types/tab";
import { useWorkspaceSurfaceStore } from "@/lib/stores/workspace-surface";
import {
  getWorkspaceBadgeClassName,
  getWorkspaceBadgeLabel,
  getWorkspaceBadgeTokens,
} from "@/lib/workspace/content-meta";
import { useI18n } from "@/lib/i18n/useI18n";

/**
 * SortableTab Props
 */
export interface SortableTabProps {
  /** Tab data */
  tab: Tab;

  /** Whether this tab is currently active */
  isActive: boolean;

  /** Called when tab is clicked */
  onClick: () => void;

  /** Called when close button is clicked */
  onClose: () => void;

  /** Called when middle mouse button is clicked (close tab) */
  onMiddleClick?: () => void;

  /** Render custom icon (optional) */
  renderIcon?: () => React.ReactNode;
}

/**
 * Get icon for tab based on pluginId or context
 */
function getTabIcon(tab: Tab): React.ReactNode {
  // TODO: Implement icon resolution based on pluginId or file type
  // For now, return null and let the default styling handle it
  return null;
}

/**
 * SortableTab Component
 *
 * Renders a single tab that can be dragged and dropped.
 *
 * Features:
 * - Drag and drop reordering
 * - Visual feedback for active state
 * - Dirty indicator
 * - Pin indicator
 * - Close button (hidden for pinned tabs)
 * - Middle-click to close
 */
export const SortableTab = forwardRef<HTMLDivElement, SortableTabProps>(
  function SortableTab(
    { tab, isActive, onClick, onClose, onMiddleClick, renderIcon },
    ref
  ) {
    const { t } = useI18n("workspace");
    const viewState = useWorkspaceSurfaceStore((state) => state.tabState[tab.id]);
    const badgeTokens = getWorkspaceBadgeTokens(tab, viewState).slice(0, isActive ? 3 : 1);
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: tab.id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    /**
     * Handle mouse events
     */
    const handleMouseDown = (e: MouseEvent) => {
      // Middle click - close tab
      if (e.button === 1 && onMiddleClick) {
        e.preventDefault();
        onMiddleClick();
      }
    };

    const handleAuxClick = (e: MouseEvent) => {
      // Middle click - close tab (backup handler)
      if (e.button === 1 && onMiddleClick) {
        e.preventDefault();
        onMiddleClick();
      }
    };

    const handleCloseClick = (e: MouseEvent) => {
      e.stopPropagation();
      onClose();
    };

    return (
      <div
        ref={(node) => {
          setNodeRef(node);
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          // Base styles
          "group flex items-center gap-1.5 px-3 h-8 border-r cursor-pointer min-w-0",
          "hover:bg-background/50 transition-colors select-none",
          // Active state
          isActive && "bg-background border-b-2 border-b-primary",
          // Dragging state
          isDragging && "opacity-50 z-50"
        )}
        onClick={onClick}
        onMouseDown={handleMouseDown}
        onAuxClick={handleAuxClick}
        data-tab-id={tab.id}
        data-active={isActive}
        data-pinned={tab.isPinned}
        data-dirty={tab.isDirty}
        role="tab"
        aria-selected={isActive}
        tabIndex={isActive ? 0 : -1}
      >
        {/* Pinned indicator */}
        {tab.isPinned && (
          <Pin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        )}

        {/* Tab icon */}
        {renderIcon ? (
          renderIcon()
        ) : (
          getTabIcon(tab) && (
            <span className="flex-shrink-0">{getTabIcon(tab)}</span>
          )
        )}

        {/* Tab title */}
        <span className="max-w-[120px] truncate text-sm">{tab.title}</span>

        {badgeTokens.length > 0 ? (
          <div className="flex items-center gap-1 min-w-0">
            {badgeTokens.map((token) => (
              <span
                key={token}
                className={cn(
                  "shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-medium leading-none",
                  getWorkspaceBadgeClassName(token),
                  !isActive && token !== "quote" && "px-1.5"
                )}
                title={getWorkspaceBadgeLabel(token, t)}
                aria-label={getWorkspaceBadgeLabel(token, t)}
              >
                {isActive
                  ? getWorkspaceBadgeLabel(token, t)
                  : getWorkspaceBadgeLabel(token, t).slice(0, 3)}
              </span>
            ))}
            {typeof viewState?.pageNumber === "number" && viewState.pageNumber > 0 && isActive ? (
              <span
                className="shrink-0 rounded-full border border-black/10 bg-black/[0.035] px-1.5 py-0.5 text-[9px] font-medium leading-none text-muted-foreground dark:border-white/10 dark:bg-white/[0.05]"
                title={t("tab_badge_page", { page: viewState.pageNumber })}
                aria-label={t("tab_badge_page", { page: viewState.pageNumber })}
              >
                p.{viewState.pageNumber}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Dirty indicator */}
        {tab.isDirty && (
          <Circle className="h-2 w-2 fill-current text-primary flex-shrink-0" />
        )}

        {/* Close button (hidden for pinned tabs) */}
        {!tab.isPinned && (
          <button
            className={cn(
              "ml-1 p-0.5 rounded hover:bg-muted",
              "opacity-0 group-hover:opacity-100 transition-opacity",
              // Always show for dirty tabs
              tab.isDirty && "opacity-100"
            )}
            onClick={handleCloseClick}
            aria-label={t('tab_close_named', { name: tab.title })}
            title={t('tab_close_named', { name: tab.title })}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }
);

export default SortableTab;
