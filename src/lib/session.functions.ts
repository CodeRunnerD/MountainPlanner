import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import { getServerSupabase } from './supabase.server'

export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = getServerSupabase()
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) return null
  return data.session
})

export const requireAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = getServerSupabase()
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) {
    throw redirect({ to: '/login' })
  }
  return data.session
})

export const getUserWithProfile = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = getServerSupabase()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single()

  if (profileError) return null
  return { user: authData.user, profile } as { user: typeof authData.user; profile: typeof profile }
})

export const requireRouteEditableServer = createServerFn({ method: 'GET' })
  .handler(async ({ request }) => {
    const url = new URL(request.url)
    const segments = url.pathname.split('/').filter(Boolean)
    const routeIndex = segments.indexOf('routes')
    const routeId = routeIndex >= 0 ? segments[routeIndex + 1] ?? '' : ''
    const supabase = getServerSupabase()
    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) {
      throw redirect({ to: '/login' })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    if (profile?.role === 'organizer') {
      return true
    }

    const { data: route } = await supabase
      .from('routes')
      .select('status, created_by')
      .eq('id', routeId)
      .single()

    if (
      profile?.role === 'expedition_lead' &&
      route?.created_by === authData.user.id &&
      route?.status !== 'published'
    ) {
      return true
    }

    throw redirect({ to: '/' })
  })
