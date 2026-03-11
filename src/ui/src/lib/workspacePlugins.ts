import type { OpenDocumentPayload } from '@/types'

export const BUILTIN_PLUGINS = {
  LAB: '@ds/plugin-lab',
  SEARCH: '@ds/plugin-search',
  ANALYSIS: '@ds/plugin-analysis',
  CLI: '@ds/plugin-cli',
  AUTOFIGURE: '@ds/plugin-autofigure',
  SETTINGS: '@ds/plugin-settings',
} as const

export const DOCUMENT_PLUGIN_ID = '@ds/plugin-document' as const

export type BuiltinPluginId = (typeof BUILTIN_PLUGINS)[keyof typeof BUILTIN_PLUGINS]

export type WorkspaceTabContext = {
  query?: string
  view?: string
  requestedConfig?: string | null
}

type WorkspaceBaseTab = {
  id: string
  title: string
  context?: WorkspaceTabContext
}

export type BuiltinWorkspaceTab = WorkspaceBaseTab & {
  kind: 'builtin'
  pluginId: BuiltinPluginId
}

export type DocumentWorkspaceTab = WorkspaceBaseTab & {
  kind: 'document'
  pluginId: typeof DOCUMENT_PLUGIN_ID
  document: OpenDocumentPayload
}

export type WorkspaceTab = BuiltinWorkspaceTab | DocumentWorkspaceTab

const DEFAULT_TITLES: Record<BuiltinPluginId, string> = {
  [BUILTIN_PLUGINS.LAB]: 'Lab',
  [BUILTIN_PLUGINS.SEARCH]: 'Search',
  [BUILTIN_PLUGINS.ANALYSIS]: 'Analysis',
  [BUILTIN_PLUGINS.CLI]: 'CLI',
  [BUILTIN_PLUGINS.AUTOFIGURE]: 'AutoFigure',
  [BUILTIN_PLUGINS.SETTINGS]: 'Settings',
}

export function getBuiltinPluginTitle(pluginId: BuiltinPluginId) {
  return DEFAULT_TITLES[pluginId]
}

function buildTabId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createWorkspaceTab(
  pluginId: BuiltinPluginId,
  title = getBuiltinPluginTitle(pluginId),
  context?: WorkspaceTabContext,
  id = buildTabId()
): BuiltinWorkspaceTab {
  return {
    id,
    kind: 'builtin',
    pluginId,
    title,
    context,
  }
}

function documentTitle(document: OpenDocumentPayload) {
  if (document.title?.trim()) {
    return document.title.trim()
  }
  if (document.path?.trim()) {
    const parts = document.path.replace(/\\/g, '/').split('/')
    return parts[parts.length - 1] || document.document_id
  }
  return document.document_id
}

export function createDocumentWorkspaceTab(
  document: OpenDocumentPayload,
  options?: {
    id?: string
    context?: WorkspaceTabContext
  }
): DocumentWorkspaceTab {
  return {
    id: options?.id || buildTabId(),
    kind: 'document',
    pluginId: DOCUMENT_PLUGIN_ID,
    title: documentTitle(document),
    context: options?.context,
    document,
  }
}

export function isDocumentWorkspaceTab(tab: WorkspaceTab): tab is DocumentWorkspaceTab {
  return tab.kind === 'document'
}

export function documentTabKey(document: OpenDocumentPayload) {
  return `${document.source_scope || document.scope || 'quest'}:${document.document_id}`
}
