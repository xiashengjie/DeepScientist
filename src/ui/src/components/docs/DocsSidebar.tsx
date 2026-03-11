'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, FileText, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DocsDirNode, DocsNode } from '@/lib/docs/types'

function pathToHref(path: string): string {
  if (!path) return '/docs'
  return `/docs/${path
    .split('/')
    .map((s) => encodeURIComponent(s))
    .join('/')}`
}

function collectAncestorPaths(path: string): string[] {
  if (!path) return []
  const parts = path.split('/').filter(Boolean)
  const ancestors: string[] = []
  for (let i = 0; i < parts.length; i++) {
    ancestors.push(parts.slice(0, i + 1).join('/'))
  }
  return ancestors
}

function isWithinPath(current: string, nodePath: string): boolean {
  if (!nodePath) return true
  if (!current) return nodePath === ''
  return current === nodePath || current.startsWith(`${nodePath}/`)
}

interface DocsSidebarProps {
  root: DocsDirNode
  currentPath: string
  onNavigate?: () => void
}

export function DocsSidebar({ root, currentPath, onNavigate }: DocsSidebarProps) {
  const initialExpanded = useMemo(() => new Set<string>(collectAncestorPaths(currentPath)), [currentPath])
  const [expanded, setExpanded] = useState<Set<string>>(initialExpanded)

  useEffect(() => {
    setExpanded(new Set<string>(collectAncestorPaths(currentPath)))
  }, [currentPath])

  const toggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const renderNode = (node: DocsNode, depth: number) => {
    const isDir = node.type === 'dir'
    const isExpanded = isDir && expanded.has(node.path)
    const isActive = node.path === currentPath
    const isInBranch = isDir && isWithinPath(currentPath, node.path)

    const commonClass = cn(
      'flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors',
      'hover:bg-gray-100',
      isActive ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700',
      isInBranch && !isActive && 'text-gray-900'
    )

    if (isDir) {
      return (
        <div key={`${node.type}:${node.path}`} className="select-none">
          <div className="flex items-center" style={{ paddingLeft: depth * 12 }}>
            <button
              type="button"
              className={cn('mr-1 inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-gray-200/60', !node.children?.length && 'opacity-40')}
              onClick={() => toggle(node.path)}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              disabled={!node.children?.length}
            >
              <ChevronDown className={cn('h-4 w-4 transition-transform', isExpanded ? 'rotate-0' : '-rotate-90')} />
            </button>
            <Link
              href={pathToHref(node.path)}
              onClick={onNavigate}
              className={commonClass}
              style={{ flex: 1 }}
            >
              <Folder className="h-4 w-4 text-gray-500" />
              <span className="truncate">{node.name || 'Documentation'}</span>
            </Link>
          </div>
          {isExpanded && node.children?.length ? (
            <div className="mt-0.5">
              {node.children.map((child) => renderNode(child, depth + 1))}
            </div>
          ) : null}
        </div>
      )
    }

    const title = node.title || node.name
    return (
      <div key={`${node.type}:${node.path}`} className="select-none" style={{ paddingLeft: depth * 12 + 24 }}>
        <Link href={pathToHref(node.path)} onClick={onNavigate} className={commonClass}>
          <FileText className="h-4 w-4 text-gray-500" />
          <span className="truncate">{title}</span>
        </Link>
      </div>
    )
  }

  return (
    <nav className="h-full overflow-y-auto py-4 pr-2">
      <div className="space-y-0.5">
        {(root.children || []).map((node) => renderNode(node, 0))}
      </div>
    </nav>
  )
}
