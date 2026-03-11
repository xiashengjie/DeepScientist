import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Download, Eye, FileImage, FileText, FlaskConical, PencilLine, ShieldCheck, SplitSquareVertical, X } from 'lucide-react'

import { CodeDocument } from '@/components/plugins/CodeDocument'
import { MarkdownDocument } from '@/components/plugins/MarkdownDocument'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { ConfigTestPayload, ConfigValidationPayload, OpenDocumentPayload } from '@/types'

function AssetPreview({ document }: { document: OpenDocumentPayload }) {
  const assetUrl = document.asset_url
  const rendererHint = document.meta?.renderer_hint

  if (!assetUrl) {
    return (
      <div className="flex h-full min-h-[360px] items-center justify-center rounded-[28px] border border-dashed border-black/[0.08] bg-white/[0.56] px-6 py-10 text-center dark:border-white/[0.10] dark:bg-white/[0.04]">
        <div>
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-[18px] border border-black/[0.08] bg-white/[0.74] dark:border-white/[0.10] dark:bg-white/[0.04]">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-sm text-muted-foreground">This file cannot be previewed inline yet.</div>
        </div>
      </div>
    )
  }

  if (rendererHint === 'image') {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center overflow-hidden rounded-[28px] border border-black/[0.08] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.82),rgba(240,235,228,0.94))] p-5 dark:border-white/[0.10] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),rgba(24,28,34,0.98))]">
        <img src={assetUrl} alt={document.title} className="max-h-full max-w-full rounded-[22px] object-contain shadow-[0_24px_70px_-46px_rgba(17,24,39,0.40)]" />
      </div>
    )
  }

  if (rendererHint === 'pdf') {
    return (
      <div className="h-full min-h-[520px] overflow-hidden rounded-[28px] border border-black/[0.08] bg-white/[0.70] dark:border-white/[0.10] dark:bg-white/[0.04]">
        <iframe title={document.title} src={assetUrl} className="h-full min-h-[520px] w-full" />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-[360px] items-center justify-center rounded-[28px] border border-black/[0.08] bg-white/[0.56] px-6 py-10 dark:border-white/[0.10] dark:bg-white/[0.04]">
      <div className="text-center">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-[18px] border border-black/[0.08] bg-white/[0.74] dark:border-white/[0.10] dark:bg-white/[0.04]">
          <FileImage className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="text-sm text-muted-foreground">This binary file is available for direct open or download.</div>
      </div>
    </div>
  )
}

export function DocumentSheet({
  document: activeDocument,
  onClose,
  onSave,
  onValidate,
  onTest,
}: {
  document: OpenDocumentPayload | null
  onClose: () => void
  onSave: (content: string) => Promise<void>
  onValidate?: (content: string) => Promise<ConfigValidationPayload | null>
  onTest?: (content: string) => Promise<ConfigTestPayload | null>
}) {
  const [draft, setDraft] = useState('')
  const [mode, setMode] = useState<'preview' | 'edit' | 'split'>('preview')
  const [validation, setValidation] = useState<ConfigValidationPayload | null>(null)
  const [validating, setValidating] = useState(false)
  const [testResult, setTestResult] = useState<ConfigTestPayload | null>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    setDraft(activeDocument?.content ?? '')
    setValidation(null)
    setTestResult(null)
    if (!activeDocument) {
      return
    }
    const isMarkdown =
      activeDocument.meta?.renderer_hint === 'markdown' ||
      activeDocument.kind === 'markdown' ||
      activeDocument.path?.endsWith('.md')
    const isAsset =
      activeDocument.meta?.renderer_hint === 'image' ||
      activeDocument.meta?.renderer_hint === 'pdf' ||
      activeDocument.meta?.renderer_hint === 'binary'
    setMode(activeDocument.writable && !isAsset ? (isMarkdown ? 'split' : 'edit') : 'preview')
  }, [activeDocument])

  useEffect(() => {
    if (!validation) {
      return
    }
    setValidation(null)
  }, [draft])

  useEffect(() => {
    if (!testResult) {
      return
    }
    setTestResult(null)
  }, [draft])

  const isMarkdown = useMemo(
    () =>
      activeDocument?.meta?.renderer_hint === 'markdown' ||
      activeDocument?.kind === 'markdown' ||
      activeDocument?.path?.endsWith('.md'),
    [activeDocument]
  )
  const isConfigDocument = activeDocument?.source_scope === 'config'
  const helpMarkdown = typeof activeDocument?.meta?.help_markdown === 'string' ? activeDocument.meta.help_markdown : ''
  const systemTestable = Boolean(activeDocument?.meta?.system_testable)
  const rendererHint = activeDocument?.meta?.renderer_hint
  const isAssetDocument = rendererHint === 'image' || rendererHint === 'pdf' || rendererHint === 'binary'
  const canEdit = Boolean(activeDocument?.writable) && !isAssetDocument
  const highlightLine = activeDocument?.meta?.highlight_line
  const highlightQuery = activeDocument?.meta?.highlight_query

  if (!activeDocument) {
    return null
  }

  const preview = isAssetDocument ? (
    <AssetPreview document={activeDocument} />
  ) : isMarkdown ? (
    <MarkdownDocument
      content={draft}
      questId={activeDocument.quest_id}
      documentId={activeDocument.document_id}
    />
  ) : (
    <CodeDocument
      content={draft}
      path={activeDocument.path}
      highlightLine={highlightLine}
      highlightQuery={highlightQuery}
    />
  )

  const editor = (
    <Textarea
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      className="h-full min-h-full resize-none rounded-[28px] bg-white/[0.65] font-mono text-[13px] leading-6 dark:bg-white/[0.04]"
      readOnly={!canEdit}
    />
  )

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(17,20,24,0.28)] backdrop-blur-md">
      <div className="flex h-full w-full max-w-5xl flex-col border-l border-black/10 bg-[linear-gradient(180deg,rgba(250,247,241,0.96),rgba(244,239,233,0.98))] px-4 py-4 dark:border-white/[0.12] dark:bg-[linear-gradient(180deg,rgba(14,16,20,0.96),rgba(11,12,16,0.98))] sm:rounded-l-[32px] sm:px-6 sm:py-5">
        <div className="mb-4 flex items-center justify-between gap-4 rounded-[28px] border border-black/[0.08] bg-white/[0.60] px-4 py-4 backdrop-blur-xl dark:border-white/[0.12] dark:bg-white/[0.04]">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <div className="text-lg font-semibold">{activeDocument.title}</div>
              <Badge>{activeDocument.kind}</Badge>
              <Badge>{canEdit ? 'editable' : 'read only'}</Badge>
              {activeDocument.source_scope ? <Badge>{activeDocument.source_scope}</Badge> : null}
              {activeDocument.mime_type ? <Badge>{activeDocument.mime_type}</Badge> : null}
              {typeof highlightLine === 'number' ? <Badge>{`line ${highlightLine}`}</Badge> : null}
              {highlightQuery ? <Badge>{`match: ${highlightQuery}`}</Badge> : null}
            </div>
            <div className="text-xs text-muted-foreground">{activeDocument.path || activeDocument.document_id}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={mode === 'preview' ? 'default' : 'secondary'} size="sm" onClick={() => setMode('preview')}>
              <Eye className="h-3.5 w-3.5" />
              Preview
            </Button>
            {canEdit ? (
              <Button variant={mode === 'edit' ? 'default' : 'secondary'} size="sm" onClick={() => setMode('edit')}>
                <PencilLine className="h-3.5 w-3.5" />
                Edit
              </Button>
            ) : null}
            {canEdit ? (
              <Button variant={mode === 'split' ? 'default' : 'secondary'} size="sm" onClick={() => setMode('split')}>
                <SplitSquareVertical className="h-3.5 w-3.5" />
                Split
              </Button>
            ) : null}
            {activeDocument.asset_url ? (
              <Button variant="secondary" size="sm" onClick={() => window.open(activeDocument.asset_url, '_blank', 'noopener,noreferrer')}>
                <Download className="h-3.5 w-3.5" />
                Open
              </Button>
            ) : null}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          {isConfigDocument && helpMarkdown ? (
            <div className="mb-4">
              <div className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Guide</div>
              <div className="rounded-[28px] border border-black/[0.08] bg-white/[0.60] p-4 backdrop-blur-xl dark:border-white/[0.12] dark:bg-white/[0.04]">
                <div className="h-[260px]">
                  <MarkdownDocument content={helpMarkdown} />
                </div>
              </div>
            </div>
          ) : null}
          {mode === 'split' && canEdit ? (
            <div className="grid h-full min-h-0 gap-4 lg:grid-cols-2">
              <div className="min-h-0">{preview}</div>
              <div className="min-h-0">{editor}</div>
            </div>
          ) : mode === 'edit' && canEdit ? (
            <div className="h-full min-h-0">{editor}</div>
          ) : (
            <div className="h-full min-h-0">{preview}</div>
          )}
        </div>
        {validation ? (
          <div className="mt-4 space-y-3 rounded-[26px] border border-black/[0.08] bg-white/[0.60] px-4 py-4 backdrop-blur-xl dark:border-white/[0.12] dark:bg-white/[0.04]">
            <div className="flex items-center gap-2 text-sm font-medium">
              {validation.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
              <span>{validation.ok ? 'Configuration looks valid.' : 'Configuration needs attention.'}</span>
            </div>
            {validation.errors.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Errors</div>
                <div className="flex flex-col gap-2">
                  {validation.errors.map((item) => (
                    <div
                      key={item}
                      className="rounded-[18px] border border-rose-500/20 bg-rose-500/8 px-3 py-2 text-sm text-rose-700 dark:text-rose-300"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {validation.warnings.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Warnings</div>
                <div className="flex flex-col gap-2">
                  {validation.warnings.map((item) => (
                    <div
                      key={item}
                      className="rounded-[18px] border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-sm text-amber-700 dark:text-amber-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        {testResult ? (
          <div className="mt-4 space-y-3 rounded-[26px] border border-black/[0.08] bg-white/[0.60] px-4 py-4 backdrop-blur-xl dark:border-white/[0.12] dark:bg-white/[0.04]">
            <div className="flex items-center gap-2 text-sm font-medium">
              {testResult.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
              <span>{testResult.summary}</span>
            </div>
            {testResult.items.length > 0 ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {testResult.items.map((item) => (
                  <div key={item.name} className="rounded-[20px] border border-black/[0.08] bg-black/[0.03] px-4 py-3 dark:border-white/[0.12] dark:bg-white/[0.04]">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">{item.name}</div>
                      <Badge>{item.ok ? 'ready' : 'needs work'}</Badge>
                    </div>
                    {item.details ? (
                      <div className="mb-2 text-xs leading-6 text-muted-foreground">
                        {Object.entries(item.details)
                          .filter(([, value]) => value !== null && value !== undefined && value !== '')
                          .slice(0, 6)
                          .map(([key, value]) => (
                            <div key={key}>
                              {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </div>
                          ))}
                      </div>
                    ) : null}
                    {item.errors.length > 0 ? (
                      <div className="mb-2 space-y-1">
                        {item.errors.map((error) => (
                          <div key={error} className="rounded-[14px] bg-rose-500/8 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
                            {error}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {item.warnings.length > 0 ? (
                      <div className="space-y-1">
                        {item.warnings.map((warning) => (
                          <div key={warning} className="rounded-[14px] bg-amber-500/8 px-3 py-2 text-xs text-amber-700 dark:text-amber-200">
                            {warning}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="mt-4 flex items-center justify-end gap-3 rounded-[26px] border border-black/[0.08] bg-white/[0.60] px-4 py-3 backdrop-blur-xl dark:border-white/[0.12] dark:bg-white/[0.04]">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {canEdit && isConfigDocument && onValidate ? (
            <Button
              variant="secondary"
              onClick={async () => {
                setValidating(true)
                try {
                  setValidation(await onValidate(draft))
                } finally {
                  setValidating(false)
                }
              }}
            >
              <ShieldCheck className="h-4 w-4" />
              {validating ? 'Validating…' : 'Validate'}
            </Button>
          ) : null}
          {canEdit && isConfigDocument && systemTestable && onTest ? (
            <Button
              variant="secondary"
              onClick={async () => {
                setTesting(true)
                try {
                  setTestResult(await onTest(draft))
                } finally {
                  setTesting(false)
                }
              }}
            >
              <FlaskConical className="h-4 w-4" />
              {testing ? 'Testing…' : 'Test'}
            </Button>
          ) : null}
          {canEdit ? (
            <Button onClick={async () => await onSave(draft)}>
              Save
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
