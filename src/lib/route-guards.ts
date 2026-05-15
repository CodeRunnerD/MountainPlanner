import { redirect } from '@tanstack/react-router'
import type { Tables } from '#/types/database.types'

interface ProfileLike {
  role?: string | null
  approval_status?: string | null
}

export function requireApprovedOrganizer(profile?: ProfileLike | null): void {
  const role = profile?.role
  const approvalStatus = profile?.approval_status

  if (role !== 'organizer' && role !== 'expedition_lead') {
    throw redirect({ to: '/' })
  }

  if (approvalStatus !== 'active') {
    throw redirect({ to: '/waiting-approval' })
  }
}

export function canEditRoute(
  route: Pick<Tables<'routes'>, 'status' | 'created_by'>,
  profile?: ProfileLike | null,
  userId?: string,
): boolean {
  const role = profile?.role
  const isCreator = route.created_by === userId

  if (role === 'organizer') return true
  if (role === 'expedition_lead') {
    return isCreator && route.status !== 'published'
  }
  return false
}

export function requireRouteEditable(
  route: Pick<Tables<'routes'>, 'status' | 'created_by'>,
  profile?: ProfileLike | null,
  userId?: string,
): void {
  if (!canEditRoute(route, profile, userId)) {
    throw redirect({ to: '/' })
  }
}
