"use client";

import { useRef, useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageList, type MessageListHandle } from "@/components/MessageList";
import { useI18n } from "@/lib/i18n/useI18n";
import { cn } from "@/lib/utils";
import { FloatingPanel } from "./FloatingPanel";
import { useActiveTab } from "@/lib/stores/tabs";

interface FloatingChatPanelProps {
  projectId: string;
}

export function FloatingChatPanel({ projectId }: FloatingChatPanelProps) {
  const { t } = useI18n("workspace");
  const activeTab = useActiveTab();
  const [message, setMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const listRef = useRef<MessageListHandle | null>(null);

  const contextInfo =
    activeTab?.context.type === "file" ||
    activeTab?.context.type === "notebook"
      ? {
          type: activeTab.context.type,
          name: activeTab.context.resourceName || activeTab.title,
        }
      : null;

  const handleSend = () => {
    if (!message.trim()) return;
    void listRef.current?.sendMessage(message.trim());
    setMessage("");
  };

  return (
    <FloatingPanel
      id="chat"
      title={t("floating_chat_title")}
      icon={<Bot className="h-4 w-4" />}
      minWidth={300}
      minHeight={400}
      headerTone="light"
      className="rounded-xl border border-gray-200 bg-white/95 shadow-[0_18px_48px_rgba(15,23,42,0.12)]"
    >
      <div className="relative flex h-full flex-col bg-white text-slate-900">
        {/* Context Display */}
        {contextInfo && (
          <div className="border-b border-gray-200 bg-gray-50/80 px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Sparkles className="h-3 w-3 text-slate-400" />
              <span>
                {t("floating_chat_context", {
                  type:
                    contextInfo.type === "file"
                      ? t("floating_chat_context_file")
                      : t("floating_chat_context_notebook"),
                  name: contextInfo.name,
                })}
              </span>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 min-h-0">
          <MessageList
            ref={listRef}
            projectId={projectId}
            className="h-full"
            contentClassName="pb-36"
            onStreamingChange={setIsStreaming}
          />
        </div>

        {/* Input */}
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
          <Card className="pointer-events-auto w-full max-w-[720px] rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="flex items-end gap-3 p-3">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={t("floating_chat_placeholder")}
                rows={2}
                className={cn(
                  "min-h-[44px] resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-200",
                  "placeholder:text-slate-400"
                )}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!message.trim() || isStreaming}
                className="h-10 w-10 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </FloatingPanel>
  );
}
