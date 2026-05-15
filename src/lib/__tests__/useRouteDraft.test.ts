import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRouteDraft } from '../../hooks/useRouteDraft'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

describe('useRouteDraft', () => {
  const userId = 'test-user-123'

  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock)
    localStorageMock.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads empty draft when none exists', () => {
    const { result } = renderHook(() => useRouteDraft(userId))
    expect(result.current.draft).toBeNull()
    expect(result.current.hasDraft()).toBe(false)
  })

  it('saves and loads draft', () => {
    const { result } = renderHook(() => useRouteDraft(userId))

    act(() => {
      result.current.saveDraft({
        name: 'Test Route',
        description: 'Desc',
        story: 'Story',
        coverImage: '',
        difficulty: 'beginner',
        sourceUrl: '',
        skills: [],
        waypoints: [{ lat: 1, lng: 2, name: 'WP1', type: 'start' }],
        trackPoints: [[1, 2]],
        gpxFileName: null,
      })
    })

    expect(result.current.hasDraft()).toBe(true)
    expect(result.current.draft?.name).toBe('Test Route')

    // Simulate reload: new hook instance
    const { result: result2 } = renderHook(() => useRouteDraft(userId))
    expect(result2.current.hasDraft()).toBe(true)
    expect(result2.current.draft?.name).toBe('Test Route')
  })

  it('debounces save', () => {
    const { result } = renderHook(() => useRouteDraft(userId))

    act(() => {
      result.current.debouncedSave({
        name: 'Debounced',
        description: '',
        story: '',
        coverImage: '',
        difficulty: '',
        sourceUrl: '',
        skills: [],
        waypoints: [],
        trackPoints: [],
        gpxFileName: null,
      })
    })

    expect(result.current.draft).toBeNull()

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.draft?.name).toBe('Debounced')
  })

  it('clears draft', () => {
    const { result } = renderHook(() => useRouteDraft(userId))

    act(() => {
      result.current.saveDraft({
        name: 'To Clear',
        description: '',
        story: '',
        coverImage: '',
        difficulty: '',
        sourceUrl: '',
        skills: [],
        waypoints: [],
        trackPoints: [],
        gpxFileName: null,
      })
    })

    expect(result.current.hasDraft()).toBe(true)

    act(() => {
      result.current.clearDraft()
    })

    expect(result.current.hasDraft()).toBe(false)
    expect(result.current.draft).toBeNull()
  })

  it('does not save draft exceeding 5 MB', () => {
    const { result } = renderHook(() => useRouteDraft(userId))
    const hugeWaypoints = Array.from({ length: 100000 }, (_, i) => ({
      lat: i,
      lng: i,
      name: 'A'.repeat(100),
      type: 'waypoint' as const,
    }))

    act(() => {
      result.current.saveDraft({
        name: 'Huge',
        description: '',
        story: '',
        coverImage: '',
        difficulty: '',
        sourceUrl: '',
        skills: [],
        waypoints: hugeWaypoints,
        trackPoints: [],
        gpxFileName: null,
      })
    })

    expect(result.current.hasDraft()).toBe(false)
  })
})
