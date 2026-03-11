import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'

import { DocsPage } from '@/components/docs/DocsPage'
import { SettingsPage, type ConfigDocumentName } from '@/components/settings/SettingsPage'
import { I18nProvider, useI18n } from '@/lib/i18n'
import { LandingPage } from '@/pages/LandingPage'
import { ProjectWorkspacePage } from '@/pages/ProjectWorkspacePage'

function normalizeConfigName(value?: string): ConfigDocumentName | null {
  if (value && ['config', 'runners', 'connectors', 'plugins', 'mcp_servers'].includes(value)) {
    return value as ConfigDocumentName
  }
  return null
}

function DocsRoutePage() {
  const navigate = useNavigate()
  const { locale } = useI18n()

  return (
    <DocsPage
      locale={locale}
      onOpenSettings={(name?: ConfigDocumentName) => navigate('/settings', { state: { configName: name } })}
    />
  )
}

function SettingsRoutePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { configName } = useParams()
  const { locale } = useI18n()
  const state = (location.state as { configName?: ConfigDocumentName | null } | null) ?? null
  const routeConfigName = normalizeConfigName(configName)

  return (
    <SettingsPage
      requestedConfigName={routeConfigName ?? state?.configName ?? null}
      onRequestedConfigConsumed={() => navigate('.', { replace: true, state: null })}
      runtimeAddress={window.location.origin}
      locale={locale}
    />
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="/projects" element={<Navigate to="/" replace />} />
      <Route path="/projects/:projectId" element={<ProjectWorkspacePage />} />
      <Route path="/pricing" element={<Navigate to="/docs" replace />} />
      <Route path="/blog" element={<Navigate to="/docs" replace />} />
      <Route path="/terms" element={<Navigate to="/docs" replace />} />
      <Route path="/refund" element={<Navigate to="/docs" replace />} />
      <Route path="/privacy" element={<Navigate to="/docs" replace />} />
      <Route path="/docs" element={<DocsRoutePage />} />
      <Route path="/settings" element={<SettingsRoutePage />} />
      <Route path="/settings/:configName" element={<SettingsRoutePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function resolveRouterBasename(): string {
  if (typeof window === 'undefined') {
    return '/'
  }
  return window.location.pathname.startsWith('/ui/') ? '/ui' : '/'
}

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter basename={resolveRouterBasename()}>
        <AppRoutes />
      </BrowserRouter>
    </I18nProvider>
  )
}
