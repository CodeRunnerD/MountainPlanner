import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent } from '#/components/ui/card'
import { supabase } from '#/lib/supabase'
import { useIsOrganizer } from './_app'
import { useState, useEffect } from 'react'
import {
  Calendar,
  Search,
  Plus,
  ArrowRight,
  MapPin,
  Users,
  Clock,
  Loader2,
} from 'lucide-react'
import type { Tables } from '#/types/database.types'

type Trip = Tables<'trips'>
type Route = Tables<'routes'>
type Profile = Tables<'profiles'>
type TripParticipant = Tables<'trip_participants'>

export const Route = createFileRoute('/_app/trips')({
  component: TripsListPage,
})

function TripsListPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [trips, setTrips] = useState<Trip[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [participants, setParticipants] = useState<TripParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const isOrganizer = useIsOrganizer()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [{ data: t }, { data: r }, { data: p }, { data: tp }] = await Promise.all([
        supabase.from('trips').select('*').order('start_date', { ascending: true }),
        supabase.from('routes').select('id, name'),
        supabase.from('profiles').select('*'),
        supabase.from('trip_participants').select('*'),
      ])
      setTrips(t || [])
      setRoutes(r || [])
      setProfiles(p || [])
      setParticipants(tp || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const filtered = trips.filter((trip) => {
    const routeName = routes.find((r) => r.id === trip.route_id)?.name ?? ''
    const matchesSearch =
      trip.title.toLowerCase().includes(search.toLowerCase()) ||
      routeName.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || trip.status === filter
    return matchesSearch && matchesFilter
  })

  const statusFilters = [
    { value: 'all', label: 'Todas' },
    { value: 'draft', label: 'Borradores' },
    { value: 'open', label: 'Abiertas' },
    { value: 'closed', label: 'Cerradas' },
    { value: 'completed', label: 'Completadas' },
  ]

  const statusColors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    open: 'bg-primary/10 text-primary',
    closed: 'bg-secondary/20 text-secondary',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-destructive/10 text-destructive',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Salidas</h1>
          <p className="text-muted-foreground">Gestiona excursiones y participantes</p>
        </div>
        {isOrganizer && (
          <Button asChild>
            <Link to="/trips/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva salida
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar salidas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusFilters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((trip) => {
          const route = routes.find((r) => r.id === trip.route_id)
          const organizer = profiles.find((p) => p.id === trip.organizer_id)
          const tripParticipants = participants.filter((p) => p.trip_id === trip.id)
          const confirmed = tripParticipants.filter((p) => p.status === 'confirmed').length

          return (
            <Card
              key={trip.id}
              className="border-border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{trip.title}</h3>
                    <Badge className={`${statusColors[trip.status]} capitalize border-0`}>
                      {trip.status}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {route?.name ?? '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(trip.start_date).toLocaleDateString('es-CO')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {trip.pace}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Organiza {organizer?.display_name} · {trip.meeting_point ?? 'Punto de encuentro por definir'}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">{confirmed}</p>
                    <p className="text-xs text-muted-foreground">
                      / {trip.max_participants ?? '∞'} confirmados
                    </p>
                  </div>
                  <Button size="sm" asChild>
                    <Link to="/trips/$tripId" params={{ tripId: trip.id }}>
                      Ver <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
