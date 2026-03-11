/**
 * Workspace Components
 *
 * Main workspace layout and related components.
 *
 * @module components/workspace
 */

// ============================================================
// New Floating Layout Components
// ============================================================

// Main floating layout
export { FloatingWorkspaceLayout } from "./FloatingWorkspaceLayout";
export { TitleBar } from "./TitleBar";
export { NewStatusBar } from "./NewStatusBar";

// Floating panels
export { FloatingPanel } from "./floating/FloatingPanel";
export { FloatingFilePanel } from "./floating/FloatingFilePanel";
export { FloatingContentPanel } from "./floating/FloatingContentPanel";
export { FloatingChatPanel } from "./floating/FloatingChatPanel";
export { SnapGuides } from "./floating/SnapGuides";

// Shared components
export { TrafficLights } from "./shared/TrafficLights";
export { GlassCard } from "./shared/GlassCard";
export { PanelHeader } from "./shared/PanelHeader";

// Backgrounds
export { MacOSGradient } from "./backgrounds/MacOSGradient";

// ============================================================
// Legacy Components (for backward compatibility)
// ============================================================

export { WorkspaceLayout } from "./WorkspaceLayout";
export { LeftSidebar } from "./LeftSidebar";
export { ContentArea } from "./ContentArea";
export { ChatPanel } from "./ChatPanel";
export { TopBar } from "./TopBar";
export { StatusBar } from "./StatusBar";
export { TabBar } from "./TabBar";
export { SortableTab } from "./SortableTab";
export { TabContextMenu } from "./TabContextMenu";
export { EmptyWorkspace } from "./EmptyWorkspace";
