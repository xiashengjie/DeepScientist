"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import { History, RefreshCcw, Save, Undo2 } from "lucide-react";
import type { EditorInstance } from "novel";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  createNotebookCommit,
  listNotebookCommits,
  revertNotebookToCommit,
  type NotebookCommitItem,
} from "@/lib/api/notebooks";
import { useI18n } from "@/lib/i18n/useI18n";
import { diffMarkdown } from "../lib/markdown-diff";
import { getEditorMarkdown } from "../lib/markdown-utils";

function safeDate(value: string): Date | null {
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function extractPatchOps(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.ops)) return payload.ops;
  return [];
}

function commitLabel(
  commit: NotebookCommitItem,
  fallbackLabels: { copilot: string; system: string; user: string }
): string {
  if (commit.authorType === "llm") return commit.authorLabel || fallbackLabels.copilot;
  if (commit.authorType === "system") return commit.authorLabel || fallbackLabels.system;
  return commit.authorName || fallbackLabels.user;
}

export function NotebookHistoryDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notebookId: string;
  editor: EditorInstance | null;
  readonly: boolean;
}) {
  const { open, onOpenChange, notebookId, editor, readonly } = props;
  const queryClient = useQueryClient();
  const { t, language } = useI18n("notebook");
  const [selectedSeq, setSelectedSeq] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");
  const baselineMarkdownRef = useRef<string | null>(null);
  const distanceLocale = language === "zh-CN" ? zhCN : enUS;
  const authorFallbackLabels = useMemo(
    () => ({
      copilot: t("history_commit_author_copilot"),
      system: t("history_commit_author_system"),
      user: t("history_commit_author_user"),
    }),
    [t]
  );

  const commitsQuery = useQuery({
    queryKey: ["notebookCommits", notebookId],
    queryFn: async () => listNotebookCommits(notebookId, { skip: 0, limit: 50 }),
    enabled: open && Boolean(notebookId),
  });

  const commits = useMemo(
    () => commitsQuery.data?.items ?? [],
    [commitsQuery.data?.items]
  );

  useEffect(() => {
    if (!open) return;
    if (!selectedSeq && commits.length > 0) {
      setSelectedSeq(commits[0].seq);
    }
  }, [open, commits, selectedSeq]);

  useEffect(() => {
    if (!open) return;
    if (!editor) return;
    if (baselineMarkdownRef.current) return;
    const markdown = getEditorMarkdown(editor);
    baselineMarkdownRef.current = markdown;
  }, [open, editor]);

  const selected = useMemo(
    () => (selectedSeq != null ? commits.find((c) => c.seq === selectedSeq) ?? null : null),
    [commits, selectedSeq]
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editor) throw new Error("Notebook editor is not ready");
      const currentMarkdown = getEditorMarkdown(editor);
      const baseline = baselineMarkdownRef.current ?? currentMarkdown;
      const { patches } = diffMarkdown(baseline, currentMarkdown);

      const stats = patches.reduce(
        (acc, op) => {
          if (op.op === "replace") acc.replaced += 1;
          else if (op.op === "insert") acc.inserted += 1;
          else if (op.op === "delete") acc.deleted += 1;
          return acc;
        },
        { replaced: 0, inserted: 0, deleted: 0 }
      );

      const payload = await createNotebookCommit(notebookId, {
        message: message.trim() ? message.trim() : t("history_save_version_default"),
        authorType: "human",
        opStats: { ...stats, totalOps: patches.length },
        patchOps: { ops: patches },
        meta: { source: "manual-save" },
      });

      baselineMarkdownRef.current = currentMarkdown;
      return payload;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["notebookCommits", notebookId] });
    },
  });

  const revertMutation = useMutation({
    mutationFn: async (seq: number) => {
      return revertNotebookToCommit(notebookId, seq);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notebookCommits", notebookId] });
    },
  });

  const onSave = useCallback(() => {
    if (readonly) return;
    saveMutation.mutate();
  }, [readonly, saveMutation]);

  const onRevert = useCallback(
    (seq: number) => {
      if (readonly) return;
      const ok = window.confirm(t("history_revert_confirm", { seq }));
      if (!ok) return;
      revertMutation.mutate(seq);
    },
    [readonly, revertMutation, t]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden" showCloseButton>
        <div className="flex h-[70vh] flex-col">
          <div className="px-6 pt-6 pb-4 border-b dark:border-white/10">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-4 w-4" />
                {t("history_title")}
              </DialogTitle>
              <DialogDescription className="text-left">
                {t("history_desc")}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-[320px_1fr] min-h-0">
            {/* Left: list */}
            <div className="border-b md:border-b-0 md:border-r dark:border-white/10 min-h-0">
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="text-sm font-medium text-foreground/90">{t("history_commits")}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => commitsQuery.refetch()}
                  disabled={commitsQuery.isFetching}
                  title={t("history_refresh")}
                >
                  <RefreshCcw className={cn("h-4 w-4", commitsQuery.isFetching && "animate-spin")} />
                </Button>
              </div>
              <Separator />
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                  {commitsQuery.isLoading ? (
                    <div className="p-3 text-sm text-muted-foreground">{t("history_loading")}</div>
                  ) : commits.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">{t("history_empty")}</div>
                  ) : (
                    commits.map((c) => {
                      const d = safeDate(c.createdAt);
                      const subtitle = d
                        ? formatDistanceToNow(d, { addSuffix: true, locale: distanceLocale })
                        : "";
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className={cn(
                            "w-full text-left rounded-md px-3 py-2 transition-colors",
                            selectedSeq === c.seq
                              ? "bg-muted"
                              : "hover:bg-muted/60 text-foreground/90"
                          )}
                          onClick={() => setSelectedSeq(c.seq)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-medium">{t("history_commit", { seq: c.seq })}</div>
                            <div className="text-xs text-muted-foreground">{subtitle}</div>
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                            {commitLabel(c, authorFallbackLabels)} • {c.message || t("history_no_message")}
                          </div>
                          {c.opStats ? (
                            <div className="mt-1 text-[11px] text-muted-foreground">
                              {[
                                c.opStats?.replaced != null ? `R:${c.opStats.replaced}` : null,
                                c.opStats?.inserted != null ? `I:${c.opStats.inserted}` : null,
                                c.opStats?.deleted != null ? `D:${c.opStats.deleted}` : null,
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            </div>
                          ) : null}
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Right: details */}
            <div className="min-h-0 flex flex-col">
              <div className="px-4 py-3 flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-foreground/90">
                  {selected ? t("history_commit", { seq: selected.seq }) : t("history_select_commit")}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={readonly ? t("collaborators_readonly") : t("history_commit_message_placeholder")}
                    disabled={readonly}
                    className="w-64"
                  />
                  <Button
                    onClick={onSave}
                    disabled={readonly || saveMutation.isPending}
                    title={t("history_save_version")}
                  >
                    <Save className="h-4 w-4 mr-1.5" />
                    {t("history_save")}
                  </Button>
                </div>
              </div>
              <Separator />

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {!selected ? (
                    <div className="text-sm text-muted-foreground">{t("history_pick_from_list")}</div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="font-medium">{t("history_author")}:</span>{" "}
                          <span className="text-muted-foreground">
                            {commitLabel(selected, authorFallbackLabels)}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            ({selected.authorType})
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">{t("history_message")}:</span>{" "}
                          <span className="text-muted-foreground">
                            {selected.message || t("history_no_message")}
                          </span>
                        </div>
                        {selected.opStats ? (
                          <div className="text-sm">
                            <span className="font-medium">{t("history_stats")}:</span>{" "}
                            <span className="text-muted-foreground">
                              {JSON.stringify(selected.opStats)}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => onRevert(selected.seq)}
                          disabled={readonly || revertMutation.isPending}
                        >
                          <Undo2 className="h-4 w-4 mr-1.5" />
                          {t("history_revert_to_this")}
                        </Button>
                        {revertMutation.isError ? (
                          <div className="text-sm text-destructive">
                            {(revertMutation.error as any)?.message || t("history_revert_failed")}
                          </div>
                        ) : null}
                      </div>

                      <Separator />

                      <div>
                        <div className="text-sm font-medium mb-2">{t("history_patch_ops")}</div>
                        {extractPatchOps(selected.patchOps).length === 0 ? (
                          <div className="text-sm text-muted-foreground">
                            {t("history_patch_empty")}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {extractPatchOps(selected.patchOps).map((op: any, idx: number) => (
                              <div key={idx} className="rounded-md border dark:border-white/10 p-3">
                                <div className="text-xs text-muted-foreground">
                                  {op?.op || "op"} {op?.id ? `• ${op.id}` : ""}
                                </div>
                                {op?.after ? (
                                  <pre className="mt-2 text-xs whitespace-pre-wrap">{String(op.after)}</pre>
                                ) : op?.before ? (
                                  <pre className="mt-2 text-xs whitespace-pre-wrap">{String(op.before)}</pre>
                                ) : op?.content ? (
                                  <pre className="mt-2 text-xs whitespace-pre-wrap">{String(op.content)}</pre>
                                ) : op?.block?.content ? (
                                  <pre className="mt-2 text-xs whitespace-pre-wrap">{String(op.block.content)}</pre>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
