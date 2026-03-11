import { useQuery } from '@tanstack/react-query'
import * as blogApi from '@/lib/api/blogs'

export const blogKeys = {
  all: ['blogs'] as const,
  list: (params?: { skip?: number; limit?: number }) => [...blogKeys.all, 'list', params] as const,
  detail: (blogId: string) => [...blogKeys.all, 'detail', blogId] as const,
}

export function useBlogs(params?: { skip?: number; limit?: number }) {
  return useQuery({
    queryKey: blogKeys.list(params),
    queryFn: () => blogApi.getBlogs(params),
  })
}

export function useBlog(blogId?: string) {
  return useQuery({
    queryKey: blogId ? blogKeys.detail(blogId) : blogKeys.all,
    queryFn: () => blogApi.getBlog(blogId || ''),
    enabled: Boolean(blogId),
  })
}
