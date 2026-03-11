export type BroadcastLevel = 'info' | 'warning' | 'error'

export type BroadcastMessage = {
  id: string
  message: string
  title?: string | null
  image_url?: string | null
  level: BroadcastLevel
  created_at: string
  expires_at?: string | null
  show_to_users?: boolean
  read_at?: string | null
}

export type BroadcastListResponse = {
  broadcasts: BroadcastMessage[]
}
