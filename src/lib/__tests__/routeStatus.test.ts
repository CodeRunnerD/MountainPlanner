import { describe, it, expect } from 'vitest'
import { canTransition, getVisibleStatuses, getEditableStatuses, getStatusLabel, getStatusColor } from '../routeStatus'

describe('canTransition', () => {
  // Organizer transitions
  it('allows organizer to publish draft', () => {
    expect(canTransition('draft', 'published', 'organizer', true)).toBe(true)
  })

  it('allows organizer to send draft to pending', () => {
    expect(canTransition('draft', 'pending_approval', 'organizer', true)).toBe(true)
  })

  it('allows organizer to approve pending', () => {
    expect(canTransition('pending_approval', 'published', 'organizer', false)).toBe(true)
  })

  it('allows organizer to reject pending to draft', () => {
    expect(canTransition('pending_approval', 'draft', 'organizer', false)).toBe(true)
  })

  it('allows organizer to unpublish to draft', () => {
    expect(canTransition('published', 'draft', 'organizer', false)).toBe(true)
  })

  it('allows organizer to keep same status', () => {
    expect(canTransition('published', 'published', 'organizer', false)).toBe(true)
  })

  // Expedition lead transitions
  it('allows expedition lead to save draft', () => {
    expect(canTransition('draft', 'draft', 'expedition_lead', true)).toBe(true)
  })

  it('allows expedition lead to send for approval', () => {
    expect(canTransition('draft', 'pending_approval', 'expedition_lead', true)).toBe(true)
  })

  it('blocks expedition lead from publishing directly', () => {
    expect(canTransition('draft', 'published', 'expedition_lead', true)).toBe(false)
  })

  it('blocks expedition lead from editing published route', () => {
    expect(canTransition('published', 'pending_approval', 'expedition_lead', true)).toBe(false)
  })

  it('blocks expedition lead from reverting pending to draft', () => {
    expect(canTransition('pending_approval', 'draft', 'expedition_lead', true)).toBe(false)
  })

  it('blocks non-creator expedition lead', () => {
    expect(canTransition('draft', 'pending_approval', 'expedition_lead', false)).toBe(false)
  })

  // Participant transitions
  it('blocks participant from any transition', () => {
    expect(canTransition('draft', 'published', 'participant', true)).toBe(false)
    expect(canTransition('published', 'draft', 'participant', true)).toBe(false)
  })
})

describe('getVisibleStatuses', () => {
  it('returns all statuses for organizer', () => {
    expect(getVisibleStatuses('organizer')).toEqual(['draft', 'pending_approval', 'published'])
  })

  it('returns all statuses for expedition_lead', () => {
    expect(getVisibleStatuses('expedition_lead')).toEqual(['draft', 'pending_approval', 'published'])
  })

  it('returns only published for participant', () => {
    expect(getVisibleStatuses('participant')).toEqual(['published'])
  })
})

describe('getEditableStatuses', () => {
  it('returns all statuses for organizer', () => {
    expect(getEditableStatuses('organizer')).toEqual(['draft', 'pending_approval', 'published'])
  })

  it('returns draft and pending for expedition_lead', () => {
    expect(getEditableStatuses('expedition_lead')).toEqual(['draft', 'pending_approval'])
  })

  it('returns empty for participant', () => {
    expect(getEditableStatuses('participant')).toEqual([])
  })
})

describe('getStatusLabel', () => {
  it('returns correct labels', () => {
    expect(getStatusLabel('draft')).toBe('Borrador')
    expect(getStatusLabel('pending_approval')).toBe('Pendiente de aprobación')
    expect(getStatusLabel('published')).toBe('Publicada')
  })
})

describe('getStatusColor', () => {
  it('returns string with status colors', () => {
    expect(getStatusColor('draft')).toContain('gray')
    expect(getStatusColor('pending_approval')).toContain('yellow')
    expect(getStatusColor('published')).toContain('green')
  })
})
