import { describe, it, expect, vi } from 'vitest'
import { requireApprovedOrganizer } from '../route-guards'
import { redirect } from '@tanstack/react-router'

vi.mock('@tanstack/react-router', () => ({
  redirect: vi.fn((opts: { to: string }) => {
    const err = new Error(`Redirect to ${opts.to}`)
    ;(err as any).name = 'RedirectError'
    throw err
  }),
}))

describe('requireApprovedOrganizer', () => {
  it('allows approved organizer', () => {
    expect(() =>
      requireApprovedOrganizer({ role: 'organizer', approval_status: 'active' })
    ).not.toThrow()
  })

  it('allows approved expedition_lead', () => {
    expect(() =>
      requireApprovedOrganizer({ role: 'expedition_lead', approval_status: 'active' })
    ).not.toThrow()
  })

  it('redirects participant to home', () => {
    expect(() =>
      requireApprovedOrganizer({ role: 'participant', approval_status: 'active' })
    ).toThrow('Redirect to /')
  })

  it('redirects pending organizer to waiting-approval', () => {
    expect(() =>
      requireApprovedOrganizer({ role: 'organizer', approval_status: 'pending' })
    ).toThrow('Redirect to /waiting-approval')
  })

  it('redirects rejected organizer to waiting-approval', () => {
    expect(() =>
      requireApprovedOrganizer({ role: 'organizer', approval_status: 'rejected' })
    ).toThrow('Redirect to /waiting-approval')
  })

  it('redirects null profile to home', () => {
    expect(() => requireApprovedOrganizer(null)).toThrow('Redirect to /')
  })

  it('redirects undefined profile to home', () => {
    expect(() => requireApprovedOrganizer(undefined)).toThrow('Redirect to /')
  })
})
