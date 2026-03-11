'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { LabQuestNodeTrace } from '@/lib/api/lab'

const formatStateLabel = (value?: string | null) => {
  const normalized = String(value || '')
    .trim()
    .replace(/[_-]+/g, ' ')
  if (!normalized) return 'N/A'
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase())
}

const prettyJson = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function MetaCard({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-[14px] border border-[var(--lab-border)] bg-[var(--lab-background)] px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--lab-text-secondary)]">
        {label}
      </div>
      <div className="mt-1 text-sm text-[var(--lab-text-primary)]">{value}</div>
    </div>
  )
}

export default function LabNodeTraceDetail({
  trace,
  isLoading,
  payloadJson,
  payloadTruncated,
}: {
  trace?: LabQuestNodeTrace | null
  isLoading?: boolean
  payloadJson?: Record<string, unknown> | null
  payloadTruncated?: boolean | null
}) {
  if (isLoading && !trace) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-[18px]" />
        <Skeleton className="h-20 w-full rounded-[18px]" />
        <Skeleton className="h-32 w-full rounded-[18px]" />
      </div>
    )
  }

  if (!trace) {
    return (
      <div className="rounded-[18px] border border-[var(--lab-border)] bg-[var(--lab-surface)] px-4 py-4 text-sm text-[var(--lab-text-secondary)]">
        No trace is attached to this node yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[18px] border border-[var(--lab-border)] bg-[var(--lab-surface)] px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{formatStateLabel(trace.selection_type)}</Badge>
          {trace.stage_title ? <Badge variant="outline">{trace.stage_title}</Badge> : null}
          {trace.status ? <Badge variant="outline">{formatStateLabel(trace.status)}</Badge> : null}
        </div>
        <div className="mt-3 text-sm font-semibold text-[var(--lab-text-primary)]">{trace.title}</div>
        <div className="mt-1 text-xs leading-5 text-[var(--lab-text-secondary)]">
          {trace.summary || 'No normalized summary is available for this node.'}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <MetaCard label="Branch" value={trace.branch_name || 'N/A'} />
        <MetaCard label="Stage" value={trace.stage_title || 'N/A'} />
        <MetaCard label="Actions" value={trace.counts?.actions ?? trace.actions.length} />
        <MetaCard label="Runs" value={(trace.run_ids ?? []).length || 'N/A'} />
        <MetaCard label="Worktree" value={trace.worktree_rel_path || 'N/A'} />
        <MetaCard label="Updated" value={trace.updated_at || 'N/A'} />
      </div>

      {payloadJson ? (
        <div className="rounded-[18px] border border-[var(--lab-border)] bg-[var(--lab-surface)] px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--lab-text-secondary)]">
              Event Payload
            </div>
            {payloadTruncated ? <Badge variant="outline">Truncated</Badge> : null}
          </div>
          <pre className="mt-3 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-[14px] bg-[var(--lab-background)] p-3 text-[11px] leading-5 text-[var(--lab-text-primary)]">
            {prettyJson(payloadJson)}
          </pre>
        </div>
      ) : null}

      <div className="rounded-[18px] border border-[var(--lab-border)] bg-[var(--lab-surface)] px-4 py-4">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--lab-text-secondary)]">
          Trace Actions
        </div>
        <div className="mt-3 space-y-3">
          {trace.actions.length ? (
            trace.actions.map((action) => (
              <div
                key={action.action_id}
                className="rounded-[14px] border border-[var(--lab-border)] bg-[var(--lab-background)] px-3 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold text-[var(--lab-text-primary)]">
                    {action.title || action.tool_name || action.raw_event_type || action.kind || action.action_id}
                  </div>
                  {action.kind ? <Badge variant="outline">{formatStateLabel(action.kind)}</Badge> : null}
                  {action.status ? <Badge variant="outline">{formatStateLabel(action.status)}</Badge> : null}
                </div>
                <div className="mt-1 text-[11px] text-[var(--lab-text-secondary)]">
                  {action.created_at || 'N/A'}
                </div>
                {action.summary ? (
                  <div className="mt-2 text-xs leading-5 text-[var(--lab-text-secondary)]">{action.summary}</div>
                ) : null}
                {action.tool_name ? (
                  <div className="mt-2 text-xs text-[var(--lab-text-secondary)]">
                    Tool: <span className="font-semibold text-[var(--lab-text-primary)]">{action.tool_name}</span>
                  </div>
                ) : null}
                {action.args ? (
                  <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap rounded-[12px] bg-[rgba(15,23,42,0.04)] p-2 text-[11px] leading-5 text-[var(--lab-text-primary)]">
                    {action.args}
                  </pre>
                ) : null}
                {action.output ? (
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-[12px] bg-[rgba(15,23,42,0.04)] p-2 text-[11px] leading-5 text-[var(--lab-text-primary)]">
                    {action.output}
                  </pre>
                ) : null}
              </div>
            ))
          ) : (
            <div className="text-sm text-[var(--lab-text-secondary)]">No action records yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
