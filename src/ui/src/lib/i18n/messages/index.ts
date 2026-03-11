import type { UILanguage } from '@/lib/i18n/types'
import { autofigureEditMessages } from '@/lib/i18n/messages/autofigure_edit'
import { commonMessages } from '@/lib/i18n/messages/common'
import { pointsMessages } from '@/lib/i18n/messages/points'
import { projectsMessages } from '@/lib/i18n/messages/projects'
import { reviewMessages } from '@/lib/i18n/messages/review'
import { rebuttalMessages } from '@/lib/i18n/messages/rebuttal'
import { settingsMessages } from '@/lib/i18n/messages/settings'
import { labMessages } from '@/lib/i18n/messages/lab'
import { latexMessages } from '@/lib/i18n/messages/latex'
import { workspaceMessages } from '@/lib/i18n/messages/workspace'
import { searchMessages } from '@/lib/i18n/messages/search'
import { markdownViewerMessages } from '@/lib/i18n/messages/markdown_viewer'
import { notebookMessages } from '@/lib/i18n/messages/notebook'
import { pdfViewerMessages } from '@/lib/i18n/messages/pdf_viewer'
import { aiManusMessages } from '@/lib/i18n/messages/ai_manus'
import { cliMessages } from '@/lib/i18n/messages/cli'
import { docViewerMessages } from '@/lib/i18n/messages/doc_viewer'
import { codeViewerMessages } from '@/lib/i18n/messages/code_viewer'

export type I18nNamespace =
  | 'common'
  | 'projects'
  | 'review'
  | 'rebuttal'
  | 'autofigure_edit'
  | 'settings'
  | 'points'
  | 'lab'
  | 'latex'
  | 'workspace'
  | 'search'
  | 'markdown_viewer'
  | 'notebook'
  | 'pdf_viewer'
  | 'ai_manus'
  | 'cli'
  | 'doc_viewer'
  | 'code_viewer'

export type I18nMessages = Partial<Record<UILanguage, Record<string, string>>>

export const I18N_MESSAGES: Record<I18nNamespace, I18nMessages> = {
  common: commonMessages,
  points: pointsMessages,
  projects: projectsMessages,
  review: reviewMessages,
  rebuttal: rebuttalMessages,
  autofigure_edit: autofigureEditMessages,
  settings: settingsMessages,
  lab: labMessages,
  latex: latexMessages,
  workspace: workspaceMessages,
  search: searchMessages,
  markdown_viewer: markdownViewerMessages,
  notebook: notebookMessages,
  pdf_viewer: pdfViewerMessages,
  ai_manus: aiManusMessages,
  cli: cliMessages,
  doc_viewer: docViewerMessages,
  code_viewer: codeViewerMessages,
}
