import * as React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ToastProvider } from '@/components/ui/toast'
import { ProjectShareDialog } from '@/components/features/Share/ProjectShareDialog'

const pushMock = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: (...args: unknown[]) => pushMock(...args) }),
}))

jest.mock('@/lib/stores/auth', () => ({
  useAuthStore: () => ({ user: { id: 'u1' } }),
}))

const listProjectShareLinksMock = jest.fn(async () => [
  {
    id: 'link-edit',
    project_id: 'p1',
    token: 'edit-token',
    permission: 'edit',
    allow_copy: false,
    is_active: true,
    expires_at: null,
    created_by: 'u1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    access_count: 0,
    last_accessed_at: null,
  },
  {
    id: 'link-view',
    project_id: 'p1',
    token: 'view-token',
    permission: 'view',
    allow_copy: true,
    is_active: true,
    expires_at: null,
    created_by: 'u1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    access_count: 0,
    last_accessed_at: null,
  },
])
jest.mock('@/lib/api/share', () => ({
  listProjectShareLinks: (...args: unknown[]) =>
    (listProjectShareLinksMock as any).apply(null, args),
  createProjectShareLink: jest.fn(),
  deleteProjectShareLink: jest.fn(),
  regenerateProjectShareLink: jest.fn(),
  updateProjectShareLink: jest.fn(),
}))

jest.mock('@/lib/api/projects', () => ({
  checkProjectAccess: jest.fn(async () => ({ has_access: true })),
  createProjectCopyTask: jest.fn(),
  getProjectCopyTask: jest.fn(),
  getProject: jest.fn(async () => ({ settings: {} })),
  updateProject: jest.fn(),
  listProjectMembers: jest.fn(async () => []),
}))

jest.mock('@/lib/shared-projects', () => ({
  getSharedProjects: jest.fn(() => []),
}))

function setupBrowserStubs() {
  Object.defineProperty(window, 'matchMedia', {
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? false : true,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
    configurable: true,
  })

  ;(globalThis as any).ResizeObserver =
    (globalThis as any).ResizeObserver ||
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

  ;(globalThis as any).IntersectionObserver =
    (globalThis as any).IntersectionObserver ||
    class IntersectionObserver {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    }
}

function Wrapper() {
  const [open, setOpen] = React.useState(false)
  return (
    <ToastProvider>
      <button type="button" onClick={() => setOpen(true)}>
        open
      </button>
      <ProjectShareDialog
        projectId="p1"
        open={open}
        onOpenChange={setOpen}
        canManageShare={true}
        defaultTab="share"
      />
    </ToastProvider>
  )
}

describe('ProjectShareDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupBrowserStubs()
  })

  it('opens without triggering an infinite update loop', async () => {
    const user = userEvent.setup()
    render(<Wrapper />)

    await user.click(screen.getByRole('button', { name: /open/i }))

    await waitFor(() => {
      expect(screen.getByText(/share links/i)).toBeInTheDocument()
    })

    expect(listProjectShareLinksMock).toHaveBeenCalled()
  })
})
