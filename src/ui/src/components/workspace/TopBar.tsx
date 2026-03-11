"use client";

import * as React from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  BookOpen,
  Search,
} from "lucide-react";
import Dock from "@/components/Dock";
import CardNav from "@/components/CardNav";
import { useAuthStore } from "@/lib/stores/auth";
import { BRAND_LOGO_SMALL_SRC, BRAND_LOGO_SMALL_SRC_INVERTED } from "@/lib/constants/assets";
import { useUserAvatarSrc } from "@/lib/user-avatar";

interface TopBarProps {
  /** Project name to display */
  projectName?: string;
  /** Callback when toggling left panel */
  onToggleLeft: () => void;
  /** Callback when toggling right panel */
  onToggleRight: () => void;
  /** Whether left panel is collapsed */
  leftCollapsed: boolean;
  /** Whether right panel is collapsed */
  rightCollapsed: boolean;
}

/**
 * Logo - DeepScientist logo component
 */
function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-soft-sm bg-white flex items-center justify-center overflow-hidden border border-soft-border">
        <img
          src={BRAND_LOGO_SMALL_SRC}
          alt="DeepScientist"
          width={32}
          height={32}
          className="object-contain dark:hidden"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          draggable={false}
        />
        <img
          src={BRAND_LOGO_SMALL_SRC_INVERTED}
          alt="DeepScientist"
          width={32}
          height={32}
          className="hidden object-contain dark:block"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          draggable={false}
        />
      </div>
      <span className="font-semibold text-soft-text-primary hidden sm:inline">
        DeepScientist
      </span>
    </div>
  );
}

/**
 * UserMenu - User avatar and dropdown menu
 */
function UserMenu() {
  const { user, logout } = useAuthStore();
  const avatarSrc = useUserAvatarSrc(user);

  return (
    <div className="relative flex items-center">
      <CardNav
        className="ds-user-cardnav"
        logo={avatarSrc}
        logoAlt={user?.email || "User"}
        items={[
          {
            label: "Workspace",
            bgColor: "var(--ds-cardnav-card-1)",
            textColor: "var(--ds-cardnav-text)",
            links: [
              { label: "Projects", href: "/projects", ariaLabel: "Open projects" },
              { label: "Docs", href: "/docs", ariaLabel: "Open documentation" },
            ],
          },
          {
            label: "Account",
            bgColor: "var(--ds-cardnav-card-2)",
            textColor: "var(--ds-cardnav-text)",
            links: [
              { label: "Settings", href: "/settings", ariaLabel: "Open settings" },
              { label: "Profile", href: "/settings/profile", ariaLabel: "Open profile" },
            ],
          },
          {
            label: "Session",
            bgColor: "var(--ds-cardnav-card-3)",
            textColor: "var(--ds-cardnav-text)",
            links: [
              { label: "Sign out", ariaLabel: "Sign out", onClick: logout },
            ],
          },
        ]}
        baseColor="var(--ds-cardnav-bg)"
        menuColor="var(--ds-cardnav-text)"
        buttonBgColor="var(--ds-cardnav-cta-bg)"
        buttonTextColor="var(--ds-cardnav-cta-text)"
        showCta={false}
        topBarHeight={46}
      />
    </div>
  );
}

/**
 * TopBar - Top navigation bar with logo, project name, and controls
 *
 * Structure:
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │  [≡] [Logo] │ Project Name                      │ [🔍] [👤] [≡]     │
 * └───────────────────────────────────────────────────────────────────────┘
 */
export function TopBar({
  projectName,
  onToggleLeft,
  onToggleRight,
  leftCollapsed,
  rightCollapsed,
}: TopBarProps) {
  const handleDocs = React.useCallback(() => {
    if (typeof window === "undefined") return;
    window.open("/docs", "_blank", "noopener,noreferrer");
  }, []);

  const leftDockItems = React.useMemo(
    () => [
      {
        label: leftCollapsed ? "Show sidebar" : "Hide sidebar",
        icon: leftCollapsed ? (
          <PanelLeftOpen className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        ),
        onClick: onToggleLeft,
      },
    ],
    [leftCollapsed, onToggleLeft]
  );

  const rightDockItems = React.useMemo(
    () => [
      {
        label: "Documentation",
        icon: <BookOpen className="h-4 w-4" />,
        onClick: handleDocs,
      },
      {
        label: "Search",
        icon: <Search className="h-4 w-4" />,
        onClick: () => {},
      },
      {
        label: rightCollapsed ? "Show Copilot" : "Hide Copilot",
        icon: rightCollapsed ? (
          <PanelRightOpen className="h-4 w-4" />
        ) : (
          <PanelRightClose className="h-4 w-4" />
        ),
        onClick: onToggleRight,
      },
    ],
    [handleDocs, onToggleRight, rightCollapsed]
  );

  return (
    <div className="h-14 px-4 flex items-center justify-between bg-soft-bg-base border-b border-soft-border overflow-visible">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <div className="ds-topbar-dock-shell">
          <Dock
            items={leftDockItems}
            className="ds-topbar-dock-panel"
            panelHeight={40}
            dockHeight={64}
            baseItemSize={34}
            magnification={46}
            distance={120}
          />
        </div>

        {/* Logo */}
        <Logo />

        {/* Project Name */}
        {projectName && (
          <>
            <span className="text-soft-text-muted">/</span>
            <span className="text-sm font-medium text-soft-text-primary truncate max-w-[200px]">
              {projectName}
            </span>
          </>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <div className="ds-topbar-dock-shell">
          <Dock
            items={rightDockItems}
            className="ds-topbar-dock-panel"
            panelHeight={40}
            dockHeight={70}
            baseItemSize={34}
            magnification={48}
            distance={150}
          />
        </div>

        {/* User Menu */}
        <UserMenu />
      </div>
    </div>
  );
}

export default TopBar;
