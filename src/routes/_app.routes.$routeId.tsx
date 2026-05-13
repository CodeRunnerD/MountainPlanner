import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { supabase } from '#/lib/supabase'
import { useIsOrganizer } from './_app'
import { useState, useEffect } from 'react'
import {
  Map,
  ArrowLeft,
  TrendingUp,
  Layers,
  Calendar,
  Mountain,
  Navigation,
  Flag,
  CircleDot,
  Star,
  Loader2,
} from 'lucide-react'
import type { Tables } from '#/types/database.types'

type Route = Tables<'routes'>
type RouteWaypoint = Tables<'route_waypoints'>
type RouteSkill = Tables<'route_skill_requirements'>
type Profile = Tables<'profiles'>
type Trip = Tables<'trips'>

export const Route = createFileRoute('/_app/routes/$routeId')({
  component: RouteDetailPage,
})

function RouteDetailPage() {
  const { routeId } = Route.useParams()
  const [route, setRoute] = useState<Route | null>(null)
  const [waypoints, setWaypoints] = useState<RouteWaypoint[]>([])
  const [skills, setSkills] = useState<RouteSkill[]>([])
  const [creator, setCreator] = useState<Profile | null>(null)
  const [tripsUsing, setTripsUsing] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const isOrganizer = useIsOrganizer()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: r } = await supabase.from('routes').select('*').eq('id', routeId).single()
      if (!r) {
        setLoading(false)
        return
      }
      setRoute(r)

      const [{ data: w }, { data: s }, { data: c }, { data: t }] = await Promise.all([
        supabase.from('route_waypoints').select('*').eq('route_id', routeId),
        supabase.from('route_skill_requirements').select('*').eq('route_id', routeId),
        supabase.from('profiles').select('*').eq('id', r.created_by).single(),
        supabase.from('trips').select('id, title, start_date').eq('route_id', routeId),
      ])

      setWaypoints(w || [])
      setSkills(s || [])
      setCreator(c)
      setTripsUsing(t || [])
      setLoading(false)
    }
    fetchData()
  }, [routeId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!route) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Ruta no encontrada</p>
        <Button asChild variant="link">
          <Link to="/routes">Volver a rutas</Link>
        </Button>
      </div>
    )
  }

  const getWaypointIcon = (type: string) => {
    switch (type) {
      case 'start': return <Navigation className="h-4 w-4 text-primary" />
      case 'summit': return <Star className="h-4 w-4 text-accent" />
      case 'end': return <Flag className="h-4 w-4 text-destructive" />
      default: return <CircleDot className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="gap-1">
        <Link to="/routes">
          <ArrowLeft className="h-4 w-4" /> Volver a rutas
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{route.name}</h1>
          <p className="text-muted-foreground mt-1">{route.description}</p>
        </div>
        <div className="flex gap-2">
          {isOrganizer && (
            <Button variant="outline" asChild>
              <Link to="/routes/$routeId/edit" params={{ routeId: route.id }}>Editar</Link>
            </Button>
          )}
          <Button asChild>
            <Link to="/trips/new" search={{ routeId: route.id }}>Crear salida</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-bold text-foreground">{(route.gpx_parsed as any)?.distance ?? 0} km</p>
              <p className="text-xs text-muted-foreground">Distancia</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Layers className="h-5 w-5 text-secondary" />
            <div>
              <p className="text-lg font-bold text-foreground">{(route.gpx_parsed as any)?.elevation_gain ?? 0} m</p>
              <p className="text-xs text-muted-foreground">Desnivel positivo</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Mountain className="h-5 w-5 text-accent" />
            <div>
              <p className="text-lg font-bold text-foreground">
                {waypoints.find((w) => w.type === 'summit')?.elevation ?? '—'} m
              </p>
              <p className="text-xs text-muted-foreground">Cumbre</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              Waypoints
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {waypoints.sort((a, b) => a.order_index - b.order_index).map((wp) => (
              <div
                key={wp.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3"
              >
                {getWaypointIcon(wp.type)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{wp.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {wp.elevation ? `${wp.elevation} m` : '—'}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {wp.type}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Habilidades requeridas</CardTitle>
            </CardHeader>
            <CardContent>
              {skills.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin requisitos técnicos</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <Badge key={s.id} variant="secondary">
                      {s.skill_tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creado por</span>
                <span className="font-medium">{creator?.display_name ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha</span>
                <span>{new Date(route.created_at).toLocaleDateString('es-CO')}</span>
              </div>
              {route.source_url && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fuente</span>
                  <a
                    href={route.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline truncate max-w-[200px]"
                  >
                    Wikiloc
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {tripsUsing.length > 0 && (
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Salidas usando esta ruta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tripsUsing.map((trip) => (
                  <Link
                    key={trip.id}
                    to="/trips/$tripId"
                    params={{ tripId: trip.id }}
                    className="block rounded-md p-2 text-sm hover:bg-muted transition-colors"
                  >
                    {trip.title}
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
