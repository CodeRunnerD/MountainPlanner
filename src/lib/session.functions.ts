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
