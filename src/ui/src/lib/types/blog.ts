export interface BlogSummary {
  id: string
  title: string
  slug: string
  cite_url?: string | null
  excerpt?: string | null
  title_figure_url?: string | null
  created_at: string
  updated_at: string
  is_published: boolean
}

export interface BlogDetail extends BlogSummary {
  content: string
}

export interface BlogListResponse {
  items: BlogSummary[]
  total: number
  skip: number
  limit: number
}

export interface BlogAssetResponse {
  id: string
  url: string
}
