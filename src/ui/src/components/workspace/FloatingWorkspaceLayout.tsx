"use client";

import { useEffect } from "react";
import { TitleBar } from "./TitleBar";
import { NewStatusBar } from "./NewStatusBar";
import { FloatingFilePanel } from "./floating/FloatingFilePanel";
import { FloatingContentPanel } from "./floating/FloatingContentPanel";
import { FloatingChatPanel } from "./floating/FloatingChatPanel";
import { useFloatingPanelsStore } from "@/lib/stores/floating-panels";
import { cn } from "@/lib/utils";
import { Noise } from "@/components/react-bits";

interface FloatingWorkspaceLayoutProps {
  projectId: string;
  projectName?: string;
  children?: React.ReactNode;
}

export function FloatingWorkspaceLayout({
  projectId,
  projectName,
}: FloatingWorkspaceLayoutProps) {
  const { resetLayout } = useFloatingPanelsStore();

  // Reset layout on window resize (optional - could be made smarter)
  useEffect(() => {
    const handleResize = () => {
      // Could add responsive layout logic here
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [resetLayout]);

  return (
    <div className="relative isolate h-screen w-screen overflow-hidden bg-[#ABA9A5] dark:bg-[#0B0C0E]">
      {/* Atmosphere background (shared with /projects) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className={cn(
            "absolute -top-40 -left-40 h-[560px] w-[560px] rounded-full blur-3xl animate-blob",
            "bg-[radial-gradient(circle_at_center,rgba(143,163,184,0.16),transparent_72%)]",
            "dark:bg-[radial-gradient(circle_at_center,rgba(143,163,184,0.16),transparent_72%)]"
          )}
        />
        <div
          className={cn(
            "absolute top-10 -right-52 h-[640px] w-[640px] rounded-full blur-3xl animate-blob",
            "bg-[radial-gradient(circle_at_center,rgba(47,52,55,0.08),transparent_72%)]",
            "dark:bg-[radial-gradient(circle_at_center,rgba(47,52,55,0.10),transparent_72%)]"
          )}
          style={{ animationDelay: "1.5s" }}
        />
        <Noise size={260} className="opacity-[0.04] dark:opacity-[0.05]" />
      </div>

      {/* Fixed Title Bar */}
      <TitleBar projectId={projectId} projectName={projectName} />

      {/* Floating Panels */}
      <FloatingFilePanel projectId={projectId} />
      <FloatingContentPanel projectId={projectId} />
      <FloatingChatPanel projectId={projectId} />

      {/* Fixed Status Bar */}
      <NewStatusBar projectName={projectName} />
    </div>
  );
}

export default FloatingWorkspaceLayout;
