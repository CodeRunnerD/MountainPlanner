import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import {
  mockTrips,
  mockRoutes,
  mockProfiles,
  mockTripParticipants,
} from '#/lib/mock-data'
import {
  Calendar,
  Search,
  Plus,
  ArrowRight,
  MapPin,
  Users,
  Clock,
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_app/trips')({
  component: TripsListPage,
})

function TripsListPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')

  const filtered = mockTrips.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      mockRoutes.find((r) => r.id === t.route_id)?.name.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || t.status === filter
    return matchesSearch && matchesFilter
  })

  const statusFilters = [
    { value: 'all', label: 'Todas' },
    { value: 'draft', label: 'Borradores' },
    { value: 'open', label: 'Abiertas' },
    { value: 'closed', label: 'Cerradas' },
    { value: 'completed', label: 'Completadas' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Salidas</h1>
          <p className="text-muted-foreground">Gestiona excursiones y participantes</p>
        </div>
        <Button asChild>
          <Link to="/trips/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva salida
          </Link>
        </Button>
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
          const route = mockRoutes.find((r) => r.id === trip.route_id)
          const organizer = mockProfiles.find((p) => p.id === trip.organizer_id)
          const participants = mockTripParticipants.filter((p) => p.trip_id === trip.id)
          const confirmed = participants.filter((p) => p.status === 'confirmed').length

          const statusColors: Record<string, string> = {
            draft: 'bg-muted text-muted-foreground',
            open: 'bg-primary/10 text-primary',
            closed: 'bg-secondary/20 text-secondary',
            completed: 'bg-green-100 text-green-700',
            cancelled: 'bg-destructive/10 text-destructive',
          }

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
