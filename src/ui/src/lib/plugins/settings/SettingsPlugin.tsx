"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Monitor, Moon, RefreshCw, Save, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useProject, projectKeys } from "@/lib/hooks/useProjects";
import { useI18n } from "@/lib/i18n/useI18n";
import { client } from "@/lib/api";
import { useThemeStore, type Theme } from "@/lib/stores/theme";
import type { PluginComponentProps } from "@/lib/types/plugin";
import type { OpenDocumentPayload, QuestSummary, SessionPayload } from "@/types";
import { cn } from "@/lib/utils";

const ACTIVE_ANCHOR_OPTIONS = [
  "scout",
  "baseline",
  "idea",
  "experiment",
  "analysis-campaign",
  "write",
  "finalize",
  "decision",
] as const;

const RUNNER_OPTIONS = ["codex"] as const;

const themeOptions: Array<{
  value: Theme;
  labelKey: string;
  descriptionKey: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: "light",
    labelKey: "theme_light_label",
    descriptionKey: "theme_light_desc",
    icon: Sun,
  },
  {
    value: "dark",
    labelKey: "theme_dark_label",
    descriptionKey: "theme_dark_desc",
    icon: Moon,
  },
  {
    value: "system",
    labelKey: "theme_system_label",
    descriptionKey: "theme_system_desc",
    icon: Monitor,
  },
];

function extractErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    try {
      const parsed = JSON.parse(error.message) as { message?: string };
      if (typeof parsed?.message === "string" && parsed.message.trim()) {
        return parsed.message;
      }
    } catch {
      return error.message;
    }
  }
  return fallback;
}

function formatTimestamp(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatMetric(metric: QuestSummary["summary"] extends { latest_metric?: infer T } ? T : never) {
  if (!metric || typeof metric !== "object") return "—";
  const key = typeof metric.key === "string" && metric.key.trim() ? metric.key.trim() : "metric";
  const value = metric.value;
  if (value === undefined || value === null || value === "") return key;
  return `${key}: ${String(value)}`;
}

function markdownPreview(content?: string, maxLength = 360) {
  const normalized = String(content || "")
    .replace(/^---[\s\S]*?---\n?/m, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`{1,3}/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/[*_>-]/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function latestBashSummary(session: Record<string, unknown> | null | undefined) {
  if (!session || typeof session !== "object") return "—";
  const command = typeof session.command === "string" ? session.command.trim() : "";
  const status = typeof session.status === "string" ? session.status.trim() : "";
  if (command && status) return `${status} · ${command}`;
  return command || status || "—";
}

function sectionCardClassName() {
  return "min-w-0 overflow-hidden rounded-[28px] border border-border bg-card/90 p-5 shadow-sm backdrop-blur";
}

const settingsSelectTriggerClassName =
  "bg-white text-slate-900 border-black/10 shadow-sm hover:bg-white focus:ring-black/10 focus:ring-offset-0 dark:bg-white dark:text-slate-900 dark:border-black/10";
const settingsSelectContentClassName =
  "bg-white text-slate-900 border-black/10 shadow-xl dark:bg-white dark:text-slate-900 dark:border-black/10";

function SectionCard({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={sectionCardClassName()}>
      <div className="mb-4 flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{children}</div>;
}

function InfoRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="grid gap-1 rounded-2xl border border-border/80 bg-background/60 px-3 py-3">
      <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      <div className={cn("min-w-0 break-words text-sm text-foreground", mono && "font-mono text-[12px]")}>{value}</div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-background/60 px-3 py-3">
      <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

export default function SettingsPlugin({ context, setDirty, setTitle }: PluginComponentProps) {
  const { t } = useI18n("settings");
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { theme, resolvedTheme, setTheme } = useThemeStore();

  React.useEffect(() => {
    setTitle(t("plugin_title"));
  }, [setTitle, t]);

  const customData = context.customData as { projectId?: unknown; readOnly?: unknown } | undefined;
  const projectId = typeof customData?.projectId === "string" ? customData.projectId : undefined;
  const readOnlyMode = Boolean(customData?.readOnly);

  const { data: project } = useProject(projectId, {
    enabled: Boolean(projectId) && !readOnlyMode,
  });

  const sessionQueryKey = React.useMemo(
    () => ["quest-settings", projectId, "session"] as const,
    [projectId]
  );
  const documentQueryKey = React.useCallback(
    (documentId: string) => ["quest-settings", projectId, "document", documentId] as const,
    [projectId]
  );

  const sessionQuery = useQuery({
    queryKey: sessionQueryKey,
    queryFn: () => client.session(projectId as string),
    enabled: Boolean(projectId),
  });
  const briefQuery = useQuery({
    queryKey: documentQueryKey("brief.md"),
    queryFn: () => client.openDocument(projectId as string, "brief.md"),
    enabled: Boolean(projectId),
  });
  const planQuery = useQuery({
    queryKey: documentQueryKey("plan.md"),
    queryFn: () => client.openDocument(projectId as string, "plan.md"),
    enabled: Boolean(projectId),
  });
  const summaryQuery = useQuery({
    queryKey: documentQueryKey("SUMMARY.md"),
    queryFn: () => client.openDocument(projectId as string, "SUMMARY.md"),
    enabled: Boolean(projectId),
  });

  const snapshot = sessionQuery.data?.snapshot as (SessionPayload["snapshot"] & Record<string, unknown>) | undefined;

  const [titleDraft, setTitleDraft] = React.useState("");
  const [activeAnchorDraft, setActiveAnchorDraft] = React.useState<(typeof ACTIVE_ANCHOR_OPTIONS)[number]>("baseline");
  const [defaultRunnerDraft, setDefaultRunnerDraft] = React.useState<(typeof RUNNER_OPTIONS)[number]>("codex");
  const [briefDraft, setBriefDraft] = React.useState("");
  const [planDraft, setPlanDraft] = React.useState("");
  const [identitySaving, setIdentitySaving] = React.useState(false);
  const [briefSaving, setBriefSaving] = React.useState(false);
  const [planSaving, setPlanSaving] = React.useState(false);

  React.useEffect(() => {
    if (!snapshot) return;
    setTitleDraft(typeof snapshot.title === "string" ? snapshot.title : "");
    setActiveAnchorDraft(
      ACTIVE_ANCHOR_OPTIONS.includes((snapshot.active_anchor as (typeof ACTIVE_ANCHOR_OPTIONS)[number]) || "baseline")
        ? (snapshot.active_anchor as (typeof ACTIVE_ANCHOR_OPTIONS)[number])
        : "baseline"
    );
    setDefaultRunnerDraft(
      RUNNER_OPTIONS.includes((snapshot.runner as (typeof RUNNER_OPTIONS)[number]) || "codex")
        ? (snapshot.runner as (typeof RUNNER_OPTIONS)[number])
        : "codex"
    );
  }, [snapshot?.active_anchor, snapshot?.runner, snapshot?.title]);

  React.useEffect(() => {
    setBriefDraft(briefQuery.data?.content ?? "");
  }, [briefQuery.data?.content, briefQuery.data?.revision]);

  React.useEffect(() => {
    setPlanDraft(planQuery.data?.content ?? "");
  }, [planQuery.data?.content, planQuery.data?.revision]);

  const identityDirty =
    Boolean(snapshot) &&
    (titleDraft.trim() !== String(snapshot?.title || "").trim() ||
      activeAnchorDraft !== String(snapshot?.active_anchor || "baseline") ||
      defaultRunnerDraft !== String(snapshot?.runner || "codex"));
  const briefDirty = briefDraft !== (briefQuery.data?.content ?? "");
  const planDirty = planDraft !== (planQuery.data?.content ?? "");

  React.useEffect(() => {
    setDirty(identityDirty || briefDirty || planDirty);
  }, [briefDirty, identityDirty, planDirty, setDirty]);

  const refreshQuestData = React.useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: sessionQueryKey }),
      queryClient.invalidateQueries({ queryKey: documentQueryKey("brief.md") }),
      queryClient.invalidateQueries({ queryKey: documentQueryKey("plan.md") }),
      queryClient.invalidateQueries({ queryKey: documentQueryKey("SUMMARY.md") }),
      projectId ? queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) }) : Promise.resolve(),
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() }),
    ]);
  }, [documentQueryKey, projectId, queryClient, sessionQueryKey]);

  const handleSaveIdentity = React.useCallback(async () => {
    if (!projectId || readOnlyMode) return;
    setIdentitySaving(true);
    try {
      const payload = await client.updateQuestSettings(projectId, {
        title: titleDraft.trim(),
        active_anchor: activeAnchorDraft,
        default_runner: defaultRunnerDraft,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: sessionQueryKey }),
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) }),
        queryClient.invalidateQueries({ queryKey: projectKeys.lists() }),
      ]);
      setTitleDraft(payload.snapshot.title || titleDraft.trim());
      addToast({
        type: "success",
        title: t("identity_saved_title"),
        description: t("identity_saved_desc"),
      });
    } catch (error) {
      addToast({
        type: "error",
        title: t("save_failed_title"),
        description: extractErrorMessage(error, t("save_failed_fallback")),
      });
    } finally {
      setIdentitySaving(false);
    }
  }, [
    activeAnchorDraft,
    addToast,
    defaultRunnerDraft,
    projectId,
    queryClient,
    readOnlyMode,
    sessionQueryKey,
    t,
    titleDraft,
  ]);

  const handleSaveDocument = React.useCallback(
    async (
      documentId: "brief.md" | "plan.md",
      draft: string,
      current: OpenDocumentPayload | undefined,
      setSaving: React.Dispatch<React.SetStateAction<boolean>>,
      setDraft: React.Dispatch<React.SetStateAction<string>>,
      successTitle: string,
      successDescription: string
    ) => {
      if (!projectId || readOnlyMode || !current) return;
      setSaving(true);
      try {
        const result = await client.saveDocument(projectId, documentId, draft, current.revision);
        if (!result.ok || !result.updated_payload) {
          if (result.updated_payload) {
            queryClient.setQueryData(documentQueryKey(documentId), result.updated_payload);
            setDraft(result.updated_payload.content);
          }
          throw new Error(result.message || t("save_failed_fallback"));
        }
        queryClient.setQueryData(documentQueryKey(documentId), result.updated_payload);
        setDraft(result.updated_payload.content);
        addToast({
          type: "success",
          title: successTitle,
          description: successDescription,
        });
      } catch (error) {
        addToast({
          type: "error",
          title: t("save_failed_title"),
          description: extractErrorMessage(error, t("save_failed_fallback")),
        });
      } finally {
        setSaving(false);
      }
    },
    [addToast, documentQueryKey, projectId, queryClient, readOnlyMode, t]
  );

  const overallLatestBash = snapshot?.summary?.latest_bash_session as Record<string, unknown> | null | undefined;
  const summaryPreview = markdownPreview(summaryQuery.data?.content);

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className={cn(sectionCardClassName(), "max-w-xl text-center")}>
          <h1 className="text-lg font-semibold text-foreground">{t("plugin_title")}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("quest_unavailable_desc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto min-w-0 max-w-[1440px] px-1 pb-8">
        <div className="mb-6 min-w-0">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("plugin_title")}</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{t("plugin_description")}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {readOnlyMode ? (
                <span className="rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                  {t("read_only_badge")}
                </span>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void refreshQuestData();
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("refresh")}
              </Button>
            </div>
          </div>
        </div>

        {sessionQuery.isLoading && !snapshot ? (
          <div className={cn(sectionCardClassName(), "flex items-center gap-3 text-sm text-muted-foreground")}>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("loading")}
          </div>
        ) : null}

        {sessionQuery.error ? (
          <div className={cn(sectionCardClassName(), "text-sm text-destructive")}>
            {extractErrorMessage(sessionQuery.error, t("quest_load_failed"))}
          </div>
        ) : null}

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.42fr)_minmax(320px,0.95fr)]">
          <div className="min-w-0 space-y-6">
            <SectionCard
              title={t("quest_identity_title")}
              description={t("quest_identity_desc")}
              actions={
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!identityDirty || identitySaving}
                    onClick={() => {
                      setTitleDraft(typeof snapshot?.title === "string" ? snapshot.title : "");
                      setActiveAnchorDraft(
                        ACTIVE_ANCHOR_OPTIONS.includes(
                          (snapshot?.active_anchor as (typeof ACTIVE_ANCHOR_OPTIONS)[number]) || "baseline"
                        )
                          ? (snapshot?.active_anchor as (typeof ACTIVE_ANCHOR_OPTIONS)[number])
                          : "baseline"
                      );
                      setDefaultRunnerDraft(
                        RUNNER_OPTIONS.includes((snapshot?.runner as (typeof RUNNER_OPTIONS)[number]) || "codex")
                          ? (snapshot?.runner as (typeof RUNNER_OPTIONS)[number])
                          : "codex"
                      );
                    }}
                  >
                    {t("reset")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      void handleSaveIdentity();
                    }}
                    disabled={!identityDirty || identitySaving || readOnlyMode || !titleDraft.trim()}
                  >
                    {identitySaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {identitySaving ? t("saving") : t("save")}
                  </Button>
                </div>
              }
            >
              <div className="grid min-w-0 gap-4 lg:grid-cols-2">
                <div className="min-w-0">
                  <FieldLabel>{t("project_name_label")}</FieldLabel>
                  <Input
                    value={titleDraft}
                    onChange={(event) => setTitleDraft(event.target.value)}
                    disabled={readOnlyMode}
                    placeholder={t("project_name_placeholder")}
                  />
                </div>

                <div className="min-w-0">
                  <FieldLabel>{t("active_anchor_label")}</FieldLabel>
                  <Select
                    value={activeAnchorDraft}
                    onValueChange={(value) => setActiveAnchorDraft(value as (typeof ACTIVE_ANCHOR_OPTIONS)[number])}
                    disabled={readOnlyMode}
                  >
                    <SelectTrigger className={settingsSelectTriggerClassName}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={settingsSelectContentClassName}>
                      {ACTIVE_ANCHOR_OPTIONS.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-0">
                  <FieldLabel>{t("default_runner_label")}</FieldLabel>
                  <Select
                    value={defaultRunnerDraft}
                    onValueChange={(value) => setDefaultRunnerDraft(value as (typeof RUNNER_OPTIONS)[number])}
                    disabled={readOnlyMode}
                  >
                    <SelectTrigger className={settingsSelectTriggerClassName}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={settingsSelectContentClassName}>
                      {RUNNER_OPTIONS.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-0 rounded-2xl border border-border/80 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                  {t("identity_runtime_note")}
                </div>
              </div>

              <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
                <InfoRow label={t("quest_id_label")} value={snapshot?.quest_id || projectId} mono />
                <InfoRow label={t("quest_root_label")} value={snapshot?.quest_root || "—"} mono />
                <InfoRow label={t("branch_label")} value={snapshot?.branch || "—"} mono />
                <InfoRow label={t("head_label")} value={snapshot?.head || "—"} mono />
              </div>
            </SectionCard>

            <SectionCard
              title={t("research_brief_title")}
              description={t("research_brief_desc")}
              actions={
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!briefDirty || briefSaving}
                    onClick={() => setBriefDraft(briefQuery.data?.content ?? "")}
                  >
                    {t("reset")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!briefDirty || briefSaving || readOnlyMode || briefQuery.isLoading}
                    onClick={() => {
                      void handleSaveDocument(
                        "brief.md",
                        briefDraft,
                        briefQuery.data,
                        setBriefSaving,
                        setBriefDraft,
                        t("brief_saved_title"),
                        t("brief_saved_desc")
                      );
                    }}
                  >
                    {briefSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {briefSaving ? t("saving") : t("save")}
                  </Button>
                </div>
              }
            >
              <Textarea
                value={briefDraft}
                onChange={(event) => setBriefDraft(event.target.value)}
                disabled={readOnlyMode || briefQuery.isLoading}
                className="min-h-[260px] resize-y bg-background/70"
              />
            </SectionCard>

            <SectionCard
              title={t("execution_plan_title")}
              description={t("execution_plan_desc")}
              actions={
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!planDirty || planSaving}
                    onClick={() => setPlanDraft(planQuery.data?.content ?? "")}
                  >
                    {t("reset")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!planDirty || planSaving || readOnlyMode || planQuery.isLoading}
                    onClick={() => {
                      void handleSaveDocument(
                        "plan.md",
                        planDraft,
                        planQuery.data,
                        setPlanSaving,
                        setPlanDraft,
                        t("plan_saved_title"),
                        t("plan_saved_desc")
                      );
                    }}
                  >
                    {planSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {planSaving ? t("saving") : t("save")}
                  </Button>
                </div>
              }
            >
              <Textarea
                value={planDraft}
                onChange={(event) => setPlanDraft(event.target.value)}
                disabled={readOnlyMode || planQuery.isLoading}
                className="min-h-[240px] resize-y bg-background/70"
              />
            </SectionCard>

            <SectionCard title={t("appearance_title")} description={t("appearance_desc")}>
              <div className="grid min-w-0 gap-3 sm:grid-cols-3">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const selected = theme === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value)}
                      className={cn(
                        "min-w-0 rounded-2xl border p-4 text-left transition-colors",
                        selected
                          ? "border-[var(--brand)] bg-[var(--brand-subtle)]"
                          : "border-border bg-background/70 hover:bg-accent/40"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground">{t(option.labelKey)}</div>
                          <div className="text-xs leading-5 text-muted-foreground">{t(option.descriptionKey)}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                {t("resolved_theme")}: <span className="font-mono text-foreground">{resolvedTheme}</span>
              </div>
            </SectionCard>
          </div>

          <div className="min-w-0 space-y-6">
            <SectionCard title={t("overall_title")} description={t("overall_desc")}>
              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                <MetricTile label={t("status_label")} value={snapshot?.display_status || snapshot?.status || "—"} />
                <MetricTile label={t("latest_metric_label")} value={formatMetric(snapshot?.summary?.latest_metric)} />
                <MetricTile label={t("pending_decisions_label")} value={String(snapshot?.counts?.pending_decision_count ?? 0)} />
                <MetricTile label={t("bash_running_label")} value={String(snapshot?.counts?.bash_running_count ?? 0)} />
                <MetricTile label={t("active_run_label")} value={snapshot?.active_run_id || "—"} />
                <MetricTile label={t("updated_at_label")} value={formatTimestamp(snapshot?.updated_at)} />
              </div>

              <div className="mt-4 rounded-2xl border border-border/80 bg-background/60 px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{t("status_line_label")}</div>
                <div className="mt-1 break-words text-sm leading-6 text-foreground">
                  {snapshot?.summary?.status_line || "—"}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-border/80 bg-background/60 px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{t("latest_bash_label")}</div>
                <div className="mt-1 break-words font-mono text-[12px] leading-6 text-foreground">
                  {latestBashSummary(overallLatestBash)}
                </div>
              </div>
            </SectionCard>

            <SectionCard title={t("core_state_title")} description={t("core_state_desc")}>
              <div className="grid min-w-0 gap-3">
                <InfoRow label={t("active_anchor_label")} value={snapshot?.active_anchor || "—"} mono />
                <InfoRow label={t("default_runner_label")} value={snapshot?.runner || "—"} mono />
                <InfoRow label={t("baseline_label")} value={snapshot?.active_baseline_id || "—"} mono />
                <InfoRow label={t("baseline_variant_label")} value={snapshot?.active_baseline_variant_id || "—"} mono />
                <InfoRow label={t("memory_cards_label")} value={String(snapshot?.counts?.memory_cards ?? 0)} />
                <InfoRow label={t("artifact_count_label")} value={String(snapshot?.artifact_count ?? snapshot?.counts?.artifacts ?? 0)} />
                <InfoRow label={t("analysis_runs_label")} value={String(snapshot?.counts?.analysis_run_count ?? 0)} />
                <InfoRow label={t("history_count_label")} value={String(snapshot?.history_count ?? 0)} />
              </div>
            </SectionCard>

            <SectionCard title={t("summary_preview_title")} description={t("summary_preview_desc")}>
              <div className="rounded-2xl border border-border/80 bg-background/60 px-4 py-4">
                <div className="mb-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">SUMMARY.md</div>
                <div className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground/90">
                  {summaryQuery.isLoading && !summaryPreview ? t("loading") : summaryPreview || t("summary_preview_empty")}
                </div>
              </div>

              <div className="mt-4 text-xs leading-5 text-muted-foreground">
                {project?.description ? project.description : t("summary_preview_note")}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}
