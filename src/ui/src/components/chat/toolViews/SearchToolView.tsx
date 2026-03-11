'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Search as SearchIcon, Sparkles } from 'lucide-react'
import type { ToolViewProps } from './types'
import { DsToolFrame, DsToolPill, DsToolSection } from './DsToolFrame'

function buildFaviconUrl(value?: string) {
  if (!value) return ''
  try {
    const url =
      value.startsWith('http://') || value.startsWith('https://')
        ? new URL(value)
        : new URL(`https://${value}`)
    return `${url.origin}/favicon.ico`
  } catch {
    return ''
  }
}

export function SearchToolView({ toolContent, panelMode }: ToolViewProps) {
  const showHeader = panelMode == null
  const autoExpandResults = !showHeader
  const [resultsExpanded, setResultsExpanded] = useState(autoExpandResults)
  const error = toolContent.content?.error as string | undefined
  const results = (toolContent.content?.results as Array<{
    title?: string
    link?: string
    url?: string
    source?: string
    snippet?: string
  }> | undefined) ?? []
  const queryFromContent = toolContent.content?.query
  const args =
    toolContent.args && typeof toolContent.args === 'object' && !Array.isArray(toolContent.args)
      ? (toolContent.args as Record<string, unknown>)
      : undefined
  const query =
    (typeof queryFromContent === 'string' && queryFromContent) ||
    (typeof args?.query === 'string' && args.query) ||
    (typeof args?.q === 'string' && args.q) ||
    (typeof args?.text === 'string' && args.text) ||
    ''
  const count = results.length
  const isSearching = toolContent.status === 'calling'
  const queryVariants =
    (Array.isArray(toolContent.content?.queries)
      ? toolContent.content.queries
      : [])?.map((entry) => String(entry).trim()).filter(Boolean) ?? []
  const searchSummary =
    typeof toolContent.content?.summary === 'string'
      ? toolContent.content.summary
      : typeof toolContent.content?.text === 'string'
        ? toolContent.content.text
        : typeof toolContent.content?.output === 'string'
          ? toolContent.content.output
          : ''
  const dedupedQueries = Array.from(new Set([query, ...queryVariants].filter(Boolean)))

  useEffect(() => {
    setResultsExpanded(autoExpandResults)
  }, [autoExpandResults, toolContent.tool_call_id])

  return (
    <div className="flex h-full min-h-0 flex-col">
      {showHeader ? (
        <div className="flex h-[36px] items-center border-b border-[var(--border-main)] bg-[var(--background-gray-main)] px-3 shadow-[inset_0px_1px_0px_0px_#FFFFFF]">
          <div className="flex-1 text-center text-xs font-medium text-[var(--text-tertiary)]">
            Search
          </div>
        </div>
      ) : null}
      <div className="relative flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[720px] flex-col gap-3 px-4 py-3">
          <DsToolFrame
            title={isSearching ? 'DeepScientist is searching the web...' : 'DeepScientist searched the web.'}
            subtitle={
              query
                ? `Primary query: ${query}`
                : 'This run records the exact search queries that Codex issued.'
            }
            accent="blue"
            meta={
              <>
                <DsToolPill>{isSearching ? 'running' : 'completed'}</DsToolPill>
                {count > 0 ? <DsToolPill tone="success">{count} results</DsToolPill> : null}
                {dedupedQueries.length > 0 ? <DsToolPill tone="muted">{dedupedQueries.length} queries</DsToolPill> : null}
              </>
            }
          >
            {error ? (
              <div className="ds-tool-error-banner" role="status">
                <AlertTriangle className="ds-tool-error-icon" />
                <span>{error}</span>
              </div>
            ) : null}

            {dedupedQueries.length > 0 ? (
              <DsToolSection title="Issued queries">
                <div className="flex flex-wrap gap-1.5">
                  {dedupedQueries.map((entry) => (
                    <DsToolPill key={entry} tone={entry === query ? 'default' : 'muted'}>
                      {entry}
                    </DsToolPill>
                  ))}
                </div>
              </DsToolSection>
            ) : null}

            {count > 0 && !autoExpandResults ? (
              <button
                type="button"
                onClick={() => setResultsExpanded((value) => !value)}
                className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border-light)] bg-[rgba(255,255,255,0.82)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition hover:bg-[var(--background-white-main)]"
              >
                {resultsExpanded ? 'Hide results' : `Show results (${count})`}
              </button>
            ) : null}

            {results.length > 0 && resultsExpanded ? (
              <DsToolSection title={`Results (${count})`}>
                <div className="space-y-3">
                  {results.map((result, index) => {
                    const link = result.link || result.url || result.source || ''
                    const title = result.title || link || 'Untitled result'
                    const faviconUrl = buildFaviconUrl(link)
                    return (
                      <div
                        key={`${link || index}`}
                        className="rounded-[14px] border border-[var(--border-light)] bg-[rgba(255,255,255,0.76)] px-3 py-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-[2px] flex h-8 w-8 items-center justify-center rounded-[10px] bg-[rgba(121,145,182,0.10)]">
                            {faviconUrl ? (
                              <img
                                src={faviconUrl}
                                alt=""
                                className="h-4 w-4 rounded-[4px]"
                                onError={(event) => {
                                  event.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <SearchIcon className="h-4 w-4 text-[#6382ad]" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            {link ? (
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-[12px] font-semibold text-[var(--text-primary)] hover:underline"
                              >
                                {title}
                              </a>
                            ) : (
                              <div className="block text-[12px] font-semibold text-[var(--text-primary)]">
                                {title}
                              </div>
                            )}
                            {result.source ? (
                              <div className="mt-1 text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                                {result.source}
                              </div>
                            ) : null}
                            {result.snippet ? (
                              <div className="mt-2 text-[12px] leading-6 text-[var(--text-secondary)]">
                                {result.snippet}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </DsToolSection>
            ) : null}

            {!error && results.length === 0 ? (
              <DsToolSection title="Search trace">
                <div className="flex items-start gap-2 text-[12px] leading-6 text-[var(--text-secondary)]">
                  <Sparkles className="mt-0.5 h-4 w-4 text-[#6382ad]" />
                  <span>
                    {isSearching
                      ? 'Codex is still issuing search queries.'
                      : dedupedQueries.length > 0
                        ? 'This run persisted the exact search queries, but the upstream runtime did not expose result cards for this call.'
                        : 'No structured search results were returned for this call.'}
                  </span>
                </div>
                {searchSummary ? (
                  <div className="mt-3 rounded-[12px] bg-[rgba(255,255,255,0.72)] px-3 py-3 text-[12px] leading-6 text-[var(--text-secondary)]">
                    {searchSummary}
                  </div>
                ) : null}
              </DsToolSection>
            ) : null}
          </DsToolFrame>
        </div>
      </div>
    </div>
  )
}

export default SearchToolView
