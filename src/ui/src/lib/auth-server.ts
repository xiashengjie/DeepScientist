/**
 * Server-side authentication utilities.
 *
 * These functions can be used in:
 * - Server Components
 * - Server Actions
 * - Route Handlers
 */

import { cookies } from 'next/headers'
import { AUTH_COOKIE_NAME } from '@/lib/auth-constants'

// Cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

/**
 * Get the auth token from cookies.
 * Can be used in Server Components.
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null
}

/**
 * Check if user is authenticated.
 * Can be used in Server Components.
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken()
  return !!token
}

/**
 * Set the auth token cookie.
 * Can be used in Server Actions and Route Handlers.
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE_NAME, token, COOKIE_OPTIONS)
}

/**
 * Remove the auth token cookie.
 * Can be used in Server Actions and Route Handlers.
 */
export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)
}

/**
 * Validate the auth token with the backend.
 * Returns user data if valid, null otherwise.
 */
export async function validateToken(token: string): Promise<UserData | null> {
  try {
    const remoteDefaultApiUrl = 'http://deepscientist.cc:8080'
    const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')
    const apiUrl =
      configuredApiUrl && configuredApiUrl !== remoteDefaultApiUrl
        ? configuredApiUrl
        : process.env.NODE_ENV === 'production'
          ? remoteDefaultApiUrl
          : 'http://localhost:8080'
    const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Token validation failed:', error)
    return null
  }
}

import type { UILanguage } from '@/lib/i18n/types'

/**
 * Get current user from the auth token.
 * Validates the token with the backend.
 */
export async function getCurrentUser(): Promise<UserData | null> {
  const token = await getAuthToken()
  if (!token) return null

  return validateToken(token)
}

// User data type
export interface UserData {
  id: string
  email: string
  username: string
  role: string
  user_type: string
  ui_language?: UILanguage
  nationality?: string | null
  is_active: boolean
  created_at: string
  google_name?: string
  google_picture?: string | null
  avatar_url?: string | null
}
