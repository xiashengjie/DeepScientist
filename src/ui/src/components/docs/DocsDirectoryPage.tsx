'use client'

import Link from 'next/link'
import { Folder, FileText } from 'lucide-react'
import type { DocsDirNode, DocsFileNode } from '@/lib/docs/types'

function pathToHref(path: string): string {
  if (!path) return '/docs'
  return `/docs/${path
    .split('/')
    .map((s) => encodeURIComponent(s))
    .join('/')}`
}

function countPages(node: DocsDirNode): number {
  let count = 0
  for (const child of node.children || []) {
    if (child.type === 'file') count += 1
    else count += countPages(child)
  }
  return count
}

export function DocsDirectoryPage({ node }: { node: DocsDirNode }) {
  const children = node.children || []
  const dirs = children.filter((c) => c.type === 'dir') as DocsDirNode[]
  const files = children.filter((c) => c.type === 'file') as DocsFileNode[]

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
        {node.name || 'Documentation'}
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        Select a page from the sidebar, or choose from the sections below.
      </p>

      {dirs.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-sm font-medium text-gray-900">Sections</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {dirs.map((dir) => (
              <Link
                key={dir.path}
                href={pathToHref(dir.path)}
                className="group flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
              >
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-700 group-hover:bg-gray-200/70">
                  <Folder className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-gray-900">{dir.name}</div>
                  <div className="mt-0.5 text-xs text-gray-500">{countPages(dir)} pages</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {files.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-sm font-medium text-gray-900">Pages</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {files.map((file) => (
              <Link
                key={file.path}
                href={pathToHref(file.path)}
                className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-200"
              >
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="max-w-[280px] truncate">{file.title || file.name}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {dirs.length === 0 && files.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          No pages in this section yet.
        </div>
      ) : null}
    </div>
  )
}

