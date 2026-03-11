import { apiClient } from './client'
import type { BlogDetail, BlogListResponse } from '@/lib/types/blog'

const BLOGS_BASE = '/api/v1/blogs'

export async function getBlogs(params?: { skip?: number; limit?: number }): Promise<BlogListResponse> {
  const response = await apiClient.get<BlogListResponse>(BLOGS_BASE, { params })
  return response.data
}

export async function getBlog(blogId: string): Promise<BlogDetail> {
  const response = await apiClient.get<BlogDetail>(`${BLOGS_BASE}/${blogId}`)
  return response.data
}
