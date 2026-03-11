"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, Users, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  inviteNotebookCollaborator,
  listNotebookCollaborators,
  removeNotebookCollaborator,
  type NotebookCollaborator,
  type NotebookCollaboratorRole,
} from "@/lib/api/notebooks";
import { searchUsers } from "@/lib/api/users";
import { useI18n } from "@/lib/i18n/useI18n";

function initials(name: string): string {
  const value = (name || "").trim();
  if (!value) return "?";
  const parts = value.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

export function NotebookCollaboratorsDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notebookId: string;
  readonly: boolean;
}) {
  const { open, onOpenChange, notebookId, readonly } = props;
  const queryClient = useQueryClient();
  const { t } = useI18n("notebook");

  const [query, setQuery] = useState("");
  const [role, setRole] = useState<NotebookCollaboratorRole>("editor");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userResults, setUserResults] = useState<Array<{ id: string; username: string; email: string }>>([]);
  const [searching, setSearching] = useState(false);

  const collaboratorsQuery = useQuery({
    queryKey: ["notebookCollaborators", notebookId],
    queryFn: async () => listNotebookCollaborators(notebookId),
    enabled: open && Boolean(notebookId),
  });

  const collaborators: NotebookCollaborator[] = collaboratorsQuery.data ?? [];

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) throw new Error(t("collaborators_select_user_first"));
      return inviteNotebookCollaborator(notebookId, { userId: selectedUserId, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notebookCollaborators", notebookId] });
      setSelectedUserId(null);
      setQuery("");
      setUserResults([]);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      await removeNotebookCollaborator(notebookId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notebookCollaborators", notebookId] });
    },
  });

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      setUserResults([]);
      setSelectedUserId(null);
      return;
    }
    const handle = window.setTimeout(async () => {
      try {
        setSearching(true);
        const items = await searchUsers(q, 10);
        setUserResults(items);
        if (items.length === 1) setSelectedUserId(items[0].id);
      } catch (e) {
        setUserResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [open, query]);

  const selectedUser = useMemo(
    () => userResults.find((u) => u.id === selectedUserId) ?? null,
    [userResults, selectedUserId]
  );

  const onInvite = useCallback(() => {
    if (readonly) return;
    inviteMutation.mutate();
  }, [readonly, inviteMutation]);

  const onRemove = useCallback(
    (userId: string, name: string) => {
      if (readonly) return;
      const ok = window.confirm(t("collaborators_remove_confirm", { name }));
      if (!ok) return;
      removeMutation.mutate(userId);
    },
    [readonly, removeMutation, t]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden" showCloseButton>
        <div className="flex h-[70vh] flex-col">
          <div className="px-6 pt-6 pb-4 border-b dark:border-white/10">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t("collaborators")}
              </DialogTitle>
              <DialogDescription className="text-left">
                {t("collaborators_desc")}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={readonly ? t("collaborators_readonly") : t("collaborators_search_placeholder")}
                  disabled={readonly}
                  className="pl-9"
                />
                {query.trim() ? (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
                    onClick={() => {
                      setQuery("");
                      setSelectedUserId(null);
                      setUserResults([]);
                    }}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                ) : null}
              </div>

              <Select
                value={role}
                onValueChange={(v) => setRole(v as NotebookCollaboratorRole)}
                disabled={readonly}
              >
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder={t("collaborators_role")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">{t("collaborators_role_viewer")}</SelectItem>
                  <SelectItem value="editor">{t("collaborators_role_editor")}</SelectItem>
                  <SelectItem value="owner">{t("collaborators_role_owner")}</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={onInvite} disabled={readonly || !selectedUserId || inviteMutation.isPending}>
                <UserPlus className="h-4 w-4 mr-1.5" />
                {t("collaborators_invite")}
              </Button>
            </div>

            {searching ? (
              <div className="text-sm text-muted-foreground">{t("collaborators_searching")}</div>
            ) : userResults.length > 0 ? (
              <div className="rounded-md border dark:border-white/10 overflow-hidden">
                <div className="bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  {t("collaborators_search_results")}
                </div>
                <Separator />
                <div className="max-h-36 overflow-auto">
                  {userResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors",
                        selectedUserId === u.id && "bg-muted"
                      )}
                      onClick={() => setSelectedUserId(u.id)}
                    >
                      <div className="font-medium">{u.username}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : query.trim() ? (
              <div className="text-sm text-muted-foreground">{t("collaborators_no_users")}</div>
            ) : null}

            {inviteMutation.isError ? (
              <div className="text-sm text-destructive">
                {(inviteMutation.error as any)?.message || t("collaborators_invite_failed")}
              </div>
            ) : null}

            {selectedUser ? (
              <div className="text-xs text-muted-foreground">
                {t("collaborators_selected")}:{" "}
                <span className="text-foreground/90">{selectedUser.username}</span> ({selectedUser.email})
              </div>
            ) : null}
          </div>

          <Separator />

          <div className="flex-1 min-h-0">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="text-sm font-medium text-foreground/90">{t("collaborators_current")}</div>
              <div className="text-xs text-muted-foreground">
                {t("collaborators_total", { count: collaborators.length })}
              </div>
            </div>
            <Separator />
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {collaboratorsQuery.isLoading ? (
                  <div className="p-3 text-sm text-muted-foreground">{t("collaborators_loading")}</div>
                ) : collaborators.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">{t("collaborators_empty")}</div>
                ) : (
                  collaborators.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-8 w-8">
                          {c.userAvatar ? <AvatarImage src={c.userAvatar} alt={c.userName} /> : null}
                          <AvatarFallback>{initials(c.userName)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{c.userName}</div>
                          <div className="text-xs text-muted-foreground truncate">{c.userEmail}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">{c.role}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={readonly || removeMutation.isPending}
                          onClick={() => onRemove(c.userId, c.userName)}
                          title={t("collaborators_remove")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
