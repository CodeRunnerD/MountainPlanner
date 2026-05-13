import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { supabase } from '#/lib/supabase'
import { useIsOrganizer } from './_app'
import { useState, useEffect } from 'react'
import {
  Calendar,
  Map,
  Users,
  Mountain,
  ArrowRight,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import type { Tables } from '#/types/database.types'

type Trip = Tables<'trips'>
type Route = Tables<'routes'>
type TripParticipant = Tables<'trip_participants'>

export const Route = createFileRoute('/_app/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [participants, setParticipants] = useState<TripParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const isOrganizer = useIsOrganizer()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [{ data: t }, { data: r }, { data: p }] = await Promise.all([
        supabase.from('trips').select('*').order('start_date', { ascending: true }),
        supabase.from('routes').select('*').order('created_at', { ascending: false }).limit(4),
        supabase.from('trip_participants').select('*'),
      ])
      setTrips(t || [])
      setRoutes(r || [])
      setParticipants(p || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const upcomingTrips = trips.filter((t) =>
    ['draft', 'open'].includes(t.status)
  )
  const totalRoutes = routes.length
  const totalParticipants = participants.length

  const stats = [
    {
      label: 'Próximas salidas',
      value: upcomingTrips.length,
      icon: Calendar,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Rutas registradas',
      value: totalRoutes,
      icon: Map,
      color: 'text-secondary',
      bg: 'bg-secondary/20',
    },
    {
      label: 'Participantes',
      value: totalParticipants,
      icon: Users,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Resumen de actividad</p>
        </div>
        {isOrganizer && (
          <Button asChild>
            <Link to="/trips/new">
              <Mountain className="mr-2 h-4 w-4" />
              Nueva salida
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-lg ${stat.bg} p-3`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Próximas salidas</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/trips" className="gap-1">
                Ver todas <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingTrips.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay salidas programadas</p>
            ) : (
              upcomingTrips.map((trip) => {
                const route = routes.find((r) => r.id === trip.route_id)
                const participantCount = participants.filter(
                  (p) => p.trip_id === trip.id
                ).length
                return (
                  <Link
                    key={trip.id}
                    to="/trips/$tripId"
                    params={{ tripId: trip.id }}
                    className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-3 transition-colors hover:bg-muted"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{trip.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {route?.name} · {new Date(trip.start_date).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={trip.status === 'open' ? 'default' : 'secondary'}
                      >
                        {trip.status}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {participantCount}/{trip.max_participants ?? '∞'}
                      </span>
                    </div>
                  </Link>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Rutas recientes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/routes" className="gap-1">
                Ver todas <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {routes.map((route) => (
              <Link
                key={route.id}
                to="/routes/$routeId"
                params={{ routeId: route.id }}
                className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-3 transition-colors hover:bg-muted"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{route.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(route.gpx_parsed as any)?.distance ?? 0} km · {(route.gpx_parsed as any)?.elevation_gain ?? 0} m+
                  </p>
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
