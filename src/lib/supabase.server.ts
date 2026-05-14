import { createServerClient, parseCookieHeader } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { getRequest } from '@tanstack/react-start/server'
import type { Database } from '#/types/database.types'

// Admin client for seeding / admin ops (service_role, no RLS)
export const supabaseAdmin = createClient<Database>(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

// Request-scoped client for SSR auth checks (reads user cookies)
export function getServerSupabase() {
  const request = getRequest()
  const cookieHeader = request.headers.get('cookie') ?? ''
  const cookies = parseCookieHeader(cookieHeader)

  return createServerClient<Database>(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookies.map((c) => ({ name: c.name, value: c.value ?? '' }))
        },
        setAll() {
          // Read-only for session validation; client handles cookie updates
        },
      },
    }
  )
}
